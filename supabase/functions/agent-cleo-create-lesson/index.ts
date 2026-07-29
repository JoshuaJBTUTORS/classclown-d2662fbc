// Agent Cleo — lesson creation endpoint.
// Only owner/admin users may call this. Every proposal is re-validated server-side;
// the client-sent payload is never trusted as-is.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const INTERVAL_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 28,
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Europe/London offset (in minutes) that applies at a given instant. */
function londonOffsetMinutes(at: Date): number {
  const tzDate = new Date(at.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const utcDate = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
}

/**
 * Add N days to an instant while keeping the same Europe/London wall-clock time,
 * so a 17:00 lesson stays at 17:00 across a DST boundary.
 */
function addDaysKeepingLondonTime(base: Date, days: number): Date {
  const naive = new Date(base.getTime() + days * 86400000);
  const drift = londonOffsetMinutes(base) - londonOffsetMinutes(naive);
  return new Date(naive.getTime() + drift * 60000);
}

function londonWeekday(at: Date): string {
  const name = at.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
  });
  return name.toLowerCase();
}

function londonDateString(at: Date): string {
  // en-CA gives YYYY-MM-DD
  return at.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Missing Authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid token" }, 401);

    const { data: roles } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const allowed = (roles ?? []).some((r) => r.role === "admin" || r.role === "owner");
    if (!allowed) return json({ error: "Forbidden — admin/owner only" }, 403);

    const body = await req.json().catch(() => null);
    const p = body?.proposal;
    if (!p || typeof p !== "object") return json({ error: "Missing proposal" }, 400);

    // ---- validate ----
    const errors: string[] = [];

    const title = typeof p.title === "string" ? p.title.trim() : "";
    if (!title || title.length > 200) errors.push("title is required (max 200 chars)");

    const subject = typeof p.subject === "string" ? p.subject.trim() : "";
    if (!subject || subject.length > 120) errors.push("subject is required (max 120 chars)");

    const description =
      typeof p.description === "string" ? p.description.trim().slice(0, 2000) : null;

    const tutorId = typeof p.tutor_id === "string" ? p.tutor_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(tutorId)) errors.push("tutor_id must be a valid uuid");

    const studentIds: number[] = Array.isArray(p.student_ids)
      ? p.student_ids.map((s: unknown) => Number(s)).filter((n: number) => Number.isInteger(n))
      : [];
    if (studentIds.length === 0) errors.push("at least one student_id is required");
    if (studentIds.length > 30) errors.push("too many students (max 30)");

    const start = new Date(p.start_time);
    const end = new Date(p.end_time);
    if (isNaN(start.getTime())) errors.push("start_time is not a valid date");
    if (isNaN(end.getTime())) errors.push("end_time is not a valid date");
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (end <= start) errors.push("end_time must be after start_time");
      const mins = (end.getTime() - start.getTime()) / 60000;
      if (mins > 8 * 60) errors.push("lesson cannot be longer than 8 hours");
      if (start.getTime() < Date.now() - 365 * 86400000) errors.push("start_time is too far in the past");
    }

    let interval: string | null = null;
    let occurrences = 1;
    if (p.recurring) {
      interval = String(p.recurring.interval ?? "weekly").toLowerCase();
      if (!INTERVAL_DAYS[interval]) errors.push("recurring.interval must be daily, weekly, biweekly or monthly");
      occurrences = Number(p.recurring.occurrences ?? 12);
      if (!Number.isInteger(occurrences) || occurrences < 2 || occurrences > 52) {
        errors.push("recurring.occurrences must be an integer between 2 and 52");
      }
    }

    if (errors.length) return json({ error: errors.join("; ") }, 400);

    const { data: tutor } = await service
      .from("tutors")
      .select("id, first_name, last_name")
      .eq("id", tutorId)
      .maybeSingle();
    if (!tutor) return json({ error: "Tutor not found" }, 400);

    const { data: students } = await service
      .from("students")
      .select("id, first_name, last_name")
      .in("id", studentIds);
    const foundIds = (students ?? []).map((s) => s.id);
    const missing = studentIds.filter((id) => !foundIds.includes(id));
    if (missing.length) return json({ error: `Student(s) not found: ${missing.join(", ")}` }, 400);

    const isGroup = typeof p.is_group === "boolean" ? p.is_group : studentIds.length > 1;

    // ---- create parent lesson ----
    const parentRow: Record<string, unknown> = {
      title,
      description,
      subject,
      tutor_id: tutorId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_group: isGroup,
      status: "scheduled",
      lesson_type: "regular",
      is_recurring: !!interval,
      recurrence_interval: interval,
      recurrence_day: interval ? londonWeekday(start) : null,
      instance_date: londonDateString(start),
    };

    const createdIds: string[] = [];

    const { data: parent, error: parentErr } = await service
      .from("lessons")
      .insert(parentRow)
      .select("id")
      .single();
    if (parentErr) return json({ error: `Failed to create lesson: ${parentErr.message}` }, 500);
    createdIds.push(parent.id);

    const linkStudents = async (lessonId: string) => {
      const rows = studentIds.map((student_id) => ({ lesson_id: lessonId, student_id }));
      const { error } = await service.from("lesson_students").insert(rows);
      if (error) throw new Error(`Failed to link students: ${error.message}`);
    };

    try {
      await linkStudents(parent.id);

      if (interval) {
        const step = INTERVAL_DAYS[interval];
        let cursorStart = start;
        let cursorEnd = end;
        let lastStart = start;

        for (let i = 1; i < occurrences; i++) {
          cursorStart = addDaysKeepingLondonTime(cursorStart, step);
          cursorEnd = addDaysKeepingLondonTime(cursorEnd, step);
          lastStart = cursorStart;

          const { data: child, error: childErr } = await service
            .from("lessons")
            .insert({
              ...parentRow,
              is_recurring: false,
              recurrence_interval: null,
              recurrence_day: null,
              start_time: cursorStart.toISOString(),
              end_time: cursorEnd.toISOString(),
              parent_lesson_id: parent.id,
              is_recurring_instance: true,
              instance_date: londonDateString(cursorStart),
            })
            .select("id")
            .single();
          if (childErr) throw new Error(`Failed to create occurrence ${i + 1}: ${childErr.message}`);
          createdIds.push(child.id);
          await linkStudents(child.id);
        }

        await service
          .from("lessons")
          .update({ recurrence_end_date: lastStart.toISOString() })
          .eq("id", parent.id);
      }
    } catch (e) {
      // Roll back everything we created so a partial series never lands on the calendar.
      await service.from("lesson_students").delete().in("lesson_id", createdIds);
      await service.from("lessons").delete().in("id", createdIds);
      return json({ error: (e as Error).message }, 500);
    }

    // ---- create LessonSpace rooms (non-fatal) ----
    let roomsCreated = 0;
    let roomsFailed = 0;
    for (const lessonId of createdIds) {
      try {
        const { data: roomData, error: roomError } = await service.functions.invoke(
          "lesson-space-integration",
          { body: { action: "create-room", lessonId } },
        );
        if (!roomError && roomData?.success) {
          roomsCreated++;
        } else {
          roomsFailed++;
          const msg = roomError?.message ?? roomData?.error ?? "Unknown room creation error";
          console.error(`Room creation failed for ${lessonId}: ${msg}`);
          await service.from("failed_room_creations").upsert(
            {
              lesson_id: lessonId,
              error_message: String(msg).slice(0, 500),
              error_code: roomError?.status ?? roomData?.external_status ?? null,
              attempt_count: 1,
              last_attempt_at: new Date().toISOString(),
              resolved: false,
            },
            { onConflict: "lesson_id" },
          );
        }
      } catch (roomEx) {
        roomsFailed++;
        console.error(`Room creation exception for ${lessonId}`, roomEx);
        await service.from("failed_room_creations").upsert(
          {
            lesson_id: lessonId,
            error_message: (roomEx as Error).message?.slice(0, 500) ?? "Exception",
            error_code: null,
            attempt_count: 1,
            last_attempt_at: new Date().toISOString(),
            resolved: false,
          },
          { onConflict: "lesson_id" },
        );
      }
      // Respect LessonSpace rate limit (~4 req/sec)
      await new Promise((r) => setTimeout(r, 250));
    }

    return json({
      ok: true,
      lesson_id: parent.id,
      created_count: createdIds.length,
      lesson_ids: createdIds,
      rooms_created: roomsCreated,
      rooms_failed: roomsFailed,
      tutor: `${tutor.first_name} ${tutor.last_name}`.trim(),
      students: (students ?? []).map((s) => `${s.first_name} ${s.last_name}`.trim()),
    });
  } catch (e) {
    console.error("agent-cleo-create-lesson error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
