// Agent Cleo — read-only CRM analyst backed by OpenAI (direct, not Lovable Gateway).
// Tools are backed by the guarded public.agent_cleo_exec RPC.

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
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `You are Agent Cleo, an analyst for the Class Beyond CRM (a tutoring business).

You have full read-only access to the Postgres database via tools. Your ONLY write capabilities are proposing a new lesson with \`propose_lesson\` and proposing a change to an existing lesson with \`propose_lesson_edit\`. Neither writes by itself — each shows the user a confirmation card that they must approve.

WORKFLOW:
1. When asked something, first call \`list_schema\` to see what tables exist.
2. Call \`describe_table\` on the tables that look relevant to understand their columns and foreign keys.
3. Optionally call \`sample_rows\` to see actual values / string formats.
4. Then compose SELECT queries with \`run_sql\` to answer the question.

RULES:
- Never claim to have changed data — the only way anything is created is the user pressing Confirm on a proposal card.
- Do not call database functions directly. Read tables and views only.
- Prefer joining across tables over multiple round-trips.
- Use LIMIT sensibly. Results are capped at 500 rows regardless.
- All lesson times are stored in UTC; the business timezone is Europe/London.
- Be concise and factual in your final answer. Show numbers, dates, and names directly.

CREATING LESSONS:
- Before calling \`propose_lesson\` you MUST resolve real IDs by querying the database: \`tutors\` for tutor_id (uuid) and \`students\` for student_ids (integers). Never invent or guess an ID.
- If anything is missing or ambiguous (no tutor named, two students with a matching name, no date or time given, unclear subject or duration), ASK the user a short clarifying question instead of proposing. Do not fill gaps with assumptions.
- Times you provide must be ISO 8601 UTC. The user speaks in Europe/London time, so convert (British Summer Time is UTC+1 roughly late March to late October, otherwise UTC+0).
- If no duration is stated, ask; do not assume.
- Use the recurring option only when the user asks for a repeating series, and state clearly how many occurrences will be created.
- You MAY propose several lessons at once: when the request clearly covers more than one lesson, call \`propose_lesson\` once per lesson in the SAME turn (still resolving every id by querying first). Maximum 10 proposals in one turn — if more are needed, ask the user to narrow the request.
- After calling \`propose_lesson\`, reply with ONE short sentence covering all the cards shown, asking the user to review and press Confirm. Do not say the lessons exist.

EDITING LESSONS:
- Before calling \`propose_lesson_edit\` you MUST find the exact lesson by querying \`lessons\` (join \`lesson_students\`/\`students\` and \`tutors\` as needed) and use its real uuid. Never guess a lesson_id.
- If more than one lesson matches what the user described, list the candidates with date, time, tutor and students and ask which one. Do not pick for them.
- Only include the fields that should change. \`student_ids\` must be the FULL new list of students on the lesson, not just the ones being added.
- Times are ISO 8601 UTC; the user speaks Europe/London time, so convert (BST is UTC+1 roughly late March to late October, otherwise UTC+0).
- If the lesson is recurring (is_recurring or is_recurring_instance), ASK whether they mean just this occurrence or this one and all future occurrences, then set \`scope\` accordingly. Default to this_lesson_only when they only mean one date.
- Changing the tutor regenerates the LessonSpace room and participant links; changing students sends enrollment notifications. Mention this when relevant.
- You MAY propose several edits at once: when the user's request covers multiple lessons, call \`propose_lesson_edit\` once per lesson in the SAME turn (one card each, maximum 10 per turn). You can also mix creates and edits in one turn.
- After calling \`propose_lesson_edit\`, reply with ONE short sentence covering all the cards shown, asking the user to review the changes and press Confirm. Never say the lessons have been changed.

TUTORS (working hours, pay, subjects, time off):
- \`tutor_snapshot\` is the fastest way to answer any question about ONE tutor. It returns their profile, both pay rates, weekly availability, subjects, time off and upcoming lessons in a single call. Use it before writing SQL about a named tutor.
- \`tutors\`: first_name, last_name, email, phone, status ('active' / 'inactive'), title, bio, education, rating, specialities (text array), normal_hourly_rate, absence_hourly_rate.
- \`tutor_availability\`: the recurring weekly working pattern. \`day_of_week\` is a capitalised day NAME ('Monday' … 'Sunday'), and \`start_time\` / \`end_time\` are plain local Europe/London times, NOT UTC.
- \`tutor_subjects\` joins to \`subjects\` via subject_id — this is what a tutor is approved to teach. \`tutors.specialities\` is free text and less reliable.
- \`time_off_requests\`: start_date / end_date (timestamptz) with \`status\` of 'pending', 'approved' or 'denied'. Only 'approved' actually blocks work; mention pending requests as a risk, never as confirmed time off.
- \`lessons\` (+ \`lesson_students\`) hold the real scheduled load and are stored in UTC. Convert with \`AT TIME ZONE 'Europe/London'\` before comparing against \`tutor_availability\` times or before quoting a time to the user.
- Pay rates are sensitive. Report them when the user asks about pay or cost; never volunteer them in unrelated answers.
- Cross-check clashes yourself: a tutor is unavailable if the slot is outside their weekly availability, falls inside approved time off, or overlaps an existing lesson.

STUDENTS (progress, lesson summaries, assessment results, homework):
- \`student_snapshot\` is the fastest way to answer any question about ONE student. It returns profile + parent contact, attendance for 90 days, the last 10 lesson summaries (what went well / areas for improvement / topics / engagement), recurring weakness themes, every assessment assignment with attempted-only scores and the weakest questions with AI feedback, homework completion for 8 weeks, and upcoming lessons. Use it before writing SQL about a named student.
- \`students\`: \`id\` is an INTEGER, plus \`user_id\` (auth uuid) and \`parent_id\` → \`parents\`. Some tables key off \`student_id\` (integer), others off the user uuid — resolve BOTH before querying.
- \`lesson_student_summaries\`: the per-lesson AI summary — \`what_went_well\`, \`areas_for_improvement\`, \`topics_covered\`, \`engagement_level\`/\`engagement_score\`, \`confidence_score\`, \`homework_brief\`, \`attendance_status\`. Richest source for "how is this student doing".
- \`student_lesson_insights\`: denormalised dashboard mirror (subject, lesson_title, week_start_date, \`is_meaningful\`). Use it for trends over time; use the summaries table for narrative text.
- ABSENCE RULE: when \`attendance_status\` shows the student missed the lesson, engagement and confidence scores are meaningless. Report it as missed — never as low engagement.
- \`assessment_assignments\`: \`assigned_to\` is a USER UUID — and depending on the family's account setup that can be the STUDENT's user_id OR the PARENT's user_id (most are parent-assigned). ALWAYS check both: resolve \`students.user_id\` and \`parents.user_id\` (via \`students.parent_id\`) and query \`assigned_to IN (both)\`. Same for \`assessment_sessions.user_id\`. \`student_snapshot\` already does this and tags each result with \`assigned_to_account\`. \`status\` is 'pending' / 'submitted' / 'reviewed', with \`submitted_at\` and \`reviewed_at\`. Join \`ai_assessments\` for title, subject, exam_board, total_marks.
- \`assessment_sessions\`: one attempt — \`total_marks_achieved\`, \`total_marks_available\`, \`attempt_number\`, \`time_taken_minutes\`, \`status\`.
- \`student_responses\` → \`assessment_questions\`: per-question \`student_answer\`, \`marks_awarded\`, \`ai_feedback\`, \`marks_available\`. BLANK answers are SKIPPED questions and are EXCLUDED from the percentage — score attempted questions only and report the skipped count separately, so your numbers match the /assessment-assignments UI.
- \`assessment_improvements\`: stored \`weak_topics\` and \`improvement_summary\` for a session — prefer it over re-deriving weaknesses.
- Supporting tables: \`lesson_attendance\`, \`homework\` + \`homework_completion_status\`, \`lesson_revision_notes\` (flashcards), \`school_progress\` (uploaded reports and mock results), \`topic_requests\`.
- Results are sensitive: report them when asked, and never mix in or volunteer another family's data.
- \`student_impact_moments\`: high-impact moments the daily transcript scan pulled out of lessons — \`category\` (upcoming_assessment, past_assessment, assessment_result, other_academic_result, support_needed, positive_progress, goal_or_circumstance_change), \`subject\`, \`event_type\`, \`timeframe\` (as the student said it), \`event_date\`, \`grade_or_target\`, \`student_reaction\`, \`urgency\`, \`recommended_action\`, \`evidence\` (verbatim transcript quotes), \`status\` ('new' / 'actioned' / 'dismissed'), \`student_id\`, \`lesson_date\`. Use it for "who has mocks coming up", "who needs a call", "who just got results". ALWAYS quote the evidence when you report a moment — never assert one without it. \`student_snapshot\` returns these as \`impact_moments\`.
- \`tutor_breaches\`: potential tutor policy breaches from the same daily scan — \`category\`, \`severity\`, \`summary\`, \`evidence\`, \`status\` ('open' / 'resolved'), \`tutor_name\`, \`lesson_date\`. AI-flagged, so always present them as needing verification.

NAVIGATING THE CRM (opening pages):
- Agent Cleo is the landing page for admins and owners, so users will ask you to "open", "go to" or "take me to" a page. Use the \`open_page\` tool — it navigates the user's browser straight there.
- Match the request to the closest route below. If nothing matches well, say so instead of guessing a URL.
- You may pass a specific record path when you have resolved a real id (e.g. \`/students-list/42\`, \`/admin/proposals/<uuid>/view\`).
- After calling \`open_page\`, reply with one short sentence confirming what you opened.
- Routes:
  /calendar — Calendar, all scheduled lessons
  /admin-dashboard — Admin dashboard, KPIs and monthly stats
  /goals — Goals
  /admin-earnings — Admin earnings
  /admin/revenue-expansion — Revenue expansion
  /students — Students (people management)
  /students-list — Students list (admin) ; /students-list/<id> for one student
  /onboarding — Onboard a new client
  /tutors — Tutors
  /staff — Staff
  /lessons — Lessons
  /lesson-plans — Lesson plans
  /lesson-planning — Lesson planning
  /lesson-summaries — Lesson summaries
  /homework — Homework
  /assessment-center — Assessment centre
  /assessment-assignments — Assessment assignments (marking, pending review, reviewed)
  /progress — Progress
  /school-progress — School progress
  /reports — Reports
  /trial-bookings — Trial bookings
  /referrals — Referrals
  /admin/proposals — Proposals dashboard
  /admin/proposals/create — Create a proposal
  /admin/proposals/signed — Signed proposals
  /admin/sent-offers — Sent tutor offers
  /admin/live-sessions — Live sessions tracker
  /admin/recurring-lessons — Recurring lessons
  /admin/lessonspace-replay — LessonSpace replays
  /time-off-requests — Time off requests
  /topic-requests — Topic requests
  /hub-access — Hub access management
  /settings — Settings


WHEN A TOOL FAILS (failure recovery protocol):
- A tool error is NEVER the end of the task. You will always receive the error text back as the tool result — read it, work out what was wrong, and try a different approach.
- Never surface a raw database error to the user. The user should see an answer or a plain-English explanation, not Postgres output.
- Never re-send an identical failing query. Change something meaningful each time: different columns, different function, simpler query, or fewer joins.
- If you are unsure why it failed, call \`describe_table\` (and if needed \`sample_rows\`) to check your assumptions about columns, types and value formats before writing SQL again.
- Give up on one approach after about 3 attempts and either try a fundamentally different route, or tell the user clearly what you could not retrieve and why.
- Break big queries down: if a large joined query keeps failing or times out, run smaller queries and combine the results yourself.

KNOWN DATABASE LIMITS:
- The \`pg_trgm\` and \`fuzzystrmatch\` extensions are NOT installed. \`similarity()\`, the \`%\` operator, \`word_similarity\`, \`levenshtein\` and \`soundex\` do not exist. For fuzzy name matching use plain SQL: \`ILIKE '%name%'\`, \`lower()\`, \`split_part\`, or matching on first/last name separately.
- Do not call custom database functions. Read tables and views only.`;

