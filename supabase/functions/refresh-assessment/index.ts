import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BATCH_SIZE = 5;
const MODEL = "gpt-4o";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const SEASONS = ["winter", "autumn", "spring", "fall"];

interface Question {
  id: string;
  question_number: number | null;
  question_text: string;
  question_type: string;
  marks_available: number | null;
  correct_answer: string | null;
  marking_scheme: unknown;
  keywords: unknown;
  position: number | null;
  image_url: string | null;
}

/** London month name so a refresh on the last day of a month names the right month. */
function currentMonthName(): string {
  const name = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "Europe/London",
  }).format(new Date());
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Names the paper after the current month, e.g.
 *   "GCSE Chemistry Paper 1 - Winter Term Exam" -> "... - October Exam"
 *   "GCSE Chemistry Paper 1 (September)"        -> "... (October)"
 *   "GCSE Chemistry Paper 1"                    -> "... (October)"
 */
function applyMonthToTitle(title: string, month: string): string {
  let t = (title ?? "").trim();
  // "Winter Term" / "Spring term" -> the month
  t = t.replace(new RegExp(`\\b(${SEASONS.join("|")})\\s+term\\b`, "gi"), month);
  t = t.replace(new RegExp(`\\b(${SEASONS.join("|")})\\b`, "gi"), month);
  // A month word left by a previous refresh -> this month. Only capitalised
  // month words are touched so ordinary words like "may" or "march" stay put.
  t = t.replace(new RegExp(`\\b(${MONTHS.join("|")})\\b`, "g"), (m) =>
    m[0] === m[0].toUpperCase() ? month : m,
  );
  if (!new RegExp(`\\b${month}\\b`, "i").test(t)) {
    t = t ? `${t} (${month})` : `${month} Assessment`;
  }
  return t.replace(/\s+/g, " ").trim();
}

