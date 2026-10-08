import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { formatInUKTime } from "../_shared/timezone-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENTS = [
  "hannah@classbeyondacademy.io",
  "britney@classbeyondacademy.io",
  "joshua@classbeyondacademy.io",
];

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Current UK week (Monday 00:00 → following Monday 00:00), expressed as UTC instants
    const now = new Date();
    const ukToday = formatInUKTime(now, "yyyy-MM-dd");
    const offsetSuffix = formatInUKTime(now, "XXX"); // e.g. +01:00 or Z
    const offset = offsetSuffix === "Z" ? "+00:00" : offsetSuffix;
    const todayStart = new Date(`${ukToday}T00:00:00${offset}`);
    const ukDow = Number(formatInUKTime(now, "i")); // 1 = Monday ... 7 = Sunday
    const weekStart = new Date(todayStart.getTime() - (ukDow - 1) * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekLabel = `${formatInUKTime(weekStart, "d MMM")} – ${formatInUKTime(new Date(weekEnd.getTime() - 1), "d MMM")}`;

    console.log(`[timeoff-clash] Checking week ${weekLabel} (${weekStart.toISOString()} → ${weekEnd.toISOString()})`);

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`
        id, title, subject, start_time, end_time, status, tutor_id,
        tutor:tutors(id, first_name, last_name, email),
        lesson_students(student:students(id, first_name, last_name))
      `)
      .gte("start_time", weekStart.toISOString())
      .lt("start_time", weekEnd.toISOString())
      .neq("status", "cancelled");

    if (lessonsError) throw lessonsError;

    const { data: timeOffs, error: timeOffError } = await supabase
      .from("time_off_requests")
      .select("id, tutor_id, start_date, end_date, reason, status")
      .eq("status", "approved")
      .lt("start_date", weekEnd.toISOString())
      .gt("end_date", weekStart.toISOString());

    if (timeOffError) throw timeOffError;

    const clashes: Array<{
      day: string;
      dayLabel: string;
      tutorName: string;
      lessonTitle: string;
      subject: string;
      lessonWindow: string;
      students: string;
      timeOffWindow: string;
      reason: string;
    }> = [];

    for (const lesson of lessons ?? []) {
      const lessonStart = new Date(lesson.start_time).getTime();
      const lessonEnd = new Date(lesson.end_time ?? lesson.start_time).getTime();

      for (const to of timeOffs ?? []) {
        if (to.tutor_id !== lesson.tutor_id) continue;
        const toStart = new Date(to.start_date).getTime();
        const toEnd = new Date(to.end_date).getTime();
        if (lessonStart < toEnd && lessonEnd > toStart) {
          const tutor: any = lesson.tutor;
          const students = (lesson.lesson_students ?? [])
            .map((ls: any) => `${ls.student?.first_name ?? ""} ${ls.student?.last_name ?? ""}`.trim())
            .filter(Boolean)
            .join(", ");

          clashes.push({
            day: formatInUKTime(lesson.start_time, "yyyy-MM-dd"),
            dayLabel: formatInUKTime(lesson.start_time, "EEEE d MMMM"),
            tutorName: tutor ? `${tutor.first_name} ${tutor.last_name}` : "Unknown tutor",
            lessonTitle: lesson.title ?? "Lesson",
            subject: lesson.subject ?? "—",
            lessonWindow: `${formatInUKTime(lesson.start_time, "HH:mm")} – ${formatInUKTime(lesson.end_time ?? lesson.start_time, "HH:mm")}`,
            students: students || "No students listed",
            timeOffWindow: `${formatInUKTime(to.start_date, "d MMM HH:mm")} – ${formatInUKTime(to.end_date, "d MMM HH:mm")}`,
            reason: to.reason ?? "No reason provided",
          });
          break;
        }
      }
    }

    clashes.sort((a, b) => a.day.localeCompare(b.day) || a.lessonWindow.localeCompare(b.lessonWindow));

    console.log(`[timeoff-clash] ${lessons?.length ?? 0} lessons, ${timeOffs?.length ?? 0} time-off windows, ${clashes.length} clashes`);

    if (clashes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, week: weekLabel, clashes: 0, emailSent: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Group rows by day with a subheading row per day
    let lastDay = "";
    const rows = clashes
      .map((c) => {
        const dayHeader =
          c.day !== lastDay
            ? `<tr style="background:#e8f0ef;text-align:left;">
                 <td colspan="5" style="padding:8px 12px;font-weight:bold;">${esc(c.dayLabel)}</td>
               </tr>`
            : "";
        lastDay = c.day;
        return `${dayHeader}
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;"><strong>${esc(c.tutorName)}</strong></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(c.lessonWindow)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(c.lessonTitle)}<br/><span style="color:#777;font-size:12px;">${esc(c.subject)}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(c.students)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(c.timeOffWindow)}<br/><span style="color:#777;font-size:12px;">${esc(c.reason)}</span></td>
        </tr>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:820px;margin:0 auto;">
        <h2 style="margin-bottom:4px;">⚠️ Tutor time-off clashes, this week (${esc(weekLabel)})</h2>
        <p style="color:#555;margin-top:0;">${clashes.length} lesson${clashes.length === 1 ? " is" : "s are"} scheduled this week with a tutor who has approved time off.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <thead>
            <tr style="background:#f5f5f5;text-align:left;">
              <th style="padding:10px 12px;">Tutor</th>
              <th style="padding:10px 12px;">Lesson time</th>
              <th style="padding:10px 12px;">Lesson</th>
              <th style="padding:10px 12px;">Students</th>
              <th style="padding:10px 12px;">Time off</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#777;font-size:12px;margin-top:24px;">Automated daily check, Class Beyond Academy CRM</p>
      </div>`;

    const { error: emailError } = await resend.emails.send({
      from: "Class Beyond <enquiries@classbeyondacademy.io>",
      to: RECIPIENTS,
      subject: `⚠️ ${clashes.length} tutor time-off clash${clashes.length === 1 ? "" : "es"} this week (${weekLabel})`,
      html,
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ success: true, week: weekLabel, clashes: clashes.length, emailSent: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[timeoff-clash] Error:", error);
    return new Response(JSON.stringify({ error: error.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
