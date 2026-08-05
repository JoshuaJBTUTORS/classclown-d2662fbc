// Tracks whether tutors join their lessons on time.
// Polls the LessonSpace API for lessons currently in progress, records the
// tutor's first join time, and emails the ops team if a tutor is more than
// 5 minutes late.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALERT_RECIPIENTS = [
  "hannah@classbeyondacademy.io",
  "britney@classbeyondacademy.io",
];

const LATE_THRESHOLD_MIN = 5;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LESSONSPACE_API_KEY_HASHED") ?? Deno.env.get("LESSONSPACE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_lessonspace_api_key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();

    // Lessons that have started (up to 90 minutes ago) and have not yet ended
    const { data: lessons, error } = await supabase
      .from("lessons")
      .select("id, title, subject, start_time, end_time, tutor_id, lesson_space_room_id")
      .lte("start_time", new Date(now).toISOString())
      .gte("start_time", new Date(now - 90 * 60 * 1000).toISOString())
      .gte("end_time", new Date(now).toISOString())
      .is("cancelled_at", null)
      .not("lesson_space_room_id", "is", null);

    if (error) throw error;

    const tutorIds = Array.from(new Set((lessons ?? []).map((l: any) => l.tutor_id).filter(Boolean)));
    const tutorMap = new Map<string, string>();
    if (tutorIds.length) {
      const { data: tutors } = await supabase
        .from("tutors")
        .select("id, first_name, last_name")
        .in("id", tutorIds);
      (tutors ?? []).forEach((t: any) =>
        tutorMap.set(t.id, `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim())
      );
    }

    // Batch load enrolment + attendance so we can tell whether any student is
    // actually expected in the room before alerting about a missing tutor.
    const lessonIds = (lessons ?? []).map((l: any) => l.id);
    const enrolled = new Map<string, Set<number>>();
    const notExpected = new Map<string, Set<number>>();
    if (lessonIds.length) {
      const { data: ls } = await supabase
        .from("lesson_students")
        .select("lesson_id, student_id")
        .in("lesson_id", lessonIds);
      (ls ?? []).forEach((r: any) => {
        if (!enrolled.has(r.lesson_id)) enrolled.set(r.lesson_id, new Set());
        enrolled.get(r.lesson_id)!.add(r.student_id);
      });

      const { data: att } = await supabase
        .from("lesson_attendance")
        .select("lesson_id, student_id, attendance_status")
        .in("lesson_id", lessonIds);
      (att ?? []).forEach((r: any) => {
        const st = String(r.attendance_status ?? "").toLowerCase();
        if (st !== "excused" && st !== "absent") return;
        if (!notExpected.has(r.lesson_id)) notExpected.set(r.lesson_id, new Set());
        notExpected.get(r.lesson_id)!.add(r.student_id);
      });
    }

    const expectedStudentCount = (lessonId: string) => {
      const all = enrolled.get(lessonId);
      if (!all || all.size === 0) return 0;
      const skip = notExpected.get(lessonId) ?? new Set<number>();
      let count = 0;
      all.forEach((id) => { if (!skip.has(id)) count += 1; });
      return count;
    };

    const processed: any[] = [];

    for (const lesson of lessons ?? []) {
      const startMs = new Date(lesson.start_time).getTime();
      const minutesSinceStart = Math.floor((now - startMs) / 60000);

      // Existing record
      const { data: existing } = await supabase
        .from("tutor_punctuality")
        .select("id, status, tutor_first_join_at, alert_sent_at")
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      // 1. Look for a webhook-recorded tutor join
      let firstJoin: string | null = null;
      const { data: events } = await supabase
        .from("lesson_participant_events")
        .select("participant_role, occurred_at")
        .eq("lesson_id", lesson.id)
        .eq("event_type", "user.joined")
        .order("occurred_at", { ascending: true });

      const tutorEvent = (events ?? []).find((e: any) =>
        ["teacher", "leader", "tutor", "host"].includes(String(e.participant_role ?? "").toLowerCase())
      );
      if (tutorEvent) firstJoin = tutorEvent.occurred_at;

      // 2. Fall back to polling LessonSpace directly
      if (!firstJoin) {
        try {
          const res = await fetch(
            `https://api.thelessonspace.com/v2/spaces/${lesson.lesson_space_room_id}/sessions/`,
            { headers: { Authorization: `Organisation ${apiKey}` } },
          );
          if (res.ok) {
            const json = await res.json();
            const sessions: any[] = Array.isArray(json) ? json : (json?.results ?? []);
            const active = sessions.find((s) => !s?.end_time) ?? sessions[0] ?? null;
            const profiles: any[] = active?.profiles ?? [];
            const logs: any[] = active?.logs ?? [];
            const teacherProfileIds = profiles
              .filter((p) => String(p?.role ?? "").toLowerCase() === "teacher")
              .map((p) => p?.user);

            // Earliest teacher join within the active session
            const joinLog = logs
              .filter((l) => l?.log_type === "user-joined" && teacherProfileIds.includes(l?.profile))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (joinLog?.date) firstJoin = joinLog.date;
            else if (teacherProfileIds.length && active?.start_time) firstJoin = active.start_time;
          }
        } catch (e) {
          console.error("LessonSpace poll failed", lesson.id, (e as Error).message);
        }
      }

      const tutorName = lesson.tutor_id ? tutorMap.get(lesson.tutor_id) ?? null : null;

      // Earliest wins: keep whichever join time is earlier
      if (existing?.tutor_first_join_at) {
        if (!firstJoin || new Date(existing.tutor_first_join_at).getTime() <= new Date(firstJoin).getTime()) {
          firstJoin = existing.tutor_first_join_at;
        }
      }

      if (firstJoin) {
        const minutesLate = Math.max(
          0,
          Math.round((new Date(firstJoin).getTime() - startMs) / 60000),
        );
        const status = minutesLate > LATE_THRESHOLD_MIN ? "late" : "on_time";
        await supabase.from("tutor_punctuality").upsert(
          {
            lesson_id: lesson.id,
            tutor_id: lesson.tutor_id,
            tutor_name: tutorName,
            lesson_start: lesson.start_time,
            tutor_first_join_at: firstJoin,
            minutes_late: minutesLate,
            status,
          },
          { onConflict: "lesson_id" },
        );
        processed.push({ lesson: lesson.id, status, minutesLate });
        continue;
      }

      // No tutor yet
      const expectedStudents = expectedStudentCount(lesson.id);
      const shouldAlert =
        expectedStudents > 0 && minutesSinceStart >= LATE_THRESHOLD_MIN && !existing?.alert_sent_at;
      let alertSentAt: string | null = existing?.alert_sent_at ?? null;

      if (shouldAlert) {
        const subjectLine = `Tutor not in lesson: ${lesson.title || lesson.subject || "Lesson"} (${fmtTime(lesson.start_time)})`;
        const body = [
          `The lesson below started ${minutesSinceStart} minutes ago and the tutor has not joined the room yet.`,
          ``,
          `Lesson: ${lesson.title || lesson.subject || "Lesson"}`,
          `Tutor: ${tutorName || "Unassigned"}`,
          `Scheduled start: ${fmtTime(lesson.start_time)}`,
          `Scheduled end: ${fmtTime(lesson.end_time)}`,
          ``,
          `Please check in with the tutor so the students are not left waiting.`,
        ].join("\n");

        try {
          const sent = await resend.emails.send({
            from: "Class Beyond <enquiries@classbeyondacademy.io>",
            to: ALERT_RECIPIENTS,
            subject: subjectLine,
            text: body,
          });
          if (sent.error) throw new Error(sent.error.message);
          alertSentAt = new Date().toISOString();
        } catch (e) {
          console.error("Alert email failed", lesson.id, (e as Error).message);
        }
      }

      await supabase.from("tutor_punctuality").upsert(
        {
          lesson_id: lesson.id,
          tutor_id: lesson.tutor_id,
          tutor_name: tutorName,
          lesson_start: lesson.start_time,
          status:
            expectedStudents === 0
              ? "no_students_expected"
              : minutesSinceStart >= LATE_THRESHOLD_MIN
              ? "no_show"
              : "pending",
          alert_sent_at: alertSentAt,
        },
        { onConflict: "lesson_id" },
      );

      processed.push({
        lesson: lesson.id,
        status: expectedStudents === 0 ? "no_students_expected" : "no_tutor",
        minutesSinceStart,
        expectedStudents,
        alerted: Boolean(alertSentAt),
      });
    }

    return new Response(JSON.stringify({ checked: lessons?.length ?? 0, processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tutor-punctuality-monitor error", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