const tools = [
  {
    type: "function",
    function: {
      name: "list_schema",
      description: "List every table and view in the public schema with an estimated row count. Use this first to see what's available.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "describe_table",
      description: "Return the columns (name, type, nullable), primary key, and foreign keys of a table in the public schema.",
      parameters: {
        type: "object",
        properties: { table: { type: "string", description: "Table name in public schema" } },
        required: ["table"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sample_rows",
      description: "Return up to N rows from a public table so you can see the shape of the data.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string" },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["table"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_sql",
      description: "Run an arbitrary read-only SQL query (SELECT / WITH only). Results are capped at 500 rows.",
      parameters: {
        type: "object",
        properties: { sql: { type: "string", description: "A single SELECT or WITH statement" } },
        required: ["sql"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tutor_snapshot",
      description:
        "Everything about one tutor in a single call: profile, status, hourly rates, weekly availability (Europe/London), subjects they can teach, approved and pending time off for the next 60 days, upcoming lessons for the next 14 days with time-off clashes flagged, and weekly scheduled vs available hours. Pass a name or a uuid. If the name is ambiguous it returns the matching candidates instead.",
      parameters: {
        type: "object",
        properties: {
          tutor: { type: "string", description: "Tutor uuid, full name, first name or last name" },
        },
        required: ["tutor"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_page",
      description:
        "Navigate the user's browser to a page in the CRM. Use when the user asks to open / go to / show a page. Pass an app path starting with '/' taken from the routes list in your instructions.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "App path, e.g. /calendar or /students-list/42" },
          label: { type: "string", description: "Human-friendly page name, e.g. 'Calendar'" },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  {

    type: "function",
    function: {
      name: "student_snapshot",
      description:
        "Everything about one student in a single call: profile and parent contact, attendance over the last 90 days, the last 10 lesson summaries (topics, engagement, what went well, areas for improvement), recurring weakness themes, all assessment assignments with attempted-only scores, percentages, skipped counts and the weakest questions with AI feedback, homework completion over 8 weeks, and upcoming lessons for the next 14 days. Pass a name, an integer student id or a user uuid. If the name is ambiguous it returns the matching candidates instead.",
      parameters: {
        type: "object",
        properties: {
          student: { type: "string", description: "Student name, integer students.id, or user uuid" },
        },
        required: ["student"],
        additionalProperties: false,
      },
    },
  },
  {

    type: "function",
    function: {
      name: "propose_lesson",
      description:
        "Propose a new lesson (one-off or recurring). This does NOT create anything — it shows the user a confirmation card which they must approve. Resolve real tutor_id and student_ids from the database first, and ask the user for any missing detail instead of guessing.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Lesson title, e.g. '1-1 GCSE Maths'" },
          subject: { type: "string", description: "Full descriptive subject, e.g. 'GCSE Maths'" },
          description: { type: "string", description: "Optional notes" },
          tutor_id: { type: "string", description: "UUID from public.tutors" },
          student_ids: {
            type: "array",
            items: { type: "integer" },
            description: "Integer IDs from public.students",
          },
          start_time: { type: "string", description: "ISO 8601 UTC start, e.g. 2026-08-04T16:00:00Z" },
          end_time: { type: "string", description: "ISO 8601 UTC end" },
          is_group: { type: "boolean", description: "Group lesson. Defaults to true when more than one student." },
          recurring: {
            type: "object",
            description: "Omit for a one-off lesson.",
            properties: {
              interval: { type: "string", enum: ["daily", "weekly", "biweekly", "monthly"] },
              occurrences: { type: "integer", minimum: 2, maximum: 52 },
            },
            required: ["interval", "occurrences"],
            additionalProperties: false,
          },
        },
        required: ["title", "subject", "tutor_id", "student_ids", "start_time", "end_time"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_lesson_edit",
      description:
        "Propose an edit to an EXISTING lesson. This does NOT change anything — it shows the user a confirmation card with a before/after diff which they must approve. Resolve the real lesson_id (and any tutor_id / student_ids) from the database first, and only include the fields that should change.",
      parameters: {
        type: "object",
        properties: {
          lesson_id: { type: "string", description: "UUID of the lesson in public.lessons" },
          scope: {
            type: "string",
            enum: ["this_lesson_only", "all_future_lessons"],
            description:
              "For recurring lessons: change only this occurrence, or this one and all future occurrences. Ask the user which they want; defaults to this_lesson_only.",
          },
          title: { type: "string" },
          description: { type: "string" },
          subject: { type: "string", description: "Full descriptive subject, e.g. 'GCSE Maths'" },
          tutor_id: { type: "string", description: "New tutor UUID from public.tutors" },
          student_ids: {
            type: "array",
            items: { type: "integer" },
            description: "The FULL new list of student ids for the lesson (not just additions).",
          },
          start_time: { type: "string", description: "New ISO 8601 UTC start" },
          end_time: { type: "string", description: "New ISO 8601 UTC end" },
          is_group: { type: "boolean" },
        },
        required: ["lesson_id"],
        additionalProperties: false,
      },
    },
  },
];


async function execSql(sql: string): Promise<unknown> {
  const normalizedSql = sql
    .trim()
    .replace(/\s+/g, " ")
    .replace(/;\s*$/, "");

  const { data, error } = await service.rpc("agent_cleo_exec", { sql: normalizedSql });
  if (error) throw new Error(error.message);
  return data;
}

async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    if (name === "list_schema") {
      const rows = await execSql(`
        SELECT table_name AS name,
               CASE table_type
                 WHEN 'BASE TABLE' THEN 'table'
                 WHEN 'VIEW' THEN 'view'
                 ELSE lower(table_type)
               END AS kind
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_name
      `);
      return JSON.stringify({ ok: true, rows });
    }
    if (name === "describe_table") {
      const table = String(args.table).replace(/[^a-zA-Z0-9_]/g, "");
      const cols = await execSql(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${table}'
        ORDER BY ordinal_position
      `);
      const fks = await execSql(`
        SELECT kcu.column_name, ccu.table_name AS references_table, ccu.column_name AS references_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public' AND tc.table_name = '${table}'
      `);
      const pk = await execSql(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public' AND tc.table_name = '${table}'
      `);
      return JSON.stringify({ ok: true, columns: cols, primary_key: pk, foreign_keys: fks });
    }
    if (name === "sample_rows") {
      const table = String(args.table).replace(/[^a-zA-Z0-9_]/g, "");
      const limit = Math.min(Number(args.limit ?? 5), 20);
      const rows = await execSql(`SELECT * FROM public."${table}" LIMIT ${limit}`);
      return JSON.stringify({ ok: true, rows });
    }
    if (name === "run_sql") {
      let sql = String(args.sql).trim().replace(/;+\s*$/, "");
      if (!/\blimit\s+\d+/i.test(sql)) sql = `SELECT * FROM (${sql}) _sub LIMIT 500`;
      const rows = await execSql(sql);
      return JSON.stringify({ ok: true, rows });
    }
    if (name === "tutor_snapshot") {
      return JSON.stringify(await tutorSnapshot(String(args.tutor ?? "")));
    }
    if (name === "student_snapshot") {
      return JSON.stringify(await studentSnapshot(String(args.student ?? "")));
    }

    return JSON.stringify({ ok: false, error: `Unknown tool: ${name}` });
  } catch (e) {
    const message = (e as Error).message;
    console.error(`Agent Cleo tool failed: ${name}`, { args, error: message });
    return JSON.stringify({
      ok: false,
      tool: name,
      error: message,
      recoverable: true,
      hint: recoveryHint(message),
    });
  }
}

/** Turn a raw Postgres error into an actionable next step for the model. */
function recoveryHint(message: string): string {
  const m = message.toLowerCase();
  if (/function .* does not exist/.test(m)) {
    return "That function or extension is not available in this database (pg_trgm/fuzzystrmatch are not installed). Rewrite using plain SQL — ILIKE '%text%', lower(), split_part — instead of similarity()/%/levenshtein/soundex.";
  }
  if (/column .* does not exist/.test(m)) {
    return "Wrong column name. Call describe_table on the relevant table and use the exact column names it returns.";
  }
  if (/relation .* does not exist/.test(m)) {
    return "Wrong table name. Call list_schema to see the real table names, then retry.";
  }
  if (/operator does not exist|cannot be matched|invalid input syntax|cannot cast/.test(m)) {
    return "Type mismatch. Check the column types with describe_table and add an explicit cast (e.g. ::text, ::date, ::uuid).";
  }
  if (/syntax error/.test(m)) {
    return "Rewrite the query — check quoting, commas and CTE structure. Simplify it if needed.";
  }
  if (/timeout|canceling statement|statement timeout/.test(m)) {
    return "The query was too heavy. Narrow the date range, drop joins, or add a tighter LIMIT and retry.";
  }
  if (/only accepts select/.test(m)) {
    return "Only SELECT/WITH queries are allowed. Rewrite as a read-only SELECT.";
  }
  if (/permission denied/.test(m)) {
    return "That object is not readable. Pick a different table or view that exposes the same data.";
  }
  return "Read the error, change your approach, and try a different query. Do not repeat the same one.";
}

/* ------------------------------------------------------------------ *
 * Tutor knowledge: availability, pay, subjects, time off, clashes
 * ------------------------------------------------------------------ */

const LONDON = "Europe/London";

/** Weekday name + HH:MM for an instant, in Europe/London local time. */
function londonParts(iso: string | Date): { day: string; time: string; label: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: LONDON, weekday: "long" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return { day, time, label };
}

const toMinutes = (t: string) => {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

async function resolveTutor(input: string) {
  const term = input.trim();
  if (!term) return { candidates: [] as any[] };

  if (/^[0-9a-f-]{36}$/i.test(term)) {
    const { data } = await service.from("tutors").select("*").eq("id", term).maybeSingle();
    return { candidates: data ? [data] : [] };
  }

  const like = `%${term}%`;
  const { data } = await service
    .from("tutors")
    .select("*")
    .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`);
  let rows = data ?? [];

  if (rows.length > 1 && term.includes(" ")) {
    const [first, ...rest] = term.split(/\s+/);
    const last = rest.join(" ").toLowerCase();
    const exact = rows.filter(
      (t: any) =>
        (t.first_name ?? "").toLowerCase() === first.toLowerCase() &&
        (t.last_name ?? "").toLowerCase() === last,
    );
    if (exact.length) rows = exact;
  }
  return { candidates: rows };
}

/**
 * Full picture of one tutor: profile, rates, weekly availability,
 * subjects, time off and upcoming lessons with clashes flagged.
 */
async function tutorSnapshot(input: string) {
  const { candidates } = await resolveTutor(input);
  if (!candidates.length) {
    return { ok: false, error: `No tutor matched "${input}". Search public.tutors with ILIKE to find the right name.` };
  }
  if (candidates.length > 1) {
    return {
      ok: false,
      ambiguous: true,
      error: `${candidates.length} tutors match "${input}". Ask the user which one they mean.`,
      candidates: candidates.map((t: any) => ({
        id: t.id,
        name: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim(),
        email: t.email,
        status: t.status,
      })),
    };
  }

  const tutor: any = candidates[0];
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [availabilityRes, subjectsRes, timeOffRes, lessonsRes] = await Promise.all([
    service
      .from("tutor_availability")
      .select("day_of_week, start_time, end_time")
      .eq("tutor_id", tutor.id),
    service.from("tutor_subjects").select("subject_id, subjects(name)").eq("tutor_id", tutor.id),
    service
      .from("time_off_requests")
      .select("id, start_date, end_date, status, reason")
      .eq("tutor_id", tutor.id)
      .lte("start_date", in60.toISOString())
      .gte("end_date", now.toISOString()),
    service
      .from("lessons")
      .select("id, title, subject, start_time, end_time, status, is_group")
      .eq("tutor_id", tutor.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", in14.toISOString())
      .order("start_time", { ascending: true }),
  ]);

  const availability = (availabilityRes.data ?? []).map((a: any) => ({
    day: a.day_of_week,
    start: String(a.start_time).slice(0, 5),
    end: String(a.end_time).slice(0, 5),
  }));
  const availableHoursPerWeek =
    availability.reduce((sum, a) => sum + Math.max(0, toMinutes(a.end) - toMinutes(a.start)), 0) / 60;

  const timeOff = (timeOffRes.data ?? []).map((t: any) => ({
    id: t.id,
    status: t.status,
    start: t.start_date,
    end: t.end_date,
    reason: t.reason ?? null,
  }));
  const approvedOff = timeOff.filter((t) => t.status === "approved");

  const lessons = (lessonsRes.data ?? []).map((l: any) => {
    const p = londonParts(l.start_time);
    const clash = approvedOff.find(
      (o) => new Date(l.start_time) < new Date(o.end) && new Date(l.end_time) > new Date(o.start),
    );
    return {
      id: l.id,
      title: l.title,
      subject: l.subject,
      status: l.status,
      is_group: l.is_group,
      london: p.label,
      start_time_utc: l.start_time,
      end_time_utc: l.end_time,
      clashes_with_approved_time_off: Boolean(clash),
    };
  });

  const next7 = lessons.filter((l) => new Date(l.start_time_utc) <= new Date(now.getTime() + 7 * 864e5));
  const scheduledHoursNext7 =
    next7.reduce(
      (sum, l) => sum + (new Date(l.end_time_utc).getTime() - new Date(l.start_time_utc).getTime()) / 3600000,
      0,
    ) || 0;

  return {
    ok: true,
    tutor: {
      id: tutor.id,
      name: `${tutor.first_name ?? ""} ${tutor.last_name ?? ""}`.trim(),
      email: tutor.email,
      phone: tutor.phone ?? null,
      status: tutor.status,
      title: tutor.title ?? null,
      education: tutor.education ?? null,
      rating: tutor.rating ?? null,
      specialities: tutor.specialities ?? [],
      normal_hourly_rate: tutor.normal_hourly_rate ?? null,
      absence_hourly_rate: tutor.absence_hourly_rate ?? null,
    },
    availability_note: "Weekly recurring pattern, times are Europe/London local.",
    availability,
    available_hours_per_week: Number(availableHoursPerWeek.toFixed(2)),
    subjects: (subjectsRes.data ?? []).map((s: any) => s.subjects?.name).filter(Boolean),
    time_off_next_60_days: timeOff,
    lessons_next_14_days: lessons,
    scheduled_hours_next_7_days: Number(scheduledHoursNext7.toFixed(2)),
  };
}

/**
 * Non-blocking checks for a proposed slot: availability window, approved
 * time off, overlapping lessons and subject coverage. Returns plain warnings.
 */
async function tutorSlotWarnings(opts: {
  tutorId: string;
  startISO: string;
  endISO: string;
  subject?: string | null;
  excludeLessonId?: string | null;
}): Promise<string[]> {
  const warnings: string[] = [];
  const start = new Date(opts.startISO);
  const end = new Date(opts.endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return warnings;

  try {
    const [availRes, offRes, clashRes, subjRes] = await Promise.all([
      service.from("tutor_availability").select("day_of_week, start_time, end_time").eq("tutor_id", opts.tutorId),
      service
        .from("time_off_requests")
        .select("start_date, end_date, status")
        .eq("tutor_id", opts.tutorId)
        .lte("start_date", end.toISOString())
        .gte("end_date", start.toISOString()),
      service
        .from("lessons")
        .select("id, title, start_time, end_time, status")
        .eq("tutor_id", opts.tutorId)
        .lt("start_time", end.toISOString())
        .gt("end_time", start.toISOString()),
      opts.subject
        ? service.from("tutor_subjects").select("subjects(name)").eq("tutor_id", opts.tutorId)
        : Promise.resolve({ data: null } as any),
    ]);

    const startParts = londonParts(start);
    const endParts = londonParts(end);
    const slots = (availRes.data ?? []).filter(
      (a: any) => String(a.day_of_week).toLowerCase() === startParts.day.toLowerCase(),
    );
    if (!slots.length) {
      warnings.push(`Tutor has no availability recorded for ${startParts.day}.`);
    } else {
      const fits = slots.some(
        (a: any) =>
          toMinutes(startParts.time) >= toMinutes(a.start_time) &&
          toMinutes(endParts.time) <= toMinutes(a.end_time),
      );
      if (!fits) {
        const windows = slots.map((a: any) => `${String(a.start_time).slice(0, 5)}–${String(a.end_time).slice(0, 5)}`);
        warnings.push(
          `${startParts.time}–${endParts.time} is outside the tutor's ${startParts.day} availability (${windows.join(", ")}).`,
        );
      }
    }

    for (const off of offRes.data ?? []) {
      if (off.status === "approved") warnings.push("Tutor has approved time off covering this slot.");
      else if (off.status === "pending") warnings.push("Tutor has a pending time off request covering this slot.");
    }

    const clashes = (clashRes.data ?? []).filter(
      (l: any) => l.id !== opts.excludeLessonId && l.status !== "cancelled",
    );
    for (const c of clashes) {
      warnings.push(`Overlaps an existing lesson: ${c.title ?? "Lesson"} at ${londonParts(c.start_time).label}.`);
    }

    if (opts.subject && subjRes?.data) {
      const names = (subjRes.data as any[]).map((s) => s.subjects?.name).filter(Boolean) as string[];
      if (names.length) {
        const wanted = opts.subject.toLowerCase();
        const covered = names.some((n) => wanted.includes(n.toLowerCase()) || n.toLowerCase().includes(wanted));
        if (!covered) {
          warnings.push(`Tutor is not linked to this subject (teaches: ${names.join(", ")}).`);
        }
      }
    }
  } catch (e) {
    console.error("tutorSlotWarnings failed", e);
  }

  return warnings;
}



/**
 * Validate a proposed lesson and enrich it with human-readable names.
 * Performs NO writes — the user must approve the card before anything is created.
 */
async function buildLessonProposal(args: Record<string, any>) {
  const problems: string[] = [];

  const title = typeof args.title === "string" ? args.title.trim() : "";
  const subject = typeof args.subject === "string" ? args.subject.trim() : "";
  if (!title) problems.push("title is required");
  if (!subject) problems.push("subject is required");

  const tutorId = typeof args.tutor_id === "string" ? args.tutor_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(tutorId)) problems.push("tutor_id must be a uuid from public.tutors");

  const studentIds: number[] = Array.isArray(args.student_ids)
    ? args.student_ids.map((s: unknown) => Number(s)).filter((n: number) => Number.isInteger(n))
    : [];
  if (studentIds.length === 0) problems.push("student_ids must contain at least one integer student id");

  const start = new Date(args.start_time);
  const end = new Date(args.end_time);
  if (isNaN(start.getTime())) problems.push("start_time must be ISO 8601 UTC");
  if (isNaN(end.getTime())) problems.push("end_time must be ISO 8601 UTC");
  if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
    problems.push("end_time must be after start_time");
  }

  let recurring: { interval: string; occurrences: number } | null = null;
  if (args.recurring) {
    const interval = String(args.recurring.interval ?? "").toLowerCase();
    const occurrences = Number(args.recurring.occurrences);
    if (!["daily", "weekly", "biweekly", "monthly"].includes(interval)) {
      problems.push("recurring.interval must be daily, weekly, biweekly or monthly");
    }
    if (!Number.isInteger(occurrences) || occurrences < 2 || occurrences > 52) {
      problems.push("recurring.occurrences must be an integer between 2 and 52");
    }
    if (!problems.length) recurring = { interval, occurrences };
  }

  if (problems.length) return { ok: false as const, error: problems.join("; ") };

  const { data: tutor } = await service
    .from("tutors")
    .select("id, first_name, last_name")
    .eq("id", tutorId)
    .maybeSingle();
  if (!tutor) {
    return { ok: false as const, error: `No tutor found with id ${tutorId}. Look the tutor up in public.tutors first.` };
  }

  const { data: students } = await service
    .from("students")
    .select("id, first_name, last_name")
    .in("id", studentIds);
  const found = students ?? [];
  const missing = studentIds.filter((id) => !found.some((s) => s.id === id));
  if (missing.length) {
    return { ok: false as const, error: `No student found with id ${missing.join(", ")}. Look students up in public.students first.` };
  }

  const warnings = await tutorSlotWarnings({
    tutorId,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    subject,
  });

  const proposal = {
    title,
    subject,
    description: typeof args.description === "string" ? args.description.trim() : null,
    tutor_id: tutorId,
    tutor_name: `${tutor.first_name ?? ""} ${tutor.last_name ?? ""}`.trim(),
    student_ids: studentIds,
    student_names: found.map((s) => `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()),
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    is_group: typeof args.is_group === "boolean" ? args.is_group : studentIds.length > 1,
    recurring,
    warnings,
  };

  return { ok: true as const, proposal };
}

/**
 * Validate a proposed EDIT to an existing lesson and build a before/after diff.
 * Performs NO writes — the user must approve the card, and the client then applies
 * the change through the same service the calendar edit form uses.
 */
async function buildLessonEditProposal(args: Record<string, any>) {
  const lessonId = typeof args.lesson_id === "string" ? args.lesson_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) {
    return { ok: false as const, error: "lesson_id must be a uuid from public.lessons. Look the lesson up first." };
  }

  const { data: lesson } = await service
    .from("lessons")
    .select(
      "id, title, description, subject, tutor_id, start_time, end_time, is_group, is_recurring, is_recurring_instance, parent_lesson_id, instance_date, status",
    )
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) {
    return { ok: false as const, error: `No lesson found with id ${lessonId}. Query public.lessons to find the right one.` };
  }

  const { data: currentLinks } = await service
    .from("lesson_students")
    .select("student_id, students(first_name, last_name)")
    .eq("lesson_id", lessonId);
  const currentStudentIds = (currentLinks ?? []).map((l: any) => l.student_id);
  const currentStudentNames = (currentLinks ?? []).map((l: any) =>
    `${l.students?.first_name ?? ""} ${l.students?.last_name ?? ""}`.trim() || `#${l.student_id}`,
  );

  const { data: currentTutor } = lesson.tutor_id
    ? await service.from("tutors").select("first_name, last_name").eq("id", lesson.tutor_id).maybeSingle()
    : { data: null as any };
  const currentTutorName = currentTutor
    ? `${currentTutor.first_name ?? ""} ${currentTutor.last_name ?? ""}`.trim()
    : "Unassigned";

  const problems: string[] = [];
  const changes: Array<{ field: string; label: string; before: string; after: string }> = [];
  const updates: Record<string, unknown> = {};

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  if (typeof args.title === "string" && str(args.title) && str(args.title) !== (lesson.title ?? "")) {
    updates.title = str(args.title);
    changes.push({ field: "title", label: "Title", before: lesson.title ?? "—", after: str(args.title) });
  }
  if (typeof args.subject === "string" && str(args.subject) && str(args.subject) !== (lesson.subject ?? "")) {
    updates.subject = str(args.subject);
    changes.push({ field: "subject", label: "Subject", before: lesson.subject ?? "—", after: str(args.subject) });
  }
  if (typeof args.description === "string" && str(args.description) !== (lesson.description ?? "")) {
    updates.description = str(args.description);
    changes.push({
      field: "description",
      label: "Description",
      before: lesson.description || "—",
      after: str(args.description) || "—",
    });
  }

  if (typeof args.tutor_id === "string" && args.tutor_id && args.tutor_id !== lesson.tutor_id) {
    if (!/^[0-9a-f-]{36}$/i.test(args.tutor_id)) {
      problems.push("tutor_id must be a uuid from public.tutors");
    } else {
      const { data: newTutor } = await service
        .from("tutors")
        .select("first_name, last_name")
        .eq("id", args.tutor_id)
        .maybeSingle();
      if (!newTutor) {
        problems.push(`No tutor found with id ${args.tutor_id}. Look the tutor up in public.tutors first.`);
      } else {
        updates.tutor_id = args.tutor_id;
        changes.push({
          field: "tutor_id",
          label: "Tutor",
          before: currentTutorName || "Unassigned",
          after: `${newTutor.first_name ?? ""} ${newTutor.last_name ?? ""}`.trim(),
        });
      }
    }
  }

  let newStart: Date | null = null;
  let newEnd: Date | null = null;
  if (args.start_time !== undefined || args.end_time !== undefined) {
    newStart = new Date(args.start_time ?? lesson.start_time);
    newEnd = new Date(args.end_time ?? lesson.end_time);
    if (isNaN(newStart.getTime())) problems.push("start_time must be ISO 8601 UTC");
    if (isNaN(newEnd.getTime())) problems.push("end_time must be ISO 8601 UTC");
    if (newStart && newEnd && !isNaN(newStart.getTime()) && !isNaN(newEnd.getTime()) && newEnd <= newStart) {
      problems.push("end_time must be after start_time");
    }
    if (!problems.length) {
      const startChanged = newStart!.toISOString() !== new Date(lesson.start_time).toISOString();
      const endChanged = newEnd!.toISOString() !== new Date(lesson.end_time).toISOString();
      if (startChanged || endChanged) {
        updates.start_time = newStart!.toISOString();
        updates.end_time = newEnd!.toISOString();
        changes.push({
          field: "time",
          label: "Date & time",
          before: `${lesson.start_time}|${lesson.end_time}`,
          after: `${newStart!.toISOString()}|${newEnd!.toISOString()}`,
        });
      }
    }
  }

  let newStudentIds: number[] | null = null;
  if (Array.isArray(args.student_ids)) {
    newStudentIds = args.student_ids.map((s: unknown) => Number(s)).filter((n: number) => Number.isInteger(n));
    if (!newStudentIds.length) {
      problems.push("student_ids must contain at least one integer student id");
    } else {
      const { data: students } = await service
        .from("students")
        .select("id, first_name, last_name")
        .in("id", newStudentIds);
      const found = students ?? [];
      const missing = newStudentIds.filter((id) => !found.some((s) => s.id === id));
      if (missing.length) {
        problems.push(`No student found with id ${missing.join(", ")}. Look students up in public.students first.`);
      } else {
        const same =
          newStudentIds.length === currentStudentIds.length &&
          newStudentIds.every((id) => currentStudentIds.includes(id));
        if (!same) {
          updates.student_ids = newStudentIds;
          changes.push({
            field: "students",
            label: "Students",
            before: currentStudentNames.join(", ") || "—",
            after: found.map((s) => `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()).join(", "),
          });
        }
      }
    }
  }

  if (typeof args.is_group === "boolean" && args.is_group !== lesson.is_group) {
    updates.is_group = args.is_group;
    changes.push({
      field: "is_group",
      label: "Lesson type",
      before: lesson.is_group ? "Group lesson" : "1-1 lesson",
      after: args.is_group ? "Group lesson" : "1-1 lesson",
    });
  }

  if (problems.length) return { ok: false as const, error: problems.join("; ") };
  if (!changes.length) {
    return {
      ok: false as const,
      error: "Nothing would change — the values given already match the lesson. Ask the user what they want changed.",
    };
  }

  const isRecurring = Boolean(lesson.is_recurring || lesson.is_recurring_instance);
  const scope = args.scope === "all_future_lessons" && isRecurring ? "all_future_lessons" : "this_lesson_only";

  // Mirror getAffectedLessonsCount from the calendar edit service.
  let affectedCount = 1;
  if (scope === "all_future_lessons") {
    const parentId = lesson.is_recurring_instance && lesson.parent_lesson_id ? lesson.parent_lesson_id : lesson.id;
    const fromDate =
      lesson.is_recurring_instance && lesson.parent_lesson_id
        ? lesson.instance_date ?? new Date(lesson.start_time).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const { count } = await service
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("parent_lesson_id", parentId)
      .eq("is_recurring_instance", true)
      .gte("instance_date", fromDate);
    affectedCount = (count ?? 0) + (lesson.is_recurring_instance ? 0 : 1);
  }

  const sideEffects: string[] = [];
  if (updates.tutor_id) sideEffects.push("The LessonSpace room and all participant links are regenerated.");
  if (updates.student_ids) sideEffects.push("Enrollment notifications are sent for students added or removed.");

  // Re-check tutor availability whenever the tutor or the timing changes.
  const effectiveTutorId = (updates.tutor_id as string) ?? lesson.tutor_id;
  const effectiveStart = (updates.start_time as string) ?? lesson.start_time;
  const effectiveEnd = (updates.end_time as string) ?? lesson.end_time;
  const warnings =
    effectiveTutorId && (updates.tutor_id || updates.start_time || updates.end_time || updates.subject)
      ? await tutorSlotWarnings({
          tutorId: effectiveTutorId,
          startISO: new Date(effectiveStart).toISOString(),
          endISO: new Date(effectiveEnd).toISOString(),
          subject: (updates.subject as string) ?? lesson.subject,
          excludeLessonId: lesson.id,
        })
      : [];

  return {
    ok: true as const,
    proposal: {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      lesson_start_time: lesson.start_time,
      is_recurring: isRecurring,
      scope,
      affected_count: affectedCount,
      changes,
      updates,
      side_effects: sideEffects,
      warnings,
    },
  };
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: verify JWT + role
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

    const body = await req.json();
    const userMessages = body.messages ?? [];

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages,
    ];

    // Streaming SSE response back to the browser
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        try {
          let totalFailures = 0;
          let consecutiveFailures = 0;
          let lastFailedTool: string | null = null;

          for (let step = 0; step < 20; step++) {
            // Call OpenAI with backoff on transient failures (429 / 5xx).
            let resp: Response | null = null;
            for (let attempt = 0; attempt < 4; attempt++) {
              resp = await fetch(OPENAI_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  model: MODEL,
                  messages,
                  tools,
                  stream: true,
                  reasoning_effort: "none",
                }),
              });
              const retryable = resp.status === 429 || resp.status >= 500;
              if (resp.ok && resp.body) break;
              if (!retryable || attempt === 3) break;
              send({ type: "tool_error", tool: "model", error: `OpenAI ${resp.status}, retrying` });
              await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
            }

            if (!resp || !resp.ok || !resp.body) {
              const errText = resp ? await resp.text() : "no response";
              send({ type: "error", error: `OpenAI ${resp?.status ?? 0}: ${errText}` });
              controller.close();
              return;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let assistantText = "";
            const toolCalls: Record<number, { id?: string; name?: string; args: string }> = {};
            let finishReason: string | null = null;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const data = line.slice(5).trim();
                if (!data || data === "[DONE]") continue;
                let parsed: any;
                try { parsed = JSON.parse(data); } catch { continue; }
                const choice = parsed.choices?.[0];
                if (!choice) continue;
                const delta = choice.delta ?? {};
                if (delta.content) {
                  assistantText += delta.content;
                  send({ type: "text", delta: delta.content });
                }
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCalls[idx]) toolCalls[idx] = { args: "" };
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
                  }
                }
                if (choice.finish_reason) finishReason = choice.finish_reason;
              }
            }

            const calls = Object.entries(toolCalls).sort(([a], [b]) => Number(a) - Number(b));
            if (calls.length === 0) {
              send({ type: "done" });
              controller.close();
              return;
            }

            // Push assistant message with the tool calls
            messages.push({
              role: "assistant",
              content: assistantText || null,
              tool_calls: calls.map(([, c]) => ({
                id: c.id,
                type: "function",
                function: { name: c.name, arguments: c.args || "{}" },
              })),
            });

            // Execute tool calls, stream status chips, push results
            for (const [, call] of calls) {
              send({ type: "tool", name: call.name });
              let parsedArgs: Record<string, unknown> = {};
              try { parsedArgs = JSON.parse(call.args || "{}"); } catch {}

              if (call.name === "open_page") {
                const rawPath = String((parsedArgs as any).path ?? "").trim();
                const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
                const label = String((parsedArgs as any).label ?? path);
                if (!/^\/[A-Za-z0-9\-_/:.]*$/.test(path)) {
                  messages.push({
                    role: "tool",
                    tool_call_id: call.id!,
                    content: JSON.stringify({ ok: false, error: `Invalid path: ${rawPath}` }),
                  });
                  continue;
                }
                send({ type: "navigate", path, label });
                messages.push({
                  role: "tool",
                  tool_call_id: call.id!,
                  content: JSON.stringify({ ok: true, opened: path, note: "The user is being taken to this page now. Reply with one short sentence confirming it." }),
                });
                continue;
              }

              if (call.name === "propose_lesson") {

                const built = await buildLessonProposal(parsedArgs as Record<string, any>);
                if (built.ok) {
                  send({ type: "proposal", proposal: built.proposal });
                  messages.push({
                    role: "tool",
                    tool_call_id: call.id!,
                    content: JSON.stringify({
                      ok: true,
                      status: "awaiting_user_confirmation",
                      note: "A confirmation card has been shown to the user (there may be several cards this turn). Nothing has been created yet. Once all your proposals for this turn are made, reply with one short sentence asking them to review and press Confirm.",
                    }),
                  });
                } else {
                  messages.push({
                    role: "tool",
                    tool_call_id: call.id!,
                    content: JSON.stringify({ ok: false, error: built.error }),
                  });
                }
                continue;
              }

              if (call.name === "propose_lesson_edit") {
                const built = await buildLessonEditProposal(parsedArgs as Record<string, any>);
                if (built.ok) {
                  send({ type: "edit_proposal", proposal: built.proposal });
                  messages.push({
                    role: "tool",
                    tool_call_id: call.id!,
                    content: JSON.stringify({
                      ok: true,
                      status: "awaiting_user_confirmation",
                      note: "An edit confirmation card has been shown to the user (there may be several cards this turn). Nothing has been changed yet. Once all your proposals for this turn are made, reply with one short sentence asking them to review the changes and press Confirm.",
                    }),
                  });
                } else {
                  messages.push({
                    role: "tool",
                    tool_call_id: call.id!,
                    content: JSON.stringify({ ok: false, error: built.error }),
                  });
                }
                continue;
              }



              const result = await runTool(call.name!, parsedArgs);
              let failed = false;
              let failMessage = "";
              try {
                const parsedResult = JSON.parse(result);
                if (parsedResult?.ok === false) {
                  failed = true;
                  failMessage = String(parsedResult.error ?? "unknown error");
                }
              } catch {
                // Non-JSON tool output is still forwarded to the model below.
              }

              // Failures are recoverable: hand the error back to the model and keep going.
              messages.push({
                role: "tool",
                tool_call_id: call.id!,
                content: result.length > 60000 ? result.slice(0, 60000) + "…[truncated]" : result,
              });

              if (failed) {
                totalFailures++;
                consecutiveFailures = lastFailedTool === call.name ? consecutiveFailures + 1 : 1;
                lastFailedTool = call.name ?? null;
                send({ type: "tool_error", tool: call.name, error: failMessage });

                if (consecutiveFailures >= 3) {
                  messages.push({
                    role: "system",
                    content:
                      `\`${call.name}\` has now failed ${consecutiveFailures} times in a row. Stop retrying this shape of query. Either verify your assumptions with describe_table/sample_rows, take a fundamentally different approach, or give the user a plain-English explanation of what you could not retrieve.`,
                  });
                  consecutiveFailures = 0;
                }

                if (totalFailures >= 6) {
                  messages.push({
                    role: "system",
                    content:
                      "Too many tool failures this turn. Do not call any more tools. Reply now with a short plain-English answer using whatever you did manage to gather, and say clearly what you could not retrieve.",
                  });
                }
              } else {
                consecutiveFailures = 0;
                lastFailedTool = null;
              }
            }

            if (finishReason && finishReason !== "tool_calls") {
              send({ type: "done" });
              controller.close();
              return;
            }
          }
          send({ type: "error", error: "I couldn't finish that within the allowed number of steps. Try narrowing the question." });
          controller.close();
        } catch (e) {
          send({ type: "error", error: (e as Error).message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ------------------------------------------------------------------ *
 * Student knowledge: progress, summaries, assessments, homework
 * ------------------------------------------------------------------ */

async function resolveStudent(input: string) {
  const term = input.trim();
  if (!term) return [] as any[];

  if (/^\d+$/.test(term)) {
    const { data } = await service.from("students").select("*").eq("id", Number(term)).maybeSingle();
    return data ? [data] : [];
  }
  if (/^[0-9a-f-]{36}$/i.test(term)) {
    const { data } = await service.from("students").select("*").eq("user_id", term);
    return data ?? [];
  }

  const like = `%${term}%`;
  const { data } = await service
    .from("students")
    .select("*")
    .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`);
  let rows = data ?? [];

  if (rows.length > 1 && term.includes(" ")) {
    const [first, ...rest] = term.split(/\s+/);
    const last = rest.join(" ").toLowerCase();
    const exact = rows.filter(
      (s: any) =>
        (s.first_name ?? "").toLowerCase() === first.toLowerCase() &&
        (s.last_name ?? "").toLowerCase() === last,
    );
    if (exact.length) rows = exact;
  }
  return rows;
}

const blank = (v: unknown) => !String(v ?? "").trim();

/**
 * Full picture of one student: attendance, lesson summaries, weaknesses,
 * assessment results (attempted questions only) and homework completion.
 */
async function studentSnapshot(input: string) {
  const candidates = await resolveStudent(input);
  if (!candidates.length) {
    return { ok: false, error: `No student matched "${input}". Search public.students with ILIKE to find the right name.` };
  }
  if (candidates.length > 1) {
    return {
      ok: false,
      ambiguous: true,
      error: `${candidates.length} students match "${input}". Ask the user which one they mean.`,
      candidates: candidates.map((s: any) => ({
        id: s.id,
        name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        email: s.email,
        grade: s.grade,
        status: s.status,
      })),
    };
  }

  const student: any = candidates[0];
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const ago90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const ago56 = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [parentRes, linkRes, summariesRes, assignmentsRes, sessionsRes, hwStatusRes] = await Promise.all([
    student.parent_id
      ? service
          .from("parents")
          .select("user_id, first_name, last_name, email, phone, whatsapp_number, account_type")
          .eq("id", student.parent_id)
          .maybeSingle()
      : Promise.resolve({ data: null } as any),
    service.from("lesson_students").select("lesson_id").eq("student_id", student.id),
    service
      .from("lesson_student_summaries")
      .select(
        "lesson_id, topics_covered, what_went_well, areas_for_improvement, engagement_level, engagement_score, confidence_score, attendance_status, homework_brief, created_at, lessons(title, subject, start_time)",
      )
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(10),
    student.user_id
      ? service
          .from("assessment_assignments")
          .select(
            "id, assessment_id, status, due_date, submitted_at, reviewed_at, ai_assessments(title, subject, exam_board, total_marks)",
          )
          .eq("assigned_to", student.user_id)
          .order("created_at", { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [] } as any),
    service
      .from("assessment_sessions")
      .select("id, assessment_id, status, attempt_number, time_taken_minutes, started_at, completed_at")
      .or(
        [`student_id.eq.${student.id}`, student.user_id ? `user_id.eq.${student.user_id}` : ""]
          .filter(Boolean)
          .join(","),
      )
      .order("started_at", { ascending: false })
      .limit(25),
    service
      .from("homework_completion_status")
      .select("homework_id, status, created_at")
      .eq("student_id", student.id)
      .gte("created_at", iso(ago56)),
  ]);

  // Assessments may be assigned to the STUDENT's account or to the PARENT's account
  // (depending on how the family's accounts are set up), so check both.
  const parentUserId = (parentRes as any)?.data?.user_id ?? null;
  if (parentUserId && parentUserId !== student.user_id) {
    const { data: parentAssignments } = await service
      .from("assessment_assignments")
      .select(
        "id, assessment_id, status, due_date, submitted_at, reviewed_at, ai_assessments(title, subject, exam_board, total_marks)",
      )
      .eq("assigned_to", parentUserId)
      .order("created_at", { ascending: false })
      .limit(25);
    const existing = new Set(((assignmentsRes as any).data ?? []).map((a: any) => a.id));
    (assignmentsRes as any).data = [
      ...(((assignmentsRes as any).data ?? []).map((a: any) => ({ ...a, assigned_to_account: "student" }))),
      ...((parentAssignments ?? [])
        .filter((a: any) => !existing.has(a.id))
        .map((a: any) => ({ ...a, assigned_to_account: "parent" }))),
    ];
  }

  // Sessions can also sit under the parent's user_id when the parent account took the exam.
  if (parentUserId && parentUserId !== student.user_id) {
    const assignedAssessmentIds = Array.from(
      new Set((((assignmentsRes as any).data ?? []) as any[]).map((a: any) => a.assessment_id).filter(Boolean)),
    );
    if (assignedAssessmentIds.length) {
      const { data: parentSessions } = await service
        .from("assessment_sessions")
        .select("id, assessment_id, status, attempt_number, time_taken_minutes, started_at, completed_at")
        .eq("user_id", parentUserId)
        .in("assessment_id", assignedAssessmentIds)
        .order("started_at", { ascending: false })
        .limit(25);
      const seen = new Set((((sessionsRes as any).data ?? []) as any[]).map((s: any) => s.id));
      (sessionsRes as any).data = [
        ...(((sessionsRes as any).data ?? []) as any[]),
        ...((parentSessions ?? []).filter((s: any) => !seen.has(s.id))),
      ];
    }
  }

  const lessonIds = (linkRes.data ?? []).map((r: any) => r.lesson_id);

  const [attendanceRes, pastLessonsRes, upcomingRes, hwRes] = await Promise.all([
    service
      .from("lesson_attendance")
      .select("attendance_status, lesson_id, created_at, lessons(title, subject, start_time)")
      .eq("student_id", student.id)
      .gte("created_at", iso(ago90)),
    Promise.resolve({ data: null } as any),
    lessonIds.length
      ? service
          .from("lessons")
          .select("id, title, subject, start_time, status, tutors(first_name, last_name)")
          .in("id", lessonIds.slice(0, 400))
          .gte("start_time", iso(now))
          .lte("start_time", iso(in14))
          .order("start_time", { ascending: true })
      : Promise.resolve({ data: [] } as any),
    lessonIds.length
      ? service
          .from("homework")
          .select("id, title, due_date, created_at")
          .in("lesson_id", lessonIds.slice(0, 400))
          .gte("created_at", iso(ago56))
      : Promise.resolve({ data: [] } as any),
  ]);
  void pastLessonsRes;

  // ---- attendance -------------------------------------------------
  const attendance = (attendanceRes.data ?? []).map((a: any) => ({
    status: a.attendance_status,
    lesson: a.lessons?.title ?? null,
    subject: a.lessons?.subject ?? null,
    when: a.lessons?.start_time ? londonParts(a.lessons.start_time).label : null,
  }));
  const attended = attendance.filter((a) => /present|attended|late/i.test(String(a.status))).length;
  const missed = attendance.filter((a) => /absent|missed|no.?show/i.test(String(a.status)));

  // ---- lesson summaries & weakness themes -------------------------
  const summaries = (summariesRes.data ?? []).map((s: any) => {
    const absent = /absent|missed|no.?show/i.test(String(s.attendance_status ?? ""));
    return {
      lesson: s.lessons?.title ?? null,
      subject: s.lessons?.subject ?? null,
      when: s.lessons?.start_time ? londonParts(s.lessons.start_time).label : null,
      attendance_status: s.attendance_status,
      attended: !absent,
      topics: s.topics_covered ?? [],
      what_went_well: absent ? null : s.what_went_well,
      areas_for_improvement: absent ? null : s.areas_for_improvement,
      engagement_level: absent ? null : s.engagement_level,
      engagement_score: absent ? null : s.engagement_score,
      confidence_score: absent ? null : s.confidence_score,
      homework_brief: s.homework_brief ?? null,
      note: absent ? "Student missed this lesson — engagement/confidence not meaningful." : undefined,
    };
  });

  const themeCounts = new Map<string, number>();
  for (const s of summaries) {
    const text = String(s.areas_for_improvement ?? "").toLowerCase();
    for (const word of text.split(/[^a-z]+/)) {
      if (word.length < 5) continue;
      themeCounts.set(word, (themeCounts.get(word) ?? 0) + 1);
    }
  }
  const recurring_weakness_themes = Array.from(themeCounts.entries())
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([term, count]) => ({ term, mentions: count }));

  // ---- assessments ------------------------------------------------
  const sessions = sessionsRes.data ?? [];
  const sessionIds = sessions.map((s: any) => s.id);

  let responsesBySession = new Map<string, any[]>();
  if (sessionIds.length) {
    const { data: responses } = await service
      .from("student_responses")
      .select(
        "session_id, student_answer, marks_awarded, ai_feedback, assessment_questions(question_number, question_text, marks_available)",
      )
      .in("session_id", sessionIds);
    for (const r of responses ?? []) {
      const list = responsesBySession.get(r.session_id) ?? [];
      list.push(r);
      responsesBySession.set(r.session_id, list);
    }
  }

  const { data: improvements } = sessionIds.length
    ? await service
        .from("assessment_improvements")
        .select("session_id, weak_topics, improvement_summary")
        .in("session_id", sessionIds)
    : ({ data: [] } as any);

  const assignments = assignmentsRes.data ?? [];
  const assessments = sessions.map((sess: any) => {
    const rows = responsesBySession.get(sess.id) ?? [];
    const attempted = rows.filter((r: any) => !blank(r.student_answer));
    const skipped = rows.length - attempted.length;
    const achieved = attempted.reduce((n: number, r: any) => n + (r.marks_awarded ?? 0), 0);
    const available = attempted.reduce(
      (n: number, r: any) => n + (r.assessment_questions?.marks_available ?? 0),
      0,
    );
    const assignment = assignments.find((a: any) => a.assessment_id === sess.assessment_id);
    const improvement = (improvements ?? []).find((i: any) => i.session_id === sess.id);

    const weakest = attempted
      .filter((r: any) => (r.marks_awarded ?? 0) < (r.assessment_questions?.marks_available ?? 0))
      .sort(
        (a: any, b: any) =>
          (a.marks_awarded ?? 0) / Math.max(1, a.assessment_questions?.marks_available ?? 1) -
          (b.marks_awarded ?? 0) / Math.max(1, b.assessment_questions?.marks_available ?? 1),
      )
      .slice(0, 5)
      .map((r: any) => ({
        question_number: r.assessment_questions?.question_number ?? null,
        question: String(r.assessment_questions?.question_text ?? "").slice(0, 300),
        marks: `${r.marks_awarded ?? 0}/${r.assessment_questions?.marks_available ?? 0}`,
        student_answer: String(r.student_answer ?? "").slice(0, 300),
        ai_feedback: r.ai_feedback ?? null,
      }));

    return {
      session_id: sess.id,
      title: assignment?.ai_assessments?.title ?? null,
      subject: assignment?.ai_assessments?.subject ?? null,
      exam_board: assignment?.ai_assessments?.exam_board ?? null,
      assignment_status: assignment?.status ?? null,
      assigned_to_account: assignment?.assigned_to_account ?? "student",
      session_status: sess.status,
      attempt_number: sess.attempt_number,
      submitted_at: assignment?.submitted_at ?? sess.completed_at ?? null,
      reviewed_at: assignment?.reviewed_at ?? null,
      time_taken_minutes: sess.time_taken_minutes,
      questions_total: rows.length,
      questions_attempted: attempted.length,
      questions_skipped: skipped,
      marks_achieved: achieved,
      marks_available_attempted: available,
      percentage_attempted_only: available > 0 ? Math.round((achieved / available) * 100) : null,
      weak_topics: improvement?.weak_topics ?? null,
      improvement_summary: improvement?.improvement_summary ?? null,
      weakest_questions: weakest,
    };
  });

  const outstanding = assignments
    .filter((a: any) => a.status !== "reviewed" && !a.submitted_at)
    .map((a: any) => ({
      title: a.ai_assessments?.title ?? null,
      subject: a.ai_assessments?.subject ?? null,
      status: a.status,
      due_date: a.due_date,
    }));

  // ---- homework ---------------------------------------------------
  const hwAssigned = (hwRes.data ?? []).length;
  const hwStatuses = hwStatusRes.data ?? [];
  const hwCompleted = hwStatuses.filter((h: any) => /complete|done|yes/i.test(String(h.status))).length;

  // ---- high-impact moments from lesson transcripts -----------------
  const { data: momentsData } = await supabase
    .from("student_impact_moments")
    .select(
      "category, subject, event_type, timeframe, event_date, grade_or_target, student_reaction, urgency, recommended_action, evidence, status, lesson_date, tutor_name",
    )
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const impact_moments = (momentsData ?? []).map((m: any) => ({
    category: m.category,
    subject: m.subject,
    event_type: m.event_type,
    when_mentioned: m.timeframe,
    event_date: m.event_date,
    grade_or_target: m.grade_or_target,
    student_reaction: m.student_reaction,
    urgency: m.urgency,
    recommended_action: m.recommended_action,
    evidence_quotes: Array.isArray(m.evidence) ? m.evidence : [],
    status: m.status,
    lesson_date: m.lesson_date,
    tutor: m.tutor_name,
  }));

  return {
    ok: true,
    student: {
      id: student.id,
      user_id: student.user_id,
      name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
      email: student.email,
      phone: student.phone,
      grade: student.grade,
      subjects: student.subjects,
      status: student.status,
      account_type: student.account_type,
      trial_status: student.trial_status,
    },
    parent: parentRes.data
      ? {
          name: `${parentRes.data.first_name ?? ""} ${parentRes.data.last_name ?? ""}`.trim(),
          email: parentRes.data.email,
          phone: parentRes.data.phone ?? parentRes.data.whatsapp_number,
          account_type: parentRes.data.account_type,
        }
      : null,
    attendance_last_90_days: {
      records: attendance.length,
      attended,
      missed: missed.length,
      missed_lessons: missed.slice(0, 10),
    },
    recent_lesson_summaries: summaries,
    recurring_weakness_themes,
    assessments,
    outstanding_assessments: outstanding,
    impact_moments,
    homework_last_8_weeks: {
      assigned: hwAssigned,
      marked_complete: hwCompleted,
      completion_rate_percent: hwAssigned > 0 ? Math.round((hwCompleted / hwAssigned) * 100) : null,
    },
    upcoming_lessons_next_14_days: (upcomingRes.data ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      subject: l.subject,
      status: l.status,
      tutor: l.tutors ? `${l.tutors.first_name ?? ""} ${l.tutors.last_name ?? ""}`.trim() : null,
      london: londonParts(l.start_time).label,
      start_time_utc: l.start_time,
    })),
    notes: [
      "Assessment percentages count ATTEMPTED questions only — blank answers are reported as skipped.",
      "Lessons the student missed have engagement/confidence suppressed; report them as missed.",
      "impact_moments come from the daily transcript scan; every one carries verbatim quotes — cite them.",
    ],
  };
}