async function rewriteBatch(batch: Question[]): Promise<Array<{ id: string; question_text: string; correct_answer: string; marking_scheme: unknown }>> {
  const system = `You rewrite exam questions as equivalent variants. Rules:
- Keep question_type, marks_available, difficulty, topic, and structural style identical to the original.
- Change ONLY surface details: names, numeric values, dates, minor wording.
- Recompute the correct_answer and marking_scheme so they are fully consistent with the new values.
- For multiple choice, keep the same number of options; update options and correct option inside marking_scheme accordingly.
- Preserve any HTML/LaTeX formatting patterns from the original question_text.
- Return one variant per input question, matching by id.`;

  const user = `Rewrite these questions as variants and return strict JSON:\n${JSON.stringify(batch, null, 2)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "question_variants",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    question_text: { type: "string" },
                    correct_answer: { type: "string" },
                    marking_scheme_json: {
                      type: "string",
                      description: "JSON-encoded string of the marking scheme (object/array/string). Use \"null\" if none.",
                    },
                  },
                  required: ["id", "question_text", "correct_answer", "marking_scheme_json"],
                },
              },
            },
            required: ["questions"],
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  const parsed = JSON.parse(content);
  return (parsed.questions ?? []).map((q: any) => {
    let ms: unknown = null;
    try {
      ms = q.marking_scheme_json ? JSON.parse(q.marking_scheme_json) : null;
    } catch {
      ms = q.marking_scheme_json ?? null;
    }
    return {
      id: q.id,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      marking_scheme: ms,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { assessment_id } = await req.json();
    if (!assessment_id) {
      return new Response(JSON.stringify({ error: "assessment_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Permission check
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const { data: assessment, error: aErr } = await admin
      .from("ai_assessments")
      .select("*")
      .eq("id", assessment_id)
      .maybeSingle();
    if (aErr || !assessment) {
      return new Response(JSON.stringify({ error: "Assessment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const canEdit = roleSet.has("owner") || roleSet.has("admin") || roleSet.has("tutor") || assessment.created_by === userId;
    if (!canEdit) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load questions
    const { data: questions, error: qErr } = await admin
      .from("assessment_questions")
      .select("id, question_number, question_text, question_type, marks_available, correct_answer, marking_scheme, keywords, position, image_url")
      .eq("assessment_id", assessment_id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions to refresh" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Batch rewrite into variants
    const updates: Array<{ id: string; question_text: string; correct_answer: string; marking_scheme: unknown }> = [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE) as Question[];
      const variants = await rewriteBatch(batch);
      updates.push(...variants);
    }
    const variantById = new Map(updates.map((u) => [u.id, u]));

    const now = new Date().toISOString();
    const month = currentMonthName();
    const newTitle = applyMonthToTitle(assessment.title, month);

    // 1. Create the new version of the paper (new ids, so old answers stay on the old paper)
    const { data: newAssessment, error: createErr } = await admin
      .from("ai_assessments")
      .insert({
        title: newTitle,
        description: assessment.description,
        subject: assessment.subject,
        exam_board: assessment.exam_board,
        year: assessment.year,
        paper_type: assessment.paper_type,
        total_marks: assessment.total_marks,
        time_limit_minutes: assessment.time_limit_minutes,
        created_by: assessment.created_by,
        status: assessment.status,
        questions_pdf_url: assessment.questions_pdf_url,
        answers_pdf_url: assessment.answers_pdf_url,
        processing_status: "completed",
        is_ai_generated: assessment.is_ai_generated,
        questions_text: assessment.questions_text,
        answers_text: assessment.answers_text,
        extract_text: assessment.extract_text,
        extract_source: assessment.extract_source,
        extract_type: assessment.extract_type,
      })
      .select("id, title")
      .single();
    if (createErr) throw createErr;
    const newId = newAssessment.id;

    // 2. Insert the refreshed questions under the new paper
    const questionRows = (questions as Question[]).map((q) => {
      const v = variantById.get(q.id);
      const originalScheme = (q.marking_scheme as unknown) ?? {};
      return {
        assessment_id: newId,
        question_number: q.question_number,
        question_text: v?.question_text ?? q.question_text,
        question_type: q.question_type,
        marks_available: q.marks_available ?? 1,
        correct_answer: v?.correct_answer ?? q.correct_answer ?? "",
        marking_scheme: v?.marking_scheme ?? originalScheme,
        keywords: (q.keywords as unknown) ?? [],
        position: q.position ?? q.question_number ?? 1,
        image_url: q.image_url,
      };
    });
    const { error: qInsErr } = await admin.from("assessment_questions").insert(questionRows);
    if (qInsErr) {
      // Don't leave an empty paper behind
      await admin.from("ai_assessments").delete().eq("id", newId);
      throw qInsErr;
    }

    // 3. Archive the old paper: still holds every answer, mark and submission
    const { error: archiveErr } = await admin
      .from("ai_assessments")
      .update({ status: "archived", updated_at: now })
      .eq("id", assessment_id);
    if (archiveErr) throw archiveErr;

    // 4. Re-assign the same students on the new paper
    const { data: oldAssignments, error: aSelectErr } = await admin
      .from("assessment_assignments")
      .select("id, assigned_to, assigned_by, due_date, notes, status")
      .eq("assessment_id", assessment_id);
    if (aSelectErr) throw aSelectErr;

    const { data: existingNew } = await admin
      .from("assessment_assignments")
      .select("assigned_to")
      .eq("assessment_id", newId);
    const alreadyAssigned = new Set((existingNew ?? []).map((a: any) => a.assigned_to));

    const toCreate: Array<Record<string, unknown>> = [];
    const toDelete: string[] = [];
    for (const a of oldAssignments ?? []) {
      const hasWork = a.status === "submitted" || a.status === "reviewed";
      // A paper nobody started yet has no work behind it, so drop the dead row
      // that would otherwise point at the archived version.
      if (!hasWork) toDelete.push(a.id);
      if (!alreadyAssigned.has(a.assigned_to)) {
        toCreate.push({
          assessment_id: newId,
          assigned_to: a.assigned_to,
          assigned_by: a.assigned_by,
          due_date: a.due_date,
          notes: a.notes,
          status: "assigned",
        });
        alreadyAssigned.add(a.assigned_to);
      }
    }

    if (toCreate.length) {
      const { error: assignErr } = await admin.from("assessment_assignments").insert(toCreate);
      if (assignErr) throw assignErr;
    }
    if (toDelete.length) {
      const { error: delErr } = await admin
        .from("assessment_assignments")
        .delete()
        .in("id", toDelete);
      if (delErr) throw delErr;
    }

    return new Response(JSON.stringify({
      success: true,
      updated: updates.length,
      new_assessment_id: newId,
      new_title: newAssessment.title,
      archived_assessment_id: assessment_id,
      assigned: toCreate.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refresh-assessment error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
