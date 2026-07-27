import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Weekly Homework Sync → HeyCleo
 *
 * Aggregates each active student's homework briefs from the London week that
 * just ended, groups by subject, and POSTs the summary to the HeyCleo receiver
 * so HeyCleo can generate the actual homework per child.
 *
 * Design mirrors `heycleo-homework-webhook`:
 *  - CORS + OPTIONS preflight
 *  - POST-only, JSON, snake_case payloads
 *  - Shared secret via HEYCLEO_CROSS_PLATFORM_SECRET (body + header)
 *  - Structured console logging
 *  - Per-student outcomes logged to `notifications`
 *
 * Body (all optional):
 *   { week_start?: "YYYY-MM-DD",  // London Monday; default = previous Monday
 *     student_ids?: number[],     // subset of students to sync
 *     dry_run?: boolean }         // build payloads, log, but don't POST
 */

interface SubjectAggregate {
  subject: string;
  year_group: string | null;
  topics: string[];
  difficulty_tag: number; // 1 or 2
  lesson_count: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Monday 00:00 of the London week that contains d.
function londonMondayOf(d: Date): Date {
  const london = new Date(d.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const day = london.getDay();
  const diffToMonday = (day + 6) % 7;
  london.setHours(0, 0, 0, 0);
  london.setDate(london.getDate() - diffToMonday);
  return london;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function pickMostCommon<T extends string | null>(values: T[]): T | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return (best ?? null) as T | null;
}

async function postWithRetry(url: string, headers: Record<string, string>, body: string) {
  const maxAttempts = 3;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      lastStatus = res.status;
      lastBody = await res.text();
      if (res.ok) return { ok: true, status: res.status, body: lastBody };
      // Retry on 5xx, give up on 4xx
      if (res.status < 500) return { ok: false, status: res.status, body: lastBody };
    } catch (err) {
      lastStatus = 0;
      lastBody = err instanceof Error ? err.message : String(err);
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
  return { ok: false, status: lastStatus, body: lastBody };
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const sharedSecret = Deno.env.get("HEYCLEO_CROSS_PLATFORM_SECRET") ?? "";
    const receiverUrl = Deno.env.get("HEYCLEO_WEEKLY_HOMEWORK_URL")
      ?? "https://vfhftrmneaizgdvngfwe.supabase.co/functions/v1/weekly-homework-receiver";


    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase env not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!sharedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "HEYCLEO_CROSS_PLATFORM_SECRET not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const service = createClient(supabaseUrl, serviceKey);

    // Parse body (optional).
    let body: { week_start?: string; student_ids?: number[]; dry_run?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Resolve week (defaults to the London Monday of the PREVIOUS week).
    let weekStart: Date;
    if (body.week_start) {
      weekStart = new Date(`${body.week_start}T00:00:00`);
      if (isNaN(weekStart.getTime())) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid week_start (expected YYYY-MM-DD)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const thisMonday = londonMondayOf(new Date());
      weekStart = new Date(thisMonday);
      weekStart.setDate(weekStart.getDate() - 7);
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekStartIso = toIsoDate(weekStart);
    const weekEndIso = toIsoDate(weekEnd);

    console.log("[weekly-homework-sync] Window", { weekStartIso, weekEndIso, dryRun: !!body.dry_run });

    // Fetch summaries with homework briefs in the window.
    let query = service
      .from("lesson_student_summaries")
      .select(
        "id, student_id, lesson_id, homework_brief, lessons!inner(id, subject, start_time, status)"
      )
      .not("homework_brief", "is", null)
      .gte("lessons.start_time", weekStart.toISOString())
      .lt("lessons.start_time", weekEnd.toISOString())
      .neq("lessons.status", "cancelled");

    if (body.student_ids && body.student_ids.length > 0) {
      query = query.in("student_id", body.student_ids);
    }

    const { data: summaries, error: sumErr } = await query;
    if (sumErr) throw sumErr;

    // Fetch attendance for these lessons/students to filter out no-shows.
    const pairs = (summaries ?? []).map((s: any) => ({ lesson_id: s.lesson_id, student_id: s.student_id }));
    const lessonIds = Array.from(new Set(pairs.map((p) => p.lesson_id)));
    const studentIds = Array.from(new Set(pairs.map((p) => p.student_id)));

    const attendanceMap = new Map<string, string>(); // `${lesson}|${student}` -> status
    if (lessonIds.length > 0 && studentIds.length > 0) {
      const { data: attRows } = await service
        .from("lesson_attendance")
        .select("lesson_id, student_id, attendance_status")
        .in("lesson_id", lessonIds)
        .in("student_id", studentIds);
      (attRows ?? []).forEach((r: any) => {
        attendanceMap.set(`${r.lesson_id}|${r.student_id}`, r.attendance_status);
      });
    }

    // Aggregate: student -> subject -> aggregate.
    type StudentAgg = Map<string, {
      subject: string;
      year_groups: (string | null)[];
      topicsSet: Set<string>;
      difficulty: number;
      lesson_count: number;
    }>;
    const byStudent = new Map<number, StudentAgg>();

    (summaries ?? []).forEach((row: any) => {
      const att = attendanceMap.get(`${row.lesson_id}|${row.student_id}`);
      if (att && !["attended", "late"].includes(att)) return;

      const brief = row.homework_brief || {};
      const subject: string = (brief.subject || row.lessons?.subject || "").trim();
      if (!subject) return;

      const topics: string[] = Array.isArray(brief.topics) ? brief.topics.filter(Boolean) : [];
      const year: string | null = brief.year_group || null;
      const difficultyRaw = Number(brief.difficulty_tag);
      const difficulty = difficultyRaw === 2 ? 2 : 1;

      if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, new Map());
      const subjMap = byStudent.get(row.student_id)!;
      if (!subjMap.has(subject)) {
        subjMap.set(subject, {
          subject,
          year_groups: [],
          topicsSet: new Set(),
          difficulty: 1,
          lesson_count: 0,
        });
      }
      const agg = subjMap.get(subject)!;
      agg.year_groups.push(year);
      topics.forEach((t) => agg.topicsSet.add(String(t).trim()));
      agg.difficulty = Math.max(agg.difficulty, difficulty);
      agg.lesson_count += 1;
    });

    if (byStudent.size === 0) {
      console.log("[weekly-homework-sync] No meaningful homework briefs in window");
      return new Response(
        JSON.stringify({
          success: true,
          week_start: weekStartIso,
          week_end: weekEndIso,
          sent: 0,
          failed: 0,
          skipped: 0,
          note: "No homework briefs found in window",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch student contact info.
    const activeStudentIds = Array.from(byStudent.keys());
    const { data: studentsRows, error: studErr } = await service
      .from("students")
      .select("id, first_name, last_name, email, parent_id")
      .in("id", activeStudentIds);
    if (studErr) throw studErr;

    // Parent emails (may be null; used as fallback contact).
    const parentIds = Array.from(
      new Set((studentsRows ?? []).map((s: any) => s.parent_id).filter(Boolean))
    );
    const parentEmailMap = new Map<string, string>();
    if (parentIds.length > 0) {
      const { data: parentRows } = await service
        .from("parents")
        .select("id, email")
        .in("id", parentIds);
      (parentRows ?? []).forEach((p: any) => {
        if (p.email) parentEmailMap.set(p.id, p.email);
      });
    }

    const studentMap = new Map<number, any>();
    (studentsRows ?? []).forEach((s: any) => studentMap.set(s.id, s));

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const [studentId, subjMap] of byStudent) {
      const student = studentMap.get(studentId);
      if (!student) {
        skipped += 1;
        continue;
      }

      const subjects: SubjectAggregate[] = Array.from(subjMap.values()).map((a) => ({
        subject: a.subject,
        year_group: pickMostCommon(a.year_groups),
        topics: Array.from(a.topicsSet),
        difficulty_tag: a.difficulty,
        lesson_count: a.lesson_count,
      }));

      const syncId = await sha256Hex(`${studentId}|${weekStartIso}`);
      const parent_email = student.parent_id ? parentEmailMap.get(student.parent_id) ?? null : null;

      const payload = {
        secret: sharedSecret,
        sync_id: syncId,
        week_start: weekStartIso,
        week_end: weekEndIso,
        student: {
          id: student.id,
          first_name: student.first_name ?? "",
          last_name: student.last_name ?? "",
          email: student.email ?? null,
          parent_email,
        },
        subjects,
      };

      const contactEmail = student.email || parent_email || `student-${student.id}`;

      const payloadForLog = { ...payload, secret: "***" };
      console.log("[weekly-homework-sync] Payload", { studentId, contactEmail, payload: payloadForLog });

      if (body.dry_run) {
        console.log("[weekly-homework-sync] DRY RUN", { studentId, subjects: subjects.length, sync_id: syncId });
        skipped += 1;
        continue;
      }


      const result = await postWithRetry(
        receiverUrl,
        {
          "Content-Type": "application/json",
          "x-heycleo-secret": sharedSecret,
        },
        JSON.stringify(payload)
      );

      if (result.ok) {
        sent += 1;
        console.log("[weekly-homework-sync] Sent", { studentId, contactEmail, status: result.status });
      } else {
        failed += 1;
        console.error("[weekly-homework-sync] Failed", { studentId, contactEmail, status: result.status, body: result.body?.slice(0, 300) });
      }

      // Log outcome for observability (best-effort).
      try {
        await service.from("notifications").insert({
          type: "heycleo_weekly_homework_sync",
          subject: `${weekStartIso} · ${subjects.length} subjects`,
          email: contactEmail,
          status: result.ok ? "sent" : "failed",
        });
      } catch (logErr) {
        console.warn("[weekly-homework-sync] notification log failed", logErr);
      }
    }

    console.log("[weekly-homework-sync] Done", { weekStartIso, sent, failed, skipped });

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStartIso,
        week_end: weekEndIso,
        sent,
        failed,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[weekly-homework-sync] Error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
