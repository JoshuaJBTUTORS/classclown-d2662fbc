// Daily transcript review.
// A single AI pass per transcript detects BOTH tutor policy breaches and
// high-impact student moments (referral / outreach opportunities).
// Findings are stored and emailed to the core team as two separate digests.

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

const MAX_TRANSCRIPTS_PER_RUN = 50;
const MAX_TRANSCRIPT_CHARS = 60_000;

const MOMENT_CATEGORIES = [
  "upcoming_assessment",
  "past_assessment",
  "assessment_result",
  "other_academic_result",
  "support_needed",
  "positive_progress",
  "goal_or_circumstance_change",
] as const;

const MOMENT_LABELS: Record<string, string> = {
  upcoming_assessment: "Upcoming assessment",
  past_assessment: "Past assessment",
  assessment_result: "Result",
  other_academic_result: "Academic result",
  support_needed: "Support needed",
  positive_progress: "Positive progress",
  goal_or_circumstance_change: "Goal / circumstance change",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BREACH_POLICY = `A tutor breach is any action or behaviour that violates professional standards, safeguarding requirements, privacy rules, or the organisation's policies. Categories:

1. personal_information — Disclosing or requesting private information without proper authorisation: personal email addresses, phone numbers, home addresses, social-media accounts, login details, or other identifying/confidential information.
2. inappropriate_communication — Language or behaviour that is insulting, threatening, discriminatory, intimidating, sexually inappropriate, aggressive, or otherwise disrespectful toward students, parents, colleagues or staff.
3. professional_misconduct — Behaviour that is unprofessional, unsafe, dishonest, disruptive, or damaging to the learning environment or the organisation's reputation.
4. safeguarding — Failing to maintain appropriate professional boundaries, unauthorised contact with a student, or failing to report a safeguarding concern through the correct process.
5. discrimination_harassment — Treating anyone unfairly or harassing them because of a protected characteristic, background, identity, ability or personal circumstances.`;

const MOMENT_POLICY = `A HIGH-IMPACT MOMENT is something a STUDENT (or parent) says that gives the team a concrete, time-relevant reason to contact the family. The bar is HIGH. Most lessons contain ZERO high-impact moments. Reporting nothing is the correct and expected outcome for a normal lesson.

QUALIFICATION TEST — a moment must pass ALL FOUR. If any one fails, do not report it:
1. SPOKEN BY THE STUDENT OR PARENT. Not the tutor. Not inferred, implied or summarised by you.
2. ABOUT SOMETHING OUTSIDE THIS LESSON — a school event, a result, a deadline, a decision, a change at school or home affecting their education. Anything happening inside this lesson is the tutor's job, not a moment.
3. HAS A CONCRETE ANCHOR — a named assessment or school event, a stated date or timeframe, a grade/score/target, or a clearly stated school-level problem. No anchor means no moment.
4. PASSES THE "WOULD WE PHONE HOME ABOUT THIS?" TEST — the recommended action must be something a human at a tutoring company would genuinely do this week.

NEVER REPORT (hard exclusions, no exceptions):
- Technical problems: connection, audio, video, screen-share, "I can't see it", "I can't write on it", logging in.
- Not remembering, not understanding, or finding hard the topic being taught right now.
- Running late, needing to leave early, rescheduling a single lesson, being tired.
- Small talk: weather, holidays, food, pets, hobbies, games, TV, siblings.
- Non-academic activities (sports clubs, cadets, scouts, part-time jobs, work promotions) UNLESS the student says it directly affects their schooling or wellbeing.
- The student simply going to / starting / returning to school.
- Generic encouragement, praise or motivation from anyone.
- Anything the tutor said. Anything you had to guess at.

CATEGORIES (use the tightened definitions):
1. upcoming_assessment — A named future SCHOOL or EXAM-BOARD assessment: test, exam, mock, GCSE/A-Level/SATs/11+ paper, coursework deadline. Must be identifiable, not "we have tests sometimes".
2. past_assessment — A specific completed school assessment the student reflects on, with enough detail to follow up.
3. assessment_result — An actual stated mark, score, grade, ranking, predicted grade or explicit teacher verdict.
4. other_academic_result — Report card, progress report, admissions/school-place decision, formal school feedback.
5. support_needed — A PATTERN or SCHOOL-LEVEL problem: falling behind at school, repeated poor results, stated anxiety or loss of confidence about their education, or a wellbeing concern. NOT a single wobble on one topic in this lesson.
6. positive_progress — A concrete, stated achievement: improved grade, award, moved up a set, met a target, explicit teacher praise.
7. goal_or_circumstance_change — An ACTUAL decision or change: new target grade, subject options chosen, exam entry, school move, application submitted, tutoring needs changing. NOT routine life updates.

SCORING — give every moment an impact_score 0-100 using this rubric, and a one-line score_reason:
- Concreteness of the anchor (0-30): named event / real date / actual grade scores high; vague "soon", "some tests" scores near zero.
- Time-sensitivity (0-25): acting this week clearly matters.
- Value to the family (0-25): would the parent be glad we called about this?
- Evidence strength (0-20): an unambiguous full sentence from the student scores high; fragments and filler score near zero.
Be harsh. A score of 60+ means "we would genuinely contact this family about it". Score below 60 if in any doubt.`;

interface Finding {
  category: string;
  severity: "low" | "medium" | "high";
  summary: string;
  evidence: string[];
}

interface Moment {
  category: string;
  student_name: string | null;
  subject: string | null;
  event_type: string | null;
  timeframe: string | null;
  event_date: string | null;
  grade_or_target: string | null;
  student_reaction: string | null;
  urgency: "low" | "medium" | "high";
  recommended_action: string | null;
  impact_score: number;
  score_reason: string | null;
  evidence: string[];
}

const str = (v: unknown): string | null => {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s && s.toLowerCase() !== "null" && s.toLowerCase() !== "n/a" ? s : null;
};

/** Loose containment check so evidence must actually come from the transcript. */
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

async function analyseTranscript(
  transcript: string,
  tutorName: string,
  studentNames: string[],
): Promise<{ findings: Finding[]; moments: Moment[]; blocked?: boolean; error?: string }> {
  const clipped = transcript.length > MAX_TRANSCRIPT_CHARS
    ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n…[truncated]"
    : transcript;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            `You review UK online tutoring lesson transcripts for a tutoring company. You do TWO jobs in one pass.

JOB 1 — TUTOR BREACHES (tutor behaviour only, never student behaviour):
${BREACH_POLICY}

JOB 2 — HIGH-IMPACT STUDENT MOMENTS:
${MOMENT_POLICY}

RULES FOR BOTH JOBS:
- Every item you report MUST include "evidence": one or more EXACT verbatim lines copied from the transcript. Never paraphrase evidence. If you cannot quote it, do not report it.
- Transcripts are auto-generated and contain errors — never report anything based on a single ambiguous word.
- Be strict about false positives. Normal teaching, friendly banter and lesson logistics are neither a breach nor a high-impact moment.
- Use only the student names supplied. If you cannot tell which student spoke, set student_name to null.
- Leave any field you do not have information for as null. Never invent dates, grades or subjects.

Return JSON only, in this exact shape:
{
  "findings": [{"category": "personal_information|inappropriate_communication|professional_misconduct|safeguarding|discrimination_harassment", "severity": "low|medium|high", "summary": "one or two sentences", "evidence": ["exact quote"]}],
  "moments": [{"category": "${MOMENT_CATEGORIES.join("|")}", "student_name": string|null, "subject": string|null, "event_type": "e.g. mock exam, end-of-topic test, report card", "timeframe": "as said, e.g. 'next Tuesday', 'after half term'", "event_date": "YYYY-MM-DD or null — only if an unambiguous date is stated", "grade_or_target": string|null, "student_reaction": "short description of how the student feels about it", "urgency": "low|medium|high", "recommended_action": "one short sentence on the outreach to make", "impact_score": 0-100, "score_reason": "one short line justifying the score", "evidence": ["exact quote — the student's own words, a full sentence, no filler"]}]
}
If there is nothing to report, return {"findings": [], "moments": []}. An empty "moments" array is a normal, expected result.`,
        },
        {
          role: "user",
          content: `Tutor in this lesson: ${tutorName}
Students in this lesson: ${studentNames.length ? studentNames.join(", ") : "unknown"}

Transcript:
${clipped}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 402 || res.status === 403) {
    const body = await res.text();
    console.error(`[breach-scan] OpenAI blocked (${res.status}): ${body}`);
    return { findings: [], moments: [], blocked: true, error: `OpenAI ${res.status}` };
  }
  if (!res.ok) {
    const body = await res.text();
    return { findings: [], moments: [], error: `OpenAI ${res.status}: ${body.slice(0, 300)}` };
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
    }
  }

  const haystack = normalise(clipped);
  const cleanEvidence = (v: unknown): string[] =>
    (Array.isArray(v) ? v : [])
      .map((e) => String(e).trim())
      .filter((e) => e.length > 8 && haystack.includes(normalise(e).slice(0, 120)))
      .slice(0, 6);

  const findings: Finding[] = (Array.isArray(parsed?.findings) ? parsed.findings : [])
    .filter((f: any) => f?.category && f?.summary)
    .map((f: any) => ({
      category: String(f.category),
      severity: ["low", "medium", "high"].includes(f.severity) ? f.severity : "medium",
      summary: String(f.summary),
      evidence: cleanEvidence(f.evidence),
    }))
    .filter((f: Finding) => f.evidence.length > 0);

  const moments: Moment[] = (Array.isArray(parsed?.moments) ? parsed.moments : [])
    .filter((m: any) => m?.category && (MOMENT_CATEGORIES as readonly string[]).includes(String(m.category)))
    .map((m: any) => ({
      category: String(m.category),
      student_name: str(m.student_name),
      subject: str(m.subject),
      event_type: str(m.event_type),
      timeframe: str(m.timeframe),
      event_date: /^\d{4}-\d{2}-\d{2}$/.test(String(m.event_date ?? "")) ? String(m.event_date) : null,
      grade_or_target: str(m.grade_or_target),
      student_reaction: str(m.student_reaction),
      urgency: ["low", "medium", "high"].includes(m.urgency) ? m.urgency : "medium",
      recommended_action: str(m.recommended_action),
      evidence: cleanEvidence(m.evidence),
    }))
    .filter((m: Moment) => m.evidence.length > 0);

  return { findings, moments };
}

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    let lookbackHours = 24;
    try {
      const body = await req.json();
      if (body?.lookbackHours && Number.isFinite(body.lookbackHours)) {
        lookbackHours = Math.min(Number(body.lookbackHours), 24 * 30);
      }
    } catch { /* no body */ }

    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    const { data: transcripts, error: tErr } = await supabase
      .from("lesson_transcriptions")
      .select("id, lesson_id, transcription_text, updated_at")
      .not("transcription_text", "is", null)
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(MAX_TRANSCRIPTS_PER_RUN);

    if (tErr) throw tErr;

    const candidates = (transcripts ?? []).filter(
      (t) => (t.transcription_text ?? "").trim().length > 200,
    );

    if (candidates.length === 0) {
      console.log("[breach-scan] No new transcripts to scan");
      return new Response(JSON.stringify({ success: true, scanned: 0, breaches: 0, moments: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: scanned } = await supabase
      .from("breach_scan_log")
      .select("transcription_id")
      .in("transcription_id", candidates.map((c) => c.id));

    const alreadyScanned = new Set((scanned ?? []).map((s: any) => s.transcription_id));
    const toScan = candidates.filter((c) => !alreadyScanned.has(c.id));

    console.log(`[breach-scan] ${candidates.length} candidates, ${toScan.length} unscanned`);

    const breachRows: Array<Finding & {
      tutorName: string;
      lessonTitle: string;
      lessonDate: string;
      students: string;
    }> = [];

    const momentRows: Array<Moment & {
      tutorName: string;
      lessonTitle: string;
      lessonDate: string;
    }> = [];

    let scannedCount = 0;
    let blocked = false;

    for (const t of toScan) {
      if (blocked) break;

      try {
        const { data: lesson } = await supabase
          .from("lessons")
          .select(`
            id, title, subject, start_time, tutor_id,
            tutor:tutors(id, first_name, last_name),
            lesson_students(student:students(id, first_name, last_name))
          `)
          .eq("id", t.lesson_id)
          .maybeSingle();

        const tutor: any = lesson?.tutor;
        const tutorName = tutor ? `${tutor.first_name ?? ""} ${tutor.last_name ?? ""}`.trim() : "Unknown tutor";

        const studentList = ((lesson as any)?.lesson_students ?? [])
          .map((ls: any) => ls.student)
          .filter(Boolean)
          .map((s: any) => ({
            id: s.id as number,
            name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
          }))
          .filter((s: any) => s.name);

        const students = studentList.map((s: any) => s.name).join(", ") || "No students listed";
        const lessonTitle = lesson?.title ?? lesson?.subject ?? "Lesson";
        const lessonDate = lesson?.start_time
          ? formatInUKTime(lesson.start_time, "EEE d MMM yyyy, HH:mm")
          : "Unknown date";

        const { findings, moments, blocked: isBlocked, error } = await analyseTranscript(
          t.transcription_text ?? "",
          tutorName,
          studentList.map((s: any) => s.name),
        );

        if (isBlocked) {
          blocked = true;
          break; // leave unlogged so the next run retries it
        }

        if (error) {
          console.error(`[breach-scan] transcript ${t.id}: ${error}`);
          continue;
        }

        scannedCount++;

        if (findings.length > 0) {
          const rows = findings.map((f) => ({
            lesson_id: t.lesson_id,
            transcription_id: t.id,
            tutor_id: lesson?.tutor_id ?? null,
            tutor_name: tutorName,
            lesson_title: lessonTitle,
            lesson_date: lesson?.start_time ?? null,
            students,
            category: f.category,
            severity: f.severity,
            summary: f.summary,
            evidence: f.evidence,
            status: "open",
          }));
          const { error: insErr } = await supabase.from("tutor_breaches").insert(rows);
          if (insErr) throw insErr;
          for (const f of findings) {
            breachRows.push({ ...f, tutorName, lessonTitle, lessonDate, students });
          }
        }

        if (moments.length > 0) {
          const rows = moments.map((m) => {
            const matched = m.student_name
              ? studentList.find((s: any) =>
                s.name.toLowerCase() === m.student_name!.toLowerCase() ||
                s.name.toLowerCase().startsWith(m.student_name!.toLowerCase().split(" ")[0])
              )
              : null;
            const fallback = studentList.length === 1 ? studentList[0] : null;
            const resolved = matched ?? fallback;

            return {
              lesson_id: t.lesson_id,
              transcription_id: t.id,
              student_id: resolved?.id ?? null,
              student_name: resolved?.name ?? m.student_name,
              tutor_id: lesson?.tutor_id ?? null,
              tutor_name: tutorName,
              lesson_title: lessonTitle,
              lesson_date: lesson?.start_time ?? null,
              category: m.category,
              subject: m.subject ?? lesson?.subject ?? null,
              event_type: m.event_type,
              timeframe: m.timeframe,
              event_date: m.event_date,
              grade_or_target: m.grade_or_target,
              student_reaction: m.student_reaction,
              urgency: m.urgency,
              recommended_action: m.recommended_action,
              evidence: m.evidence,
              status: "new",
            };
          });

          const { error: mErr } = await supabase.from("student_impact_moments").insert(rows);
          if (mErr) throw mErr;

          for (let i = 0; i < moments.length; i++) {
            momentRows.push({
              ...moments[i],
              student_name: rows[i].student_name,
              subject: rows[i].subject,
              tutorName,
              lessonTitle,
              lessonDate,
            });
          }
        }

        await supabase.from("breach_scan_log").upsert(
          {
            transcription_id: t.id,
            lesson_id: t.lesson_id,
            breaches_found: findings.length,
            moments_found: moments.length,
            scan_error: null,
          },
          { onConflict: "transcription_id" },
        );
      } catch (err: any) {
        console.error(`[breach-scan] Failed on transcript ${t.id}:`, err?.message ?? err);
      }
    }

    const prettyDate = formatInUKTime(new Date(), "EEEE d MMMM yyyy");
    console.log(
      `[breach-scan] scanned=${scannedCount} breaches=${breachRows.length} moments=${momentRows.length} blocked=${blocked}`,
    );

    // ---------- Breach email ----------
    if (breachRows.length > 0) {
      const rowsHtml = breachRows
        .map((b) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;"><strong>${esc(b.tutorName)}</strong></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.lessonTitle)}<br/><span style="color:#777;font-size:12px;">${esc(b.lessonDate)}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.students)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.category.replace(/_/g, " "))}<br/><span style="color:#777;font-size:12px;text-transform:uppercase;">${esc(b.severity)}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.summary)}<div style="margin-top:6px;color:#555;font-size:12px;font-style:italic;">${b.evidence.map((e) => `“${esc(e)}”`).join("<br/>")}</div></td>
        </tr>`)
        .join("");

      const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:900px;margin:0 auto;">
        <h2 style="margin-bottom:4px;">🚨 Tutor breach alert — ${esc(prettyDate)}</h2>
        <p style="color:#555;margin-top:0;">${breachRows.length} potential breach${breachRows.length === 1 ? "" : "es"} detected in yesterday's lesson transcripts. Review these in Agent Cleo.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <thead>
            <tr style="background:#f5f5f5;text-align:left;">
              <th style="padding:10px 12px;">Tutor</th>
              <th style="padding:10px 12px;">Lesson</th>
              <th style="padding:10px 12px;">Students</th>
              <th style="padding:10px 12px;">Category</th>
              <th style="padding:10px 12px;">Detail</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <p style="color:#777;font-size:12px;margin-top:24px;">Automated daily transcript review — Class Beyond Academy CRM. These are AI-generated flags and must be verified before any action is taken.</p>
      </div>`;

      const { error: emailError } = await resend.emails.send({
        from: "Class Beyond <enquiries@classbeyondacademy.io>",
        to: RECIPIENTS,
        subject: `🚨 ${breachRows.length} potential tutor breach${breachRows.length === 1 ? "" : "es"} detected (${prettyDate})`,
        html,
      });
      if (emailError) console.error("[breach-scan] Breach email failed:", emailError);
    }

    // ---------- High-impact moments email ----------
    if (momentRows.length > 0) {
      const sorted = [...momentRows].sort(
        (a, b) => (URGENCY_ORDER[a.urgency] ?? 1) - (URGENCY_ORDER[b.urgency] ?? 1),
      );

      const dot = (u: string) => (u === "high" ? "#dc2626" : u === "medium" ? "#d97706" : "#65a30d");

      const items = sorted
        .map((m) => {
          const head = [
            `<strong>${esc(m.student_name ?? "Unknown student")}</strong>`,
            esc(MOMENT_LABELS[m.category] ?? m.category.replace(/_/g, " ")),
            m.subject ? esc(m.subject) : null,
            m.event_type ? esc(m.event_type) : null,
            m.timeframe ? esc(m.timeframe) : null,
            m.grade_or_target ? esc(m.grade_or_target) : null,
          ].filter(Boolean).join(" · ");

          return `
          <li style="margin-bottom:14px;padding-left:10px;border-left:3px solid ${dot(m.urgency)};">
            <div style="font-size:14px;">${head}</div>
            ${m.student_reaction ? `<div style="font-size:13px;color:#444;">${esc(m.student_reaction)}</div>` : ""}
            ${m.recommended_action ? `<div style="font-size:13px;color:#111;margin-top:2px;"><strong>Action:</strong> ${esc(m.recommended_action)}</div>` : ""}
            <div style="font-size:12px;color:#666;font-style:italic;margin-top:4px;">${m.evidence.map((e) => `“${esc(e)}”`).join("<br/>")}</div>
            <div style="font-size:11px;color:#999;margin-top:3px;">${esc(m.lessonTitle)} · ${esc(m.lessonDate)} · ${esc(m.tutorName)}</div>
          </li>`;
        })
        .join("");

      const highCount = sorted.filter((m) => m.urgency === "high").length;

      const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:760px;margin:0 auto;">
        <h2 style="margin-bottom:2px;">📌 High-impact moments — ${esc(prettyDate)}</h2>
        <p style="color:#555;margin-top:0;font-size:14px;">${sorted.length} moment${sorted.length === 1 ? "" : "s"} worth outreach${highCount ? ` · ${highCount} urgent` : ""}.</p>
        <ul style="list-style:none;padding:0;margin:16px 0 0 0;">${items}</ul>
        <p style="color:#777;font-size:12px;margin-top:24px;">Every line above is quoted directly from the lesson transcript. Automated daily review — Class Beyond Academy CRM.</p>
      </div>`;

      const { error: momentEmailError } = await resend.emails.send({
        from: "Class Beyond <enquiries@classbeyondacademy.io>",
        to: RECIPIENTS,
        subject: `📌 ${sorted.length} high-impact moment${sorted.length === 1 ? "" : "s"} from yesterday's lessons (${prettyDate})`,
        html,
      });
      if (momentEmailError) console.error("[breach-scan] Moments email failed:", momentEmailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanned: scannedCount,
        breaches: breachRows.length,
        moments: momentRows.length,
        blocked,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[breach-scan] Error:", error);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
