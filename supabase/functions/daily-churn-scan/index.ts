// Daily churn-risk detection.
// Deterministic (no AI): scores each active student over their most recent lessons
// using attendance, confidence, engagement, speaking share and confusion signals,
// compared against peers in the same lesson where the lesson is a group.
// Open risks are upserted, stale ones closed, and a digest emailed to the core team.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";
import { formatInUKTime } from "../_shared/timezone-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECIPIENTS = [
  "joshua@classbeyondacademy.io",
  "britney@classbeyondacademy.io",
  "hannah@classbeyondacademy.io",
];

/** How many recent lessons per student feed the score. */
const WINDOW = 6;
/** Only look this far back — older behaviour isn't a churn signal. */
const LOOKBACK_DAYS = 90;
/** Safety cap on students processed per run. */
const MAX_STUDENTS = 400;
/** Below this total score nothing is reported. */
const MIN_SCORE = 30;
const HIGH_SCORE = 55;

const LOW_CONFIDENCE = 5; // scores are 1-10
const LOW_ENGAGEMENT = 5;
const LOW_SPEAKING_PCT = 15;
const PEER_GAP_POINTS = 2; // confidence/engagement points below peers
const PEER_GAP_PCT = 12; // speaking-share % below peers

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

type Reason = { code: string; label: string; detail: string };

type SummaryRow = {
  lesson_id: string;
  student_id: number;
  attendance_status: string | null;
  confidence_score: number | null;
  engagement_score: number | null;
  participation_time_percentage: number | null;
  confidence_indicators: Record<string, unknown> | null;
};

const MISSED = new Set(["absent", "missed", "no_show", "no-show", "did_not_attend"]);

const isMissed = (status: string | null | undefined) =>
  !!status && MISSED.has(String(status).toLowerCase());

