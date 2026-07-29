// Agent Cleo — proposal optimiser.
// Read-only. Checks each proposed lesson slot against tutor availability,
// existing group sessions and overall slot coverage, then asks the model to
// rank and phrase the findings. Never writes anything.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-5.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "plus", "level", "year", "class", "lesson", "lessons",
  "session", "sessions", "tuition", "online", "group", "1-1", "1to1",
]);

function esc(v: string) {
  return String(v).replace(/'/g, "''");
}

function normaliseDay(day: string): string | null {
  const d = String(day || "").trim().toLowerCase();
  const found = DAYS.find((x) => x.toLowerCase() === d || x.toLowerCase().startsWith(d.slice(0, 3)));
  return found ?? null;
}

function normaliseTime(time: string): string | null {
  const m = String(time || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Math.min(23, parseInt(m[1], 10));
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + (minutes || 60));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function subjectTokens(subject: string): string[] {
  const words = String(subject || "")
    .toLowerCase()
    .replace(/[^a-z0-9+\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  // Keep the most specific tokens (subject name usually trails the level).
  const uniq = Array.from(new Set(words));
  return uniq.length ? uniq.slice(-2) : [String(subject || "").toLowerCase()].filter(Boolean);
}

function tokenClause(column: string, tokens: string[], join: "or" | "and" = "or"): string {
  if (!tokens.length) return "true";
  return "(" + tokens.map((t) => `${column} ilike '%${esc(t)}%'`).join(` ${join} `) + ")";
}

async function runSql(sql: string): Promise<any[]> {
  const { data, error } = await service.rpc("agent_cleo_exec", { sql });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return Array.isArray(data) ? data : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const lessonType: string = body?.lessonType || "";
    const studentContext: string = body?.studentContext || "";
    const rawTimes: Array<{ day: string; time: string; duration: number; subject: string }> =
      Array.isArray(body?.lessonTimes) ? body.lessonTimes : [];

    const rows = rawTimes
      .map((r, index) => ({
        index,
        day: normaliseDay(r?.day),
        time: normaliseTime(r?.time),
        duration: Number(r?.duration) || 60,
        subject: String(r?.subject || "").trim(),
        raw: r,
      }))
      .filter((r) => r.day && r.time && r.subject);

    if (!rows.length) {
      return new Response(
        JSON.stringify({ error: "Add at least one lesson time with a day, time and subject first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const analysis: any[] = [];

    for (const row of rows) {
      const tokens = subjectTokens(row.subject);
      const endTime = addMinutes(row.time!, row.duration);
      const subjClause = tokenClause("s.name", tokens, "and");

      // 1. Tutors who teach this subject and are free at the proposed slot.
      let availableTutors: any[] = [];
      try {
        availableTutors = await runSql(`
          select t.id::text as tutor_id,
                 trim(t.first_name || ' ' || coalesce(t.last_name, '')) as tutor,
                 string_agg(distinct s.name, ', ') as subjects
          from tutors t
          join tutor_subjects ts on ts.tutor_id = t.id
          join subjects s on s.id = ts.subject_id
          join tutor_availability av on av.tutor_id = t.id
          where t.status = 'active'
            and ${subjClause}
            and av.day_of_week = '${esc(row.day!)}'
            and av.start_time <= time '${row.time}'
            and av.end_time >= time '${endTime}'
          group by 1, 2
          order by 2
          limit 25
        `);
      } catch (e) {
        availableTutors = [];
        console.error("availability query failed", e);
      }

      // 2. Coverage grid for this subject across the week (8am - 9pm).
      let coverage: any[] = [];
      try {
        coverage = await runSql(`
          select av.day_of_week as day,
                 h as hour,
                 count(distinct t.id)::int as tutors
          from tutors t
          join tutor_subjects ts on ts.tutor_id = t.id
          join subjects s on s.id = ts.subject_id
          join tutor_availability av on av.tutor_id = t.id
          cross join generate_series(8, 20) as h
          where t.status = 'active'
            and ${subjClause}
            and av.start_time <= make_time(h, 0, 0)
            and av.end_time >= make_time(h + 1, 0, 0)
          group by 1, 2
          having count(distinct t.id) > 0
          order by 3 desc, 1, 2
          limit 60
        `);
      } catch (e) {
        coverage = [];
        console.error("coverage query failed", e);
      }

      // 3. Existing group sessions for this subject in the next 4 weeks.
      let groups: any[] = [];
      try {
        groups = await runSql(`
          select trim(to_char(l.start_time at time zone 'Europe/London', 'FMDay')) as day,
                 to_char(l.start_time at time zone 'Europe/London', 'HH24:MI') as time,
                 max(coalesce(l.subject, '')) as subject,
                 max(l.title) as title,
                 max(coalesce(trim(t.first_name || ' ' || coalesce(t.last_name, '')), 'Unassigned')) as tutor,
                 max((select count(*) from lesson_students ls where ls.lesson_id = l.id))::int as students,
                 count(*)::int as occurrences
          from lessons l
          left join tutors t on t.id = l.tutor_id
          where l.is_group = true
            and l.cancelled_at is null
            and coalesce(l.status, 'scheduled') <> 'cancelled'
            and l.start_time between now() and now() + interval '28 days'
            and (${tokenClause("coalesce(l.subject, '')", tokens)} or ${tokenClause("l.title", tokens)})
          group by 1, 2
          order by 1, 2
          limit 40
        `);
      } catch (e) {
        groups = [];
        console.error("group query failed", e);
      }

      analysis.push({
        index: row.index,
        proposed: { day: row.day, time: row.time, duration: row.duration, subject: row.subject },
        matched_subject_tokens: tokens,
        available_tutors_at_slot: availableTutors,
        subject_coverage_by_slot: coverage,
        existing_group_sessions: groups,
      });
    }

    const prompt = `Lesson type: ${lessonType || "not specified"}
Student context: ${studentContext || "not specified"}

Proposed schedule and the calendar data for each slot:
${JSON.stringify(analysis, null, 2)}

Produce one finding per proposed slot, in the same order, using the index given.`;

    const system = `You are Agent Cleo, scheduling analyst for Class Beyond Academy (UK tutoring, Europe/London time).

You are given proposed weekly lesson slots for a client proposal plus real calendar data for each slot:
- available_tutors_at_slot: active tutors who teach a matching subject AND are free at that exact weekday/time.
- subject_coverage_by_slot: how many tutors of that subject are free at each weekday/hour across the week.
- existing_group_sessions: group sessions already running for that subject in the next 4 weeks, with current student counts.

Rules:
- Status "good": at least 2 available tutors at the slot and no clearly better alternative.
- Status "better": it works but there is a materially better option (a joinable existing group with fewer than 6 students, or a nearby slot with noticeably more tutor coverage).
- Status "none": no tutor is free at that slot for that subject.
- Existing joinable groups are the highest-value finding — mention them first in the detail.
- Only suggest an alternative day/time that actually appears in subject_coverage_by_slot with more tutors than the proposed slot. Never invent slots, tutors or groups.
- Keep the client's preference in mind: suggest the smallest possible change (same day, adjacent hour) before a different day.
- Be concrete and short. Use numbers and names from the data. British English. No emojis.

Reply with JSON only:
{"summary":"one or two sentences on the schedule overall",
 "findings":[{"index":0,"slot":"Tuesday 19:00 - A-level Maths","status":"good|better|none",
   "headline":"short verdict, max 10 words",
   "detail":"1-2 sentences citing tutor counts and names",
   "suggestion":{"day":"Wednesday","time":"19:00","reason":"why"} or null,
   "group_match":{"day":"Wednesday","time":"19:00","title":"...","tutor":"...","students":3} or null}]}`;

    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenAI error", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Cleo could not analyse the schedule (${aiRes.status}).` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, findings: [] };
    }

    return new Response(
      JSON.stringify({
        summary: parsed.summary ?? "",
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        checkedSlots: rows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("agent-cleo-optimise-proposal failed", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
