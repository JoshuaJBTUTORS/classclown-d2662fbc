// Daily tutor breach scan.
// Scans recently completed lesson transcripts for tutor policy breaches,
// stores any findings, and emails the core team a summary.

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

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

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

interface Finding {
  category: string;
  severity: "low" | "medium" | "high";
  summary: string;
  evidence: string[];
}

async function analyseTranscript(
  transcript: string,
  tutorName: string,
): Promise<{ findings: Finding[]; blocked?: boolean; error?: string }> {
  const clipped = transcript.length > MAX_TRANSCRIPT_CHARS
    ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n…[truncated]"
    : transcript;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "system",
          content:
            `You are a compliance reviewer for a UK online tutoring company. You review lesson transcripts for TUTOR breaches only (not student behaviour).\n\n${BREACH_POLICY}\n\nBe strict but avoid false positives: normal teaching, banter that is clearly friendly and appropriate, or discussing lesson logistics is NOT a breach. Only report something a compliance manager would genuinely need to act on. Transcripts are auto-generated and may contain transcription errors — do not report a breach based on an ambiguous single word.\n\nReturn JSON only: {"findings": [{"category": one of personal_information|inappropriate_communication|professional_misconduct|safeguarding|discrimination_harassment, "severity": "low"|"medium"|"high", "summary": one or two sentences, "evidence": [exact quoted lines from the transcript]}]}. If there is no breach, return {"findings": []}.`,
        },
        {
          role: "user",
          content: `Tutor in this lesson: ${tutorName}\n\nTranscript:\n${clipped}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 402 || res.status === 403) {
    const body = await res.text();
    console.error(`[breach-scan] AI gateway blocked (${res.status}): ${body}`);
    return { findings: [], blocked: true, error: `AI gateway ${res.status}` };
  }
  if (!res.ok) {
    const body = await res.text();
    return { findings: [], error: `AI gateway ${res.status}: ${body.slice(0, 300)}` };
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

  const findings: Finding[] = Array.isArray(parsed?.findings)
    ? parsed.findings
      .filter((f: any) => f && f.category && f.summary)
      .map((f: any) => ({
        category: String(f.category),
        severity: ["low", "medium", "high"].includes(f.severity) ? f.severity : "medium",
        summary: String(f.summary),
        evidence: Array.isArray(f.evidence) ? f.evidence.map((e: any) => String(e)).slice(0, 6) : [],
      }))
    : [];

  return { findings };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
      return new Response(JSON.stringify({ success: true, scanned: 0, breaches: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip anything already scanned
    const { data: scanned } = await supabase
      .from("breach_scan_log")
      .select("transcription_id")
      .in("transcription_id", candidates.map((c) => c.id));

    const alreadyScanned = new Set((scanned ?? []).map((s: any) => s.transcription_id));
    const toScan = candidates.filter((c) => !alreadyScanned.has(c.id));

    console.log(`[breach-scan] ${candidates.length} candidates, ${toScan.length} unscanned`);

    const emailRows: Array<Finding & {
      tutorName: string;
      lessonTitle: string;
      lessonDate: string;
      students: string;
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
            lesson_students(student:students(first_name, last_name))
          `)
          .eq("id", t.lesson_id)
          .maybeSingle();

        const tutor: any = lesson?.tutor;
        const tutorName = tutor ? `${tutor.first_name ?? ""} ${tutor.last_name ?? ""}`.trim() : "Unknown tutor";
        const students = ((lesson as any)?.lesson_students ?? [])
          .map((ls: any) => `${ls.student?.first_name ?? ""} ${ls.student?.last_name ?? ""}`.trim())
          .filter(Boolean)
          .join(", ") || "No students listed";
        const lessonTitle = lesson?.title ?? lesson?.subject ?? "Lesson";
        const lessonDate = lesson?.start_time
          ? formatInUKTime(lesson.start_time, "EEE d MMM yyyy, HH:mm")
          : "Unknown date";

        const { findings, blocked: isBlocked, error } = await analyseTranscript(
          t.transcription_text ?? "",
          tutorName,
        );

        if (isBlocked) {
          blocked = true;
          await supabase.from("breach_scan_log").upsert(
            { transcription_id: t.id, lesson_id: t.lesson_id, breaches_found: 0, scan_error: error },
            { onConflict: "transcription_id" },
          );
          break;
        }

        if (error) {
          console.error(`[breach-scan] transcript ${t.id}: ${error}`);
          continue; // leave unlogged so the next run retries it
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
            emailRows.push({ ...f, tutorName, lessonTitle, lessonDate, students });
          }
        }

        await supabase.from("breach_scan_log").upsert(
          {
            transcription_id: t.id,
            lesson_id: t.lesson_id,
            breaches_found: findings.length,
            scan_error: null,
          },
          { onConflict: "transcription_id" },
        );
      } catch (err: any) {
        console.error(`[breach-scan] Failed on transcript ${t.id}:`, err?.message ?? err);
      }
    }

    console.log(`[breach-scan] scanned=${scannedCount} breaches=${emailRows.length} blocked=${blocked}`);

    if (emailRows.length > 0) {
      const prettyDate = formatInUKTime(new Date(), "EEEE d MMMM yyyy");
      const rowsHtml = emailRows
        .map((b) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;"><strong>${esc(b.tutorName)}</strong></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.lessonTitle)}<br/><span style="color:#777;font-size:12px;">${esc(b.lessonDate)}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.students)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.category.replace(/_/g, " "))}<br/><span style="color:#777;font-size:12px;text-transform:uppercase;">${esc(b.severity)}</span></td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${esc(b.summary)}${
          b.evidence.length
            ? `<div style="margin-top:6px;color:#555;font-size:12px;font-style:italic;">${b.evidence.map((e) => `“${esc(e)}”`).join("<br/>")}</div>`
            : ""
        }</td>
        </tr>`)
        .join("");

      const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:900px;margin:0 auto;">
        <h2 style="margin-bottom:4px;">🚨 Tutor breach alert — ${esc(prettyDate)}</h2>
        <p style="color:#555;margin-top:0;">${emailRows.length} potential breach${emailRows.length === 1 ? "" : "es"} detected in yesterday's lesson transcripts. Review these in Agent Cleo.</p>
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
        subject: `🚨 ${emailRows.length} potential tutor breach${emailRows.length === 1 ? "" : "es"} detected (${prettyDate})`,
        html,
      });
      if (emailError) console.error("[breach-scan] Email failed:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanned: scannedCount,
        breaches: emailRows.length,
        emailSent: emailRows.length > 0,
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