const confusionCount = (ci: Record<string, unknown> | null) => {
  if (!ci) return 0;
  const patterns = (ci as any).hesitation_patterns;
  const confusion = (ci as any).confusion_points ?? (ci as any).confusion_signals;
  const n = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return n(patterns) + n(confusion);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();

    // 1. Recent lessons in the window
    const { data: lessons, error: lessonErr } = await supabase
      .from("lessons")
      .select("id, title, subject, start_time, is_group")
      .gte("start_time", since)
      .lte("start_time", new Date().toISOString())
      .order("start_time", { ascending: false })
      .limit(2000);
    if (lessonErr) throw lessonErr;

    const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]));
    const lessonIds = [...lessonById.keys()];
    if (lessonIds.length === 0) {
      return new Response(JSON.stringify({ success: true, scanned: 0, risks: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Per-student per-lesson summaries (chunked to stay within URL limits)
    const summaries: SummaryRow[] = [];
    for (let i = 0; i < lessonIds.length; i += 200) {
      const chunk = lessonIds.slice(i, i + 200);
      const { data, error } = await supabase
        .from("lesson_student_summaries")
        .select(
          "lesson_id, student_id, attendance_status, confidence_score, engagement_score, participation_time_percentage, confidence_indicators",
        )
        .in("lesson_id", chunk);
      if (error) throw error;
      summaries.push(...((data ?? []) as SummaryRow[]));
    }

    // 3. Attendance rows (authoritative for absences)
    const attendance = new Map<string, string>(); // `${lesson_id}:${student_id}` -> status
    for (let i = 0; i < lessonIds.length; i += 200) {
      const chunk = lessonIds.slice(i, i + 200);
      const { data, error } = await supabase
        .from("lesson_attendance")
        .select("lesson_id, student_id, attendance_status")
        .in("lesson_id", chunk);
      if (error) throw error;
      for (const r of data ?? []) {
        attendance.set(`${r.lesson_id}:${r.student_id}`, r.attendance_status);
      }
    }

    // 4. Peer averages per lesson (attended rows only)
    const peers = new Map<string, SummaryRow[]>();
    for (const s of summaries) {
      const arr = peers.get(s.lesson_id) ?? [];
      arr.push(s);
      peers.set(s.lesson_id, arr);
    }

    // 5. Active students
    const { data: students, error: studentErr } = await supabase
      .from("students")
      .select("id, first_name, last_name, status, parent_id")
      .eq("status", "active")
      .limit(MAX_STUDENTS);
    if (studentErr) throw studentErr;

    const parentIds = [...new Set((students ?? []).map((s) => s.parent_id).filter(Boolean))] as string[];
    const parentById = new Map<string, { first_name: string; last_name: string; email: string }>();
    for (let i = 0; i < parentIds.length; i += 200) {
      const { data } = await supabase
        .from("parents")
        .select("id, first_name, last_name, email")
        .in("id", parentIds.slice(i, i + 200));
      for (const p of data ?? []) parentById.set(p.id, p as any);
    }

    // Group each student's rows by lesson time desc
    const byStudent = new Map<number, SummaryRow[]>();
    for (const s of summaries) {
      const arr = byStudent.get(s.student_id) ?? [];
      arr.push(s);
      byStudent.set(s.student_id, arr);
    }

    const openRisks: any[] = [];
    let scanned = 0;

    for (const student of students ?? []) {
      const rows = (byStudent.get(Number(student.id)) ?? [])
        .filter((r) => lessonById.has(r.lesson_id))
        .sort(
          (a, b) =>
            new Date(lessonById.get(b.lesson_id)!.start_time).getTime() -
            new Date(lessonById.get(a.lesson_id)!.start_time).getTime(),
        )
        .slice(0, WINDOW);

      if (rows.length < 2) continue;
      scanned++;

      const reasons: Reason[] = [];
      let score = 0;

      // --- Attendance -------------------------------------------------------
      const missedFlags = rows.map((r) =>
        isMissed(attendance.get(`${r.lesson_id}:${r.student_id}`) ?? r.attendance_status),
      );
      let streak = 0;
      for (const m of missedFlags) {
        if (m) streak++;
        else break;
      }
      const missedCount = missedFlags.filter(Boolean).length;

      if (streak >= 2) {
        score += 30 + (streak - 2) * 10;
        reasons.push({
          code: "missed_streak",
          label: `Missed ${streak} lessons in a row`,
          detail: `The last ${streak} scheduled lessons were not attended.`,
        });
      } else if (missedCount >= 3) {
        score += 20;
        reasons.push({
          code: "missed_frequent",
          label: `${missedCount} absences in the last ${rows.length} lessons`,
          detail: "Attendance is patchy even though there is no back-to-back streak.",
        });
      }

      // --- Attended-lesson metrics -----------------------------------------
      const attended = rows.filter((_, i) => !missedFlags[i]);

      const conf = attended.map((r) => r.confidence_score).filter((v): v is number => v != null);
      const eng = attended.map((r) => r.engagement_score).filter((v): v is number => v != null);
      const talk = attended
        .map((r) => (r.participation_time_percentage == null ? null : Number(r.participation_time_percentage)))
        .filter((v): v is number => v != null);

      const avgConf = avg(conf);
      const avgEng = avg(eng);
      const avgTalk = avg(talk);

      // Peer deltas: average of (student value - peer average) per lesson
      const deltas = { conf: [] as number[], eng: [] as number[], talk: [] as number[] };
      for (const r of attended) {
        const others = (peers.get(r.lesson_id) ?? []).filter(
          (p) =>
            p.student_id !== r.student_id &&
            !isMissed(attendance.get(`${p.lesson_id}:${p.student_id}`) ?? p.attendance_status),
        );
        if (others.length === 0) continue;
        const pc = avg(others.map((o) => o.confidence_score).filter((v): v is number => v != null));
        const pe = avg(others.map((o) => o.engagement_score).filter((v): v is number => v != null));
        const pt = avg(
          others
            .map((o) => (o.participation_time_percentage == null ? null : Number(o.participation_time_percentage)))
            .filter((v): v is number => v != null),
        );
        if (pc != null && r.confidence_score != null) deltas.conf.push(r.confidence_score - pc);
        if (pe != null && r.engagement_score != null) deltas.eng.push(r.engagement_score - pe);
        if (pt != null && r.participation_time_percentage != null) {
          deltas.talk.push(Number(r.participation_time_percentage) - pt);
        }
      }
      const dConf = avg(deltas.conf);
      const dEng = avg(deltas.eng);
      const dTalk = avg(deltas.talk);

      if (avgConf != null && avgConf < LOW_CONFIDENCE) {
        const peerBit = dConf != null && dConf <= -PEER_GAP_POINTS;
        score += peerBit ? 20 : 12;
        reasons.push({
          code: "low_confidence",
          label: `Low confidence (${round1(avgConf)}/10)`,
          detail: peerBit
            ? `Averaging ${round1(avgConf)}/10, about ${round1(Math.abs(dConf!))} points below the other students in the same lessons.`
            : `Averaging ${round1(avgConf)}/10 across recent lessons.`,
        });
      } else if (dConf != null && dConf <= -PEER_GAP_POINTS) {
        score += 10;
        reasons.push({
          code: "confidence_below_peers",
          label: "Confidence well below groupmates",
          detail: `About ${round1(Math.abs(dConf))} points below the other students in the same lessons.`,
        });
      }

      if (avgTalk != null && avgTalk < LOW_SPEAKING_PCT) {
        const peerBit = dTalk != null && dTalk <= -PEER_GAP_PCT;
        score += peerBit ? 18 : 10;
        reasons.push({
          code: "low_speaking",
          label: `Barely speaking (${round1(avgTalk)}% of lesson)`,
          detail: peerBit
            ? `Spoke ${round1(avgTalk)}% of the lesson vs roughly ${round1(avgTalk + Math.abs(dTalk!))}% for groupmates.`
            : `Spoke ${round1(avgTalk)}% of recent lessons on average.`,
        });
      } else if (dTalk != null && dTalk <= -PEER_GAP_PCT) {
        score += 10;
        reasons.push({
          code: "speaking_below_peers",
          label: "Speaking far less than groupmates",
          detail: `About ${round1(Math.abs(dTalk))} percentage points less talk time than peers in the same lessons.`,
        });
      }

      if (avgEng != null && avgEng < LOW_ENGAGEMENT) {
        const peerBit = dEng != null && dEng <= -PEER_GAP_POINTS;
        score += peerBit ? 18 : 10;
        reasons.push({
          code: "low_engagement",
          label: `Low engagement (${round1(avgEng)}/10)`,
          detail: peerBit
            ? `Averaging ${round1(avgEng)}/10, about ${round1(Math.abs(dEng!))} points below groupmates.`
            : `Averaging ${round1(avgEng)}/10 across recent lessons.`,
        });
      } else if (dEng != null && dEng <= -PEER_GAP_POINTS) {
        score += 8;
        reasons.push({
          code: "engagement_below_peers",
          label: "Engagement below groupmates",
          detail: `About ${round1(Math.abs(dEng))} points below the other students in the same lessons.`,
        });
      }

      // --- Confusion vs peers ----------------------------------------------
      const ownConfusion: number[] = [];
      const peerConfusion: number[] = [];
      for (const r of attended) {
        const others = (peers.get(r.lesson_id) ?? []).filter((p) => p.student_id !== r.student_id);
        if (others.length === 0) continue;
        ownConfusion.push(confusionCount(r.confidence_indicators));
        peerConfusion.push(avg(others.map((o) => confusionCount(o.confidence_indicators))) ?? 0);
      }
      const ownC = avg(ownConfusion);
      const peerC = avg(peerConfusion);
      if (ownC != null && peerC != null && ownC >= 2 && ownC >= peerC * 1.75) {
        score += 12;
        reasons.push({
          code: "high_confusion",
          label: "Getting stuck more than groupmates",
          detail: `Around ${round1(ownC)} confusion/hesitation signals per lesson vs ${round1(peerC)} for peers.`,
        });
      }

      // --- Trend ------------------------------------------------------------
      if (attended.length >= 4) {
        const recent = attended.slice(0, Math.floor(attended.length / 2));
        const older = attended.slice(Math.floor(attended.length / 2));
        const mix = (xs: SummaryRow[]) =>
          avg(
            xs
              .map((r) =>
                r.engagement_score != null && r.confidence_score != null
                  ? (r.engagement_score + r.confidence_score) / 2
                  : null,
              )
              .filter((v): v is number => v != null),
          );
        const rAvg = mix(recent);
        const oAvg = mix(older);
        if (rAvg != null && oAvg != null && oAvg - rAvg >= 1.5) {
          score += 12;
          reasons.push({
            code: "declining_trend",
            label: "Confidence and engagement falling",
            detail: `Down from ${round1(oAvg)}/10 to ${round1(rAvg)}/10 across the recent lessons.`,
          });
        }
      }

      if (score < MIN_SCORE || reasons.length === 0) continue;

      const parent = student.parent_id ? parentById.get(student.parent_id) : undefined;
      const lastLesson = lessonById.get(rows[0].lesson_id);

      openRisks.push({
        student_id: Number(student.id),
        student_name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Unknown student",
        parent_name: parent ? `${parent.first_name ?? ""} ${parent.last_name ?? ""}`.trim() : null,
        parent_email: parent?.email ?? null,
        risk_level: score >= HIGH_SCORE ? "high" : "medium",
        score,
        reasons,
        lessons_considered: rows.map((r, i) => {
          const l = lessonById.get(r.lesson_id)!;
          return {
            lesson_id: r.lesson_id,
            title: l.title,
            subject: l.subject,
            date: l.start_time,
            missed: missedFlags[i],
          };
        }),
        missed_streak: streak,
        missed_count: missedCount,
        avg_confidence: avgConf == null ? null : round1(avgConf),
        avg_engagement: avgEng == null ? null : round1(avgEng),
        avg_speaking_pct: avgTalk == null ? null : round1(avgTalk),
        peer_confidence_delta: dConf == null ? null : round1(dConf),
        peer_engagement_delta: dEng == null ? null : round1(dEng),
        peer_speaking_delta: dTalk == null ? null : round1(dTalk),
        status: "open",
        last_lesson_date: lastLesson?.start_time ?? null,
      });
    }

    // 6. Persist: update existing open rows, insert new ones, close stale ones
    const { data: existing, error: existErr } = await supabase
      .from("student_churn_risks")
      .select("id, student_id")
      .eq("status", "open");
    if (existErr) throw existErr;

    const existingByStudent = new Map((existing ?? []).map((r) => [Number(r.student_id), r.id]));
    const stillAtRisk = new Set(openRisks.map((r) => r.student_id));

    for (const risk of openRisks) {
      const id = existingByStudent.get(risk.student_id);
      if (id) {
        const { error } = await supabase.from("student_churn_risks").update(risk).eq("id", id);
        if (error) console.error("[churn-scan] update failed:", error.message);
      } else {
        const { error } = await supabase.from("student_churn_risks").insert(risk);
        if (error) console.error("[churn-scan] insert failed:", error.message);
      }
    }

    const toClose = (existing ?? [])
      .filter((r) => !stillAtRisk.has(Number(r.student_id)))
      .map((r) => r.id);
    if (toClose.length > 0) {
      await supabase.from("student_churn_risks").update({ status: "closed" }).in("id", toClose);
    }

    // 7. Digest email
    const newlyFlagged = openRisks.filter((r) => !existingByStudent.has(r.student_id));
    if (openRisks.length > 0 && newlyFlagged.length > 0) {
      const prettyDate = formatInUKTime(new Date(), "EEEE d MMMM yyyy");
      const order = { high: 0, medium: 1 } as Record<string, number>;
      const sorted = [...openRisks].sort(
        (a, b) => (order[a.risk_level] ?? 2) - (order[b.risk_level] ?? 2) || b.score - a.score,
      );

      const items = sorted
        .map((r, i) => {
          const colour = r.risk_level === "high" ? "#dc2626" : "#d97706";
          const lead = `${i + 1}.`;
          return `
          <li style="margin-bottom:14px;padding-left:8px;border-left:3px solid ${colour};">
            <div style="font-size:14px;">${lead} <strong>${esc(r.student_name)}</strong> — ${r.risk_level === "high" ? "high risk" : "worth keeping an eye on"} (score ${r.score})</div>
            ${r.parent_name || r.parent_email ? `<div style="font-size:12px;color:#555;">Parent: ${esc((r.parent_name ?? "").trim())}${r.parent_email ? ` · ${esc(r.parent_email)}` : ""}</div>` : ""}
            <div style="margin:6px 0 0 0;font-size:13px;color:#333;">
              ${(r.reasons as Reason[]).map((x) => `• ${esc(x.label)} — ${esc(x.detail)}`).join("<br>")}
            </div>
          </li>`;
        })
        .join("");

      const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;">
        <p style="font-size:15px;margin:0 0 10px 0;">Hey! 🙂 I found ${sorted.length === 1 ? "a student" : `${sorted.length} students`} worth looking at today — could you check in on them?</p>
        <p style="font-size:14px;color:#555;margin:0 0 16px 0;">Here's who I flagged on ${esc(prettyDate)}${newlyFlagged.length ? ` (${newlyFlagged.length} new)` : ""}:</p>
        <ul style="list-style:none;padding:0;margin:0 0 24px 0;">${items}</ul>
        <p style="font-size:14px;color:#1f2937;margin:0 0 6px 0;">Catch you later — Cleo 🐾</p>
      </div>`;

      const { error: emailError } = await resend.emails.send({
        from: "Cleo <enquiries@classbeyondacademy.io>",
        to: RECIPIENTS,
        subject: `Hey — ${sorted.length === 1 ? "1 student" : `${sorted.length} students`} worth a look today 🙂`,
        html,
      });
      if (emailError) console.error("[churn-scan] Email failed:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanned,
        risks: openRisks.length,
        closed: toClose.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[churn-scan] Error:", error);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
