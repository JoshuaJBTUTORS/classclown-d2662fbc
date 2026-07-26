import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BATCH_SIZE = 5;
const MODEL = "gpt-4o";

interface Question {
  id: string;
  question_number: number | null;
  question_text: string;
  question_type: string;
  marks_available: number | null;
  correct_answer: string | null;
  marking_scheme: unknown;
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
                    marking_scheme: {
                      type: ["object", "array", "string", "null"],
                    },
                  },
                  required: ["id", "question_text", "correct_answer", "marking_scheme"],
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
  return parsed.questions;
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
      .select("id, created_by, title")
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
      .select("id, question_number, question_text, question_type, marks_available, correct_answer, marking_scheme")
      .eq("assessment_id", assessment_id)
      .order("question_number", { ascending: true });
    if (qErr) throw qErr;
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions to refresh" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Batch rewrite
    const updates: Array<{ id: string; question_text: string; correct_answer: string; marking_scheme: unknown }> = [];
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE) as Question[];
      const variants = await rewriteBatch(batch);
      updates.push(...variants);
    }

    // Apply updates
    for (const u of updates) {
      const { error: uErr } = await admin
        .from("assessment_questions")
        .update({
          question_text: u.question_text,
          correct_answer: u.correct_answer,
          marking_scheme: u.marking_scheme,
          updated_at: new Date().toISOString(),
        })
        .eq("id", u.id)
        .eq("assessment_id", assessment_id);
      if (uErr) throw uErr;
    }

    // Cleanup student data
    const { data: sessions } = await admin
      .from("assessment_sessions")
      .select("id")
      .eq("assessment_id", assessment_id);
    const sessionIds = (sessions ?? []).map((s) => s.id);
    if (sessionIds.length > 0) {
      await admin.from("student_responses").delete().in("session_id", sessionIds);
    }
    await admin.from("assessment_sessions").delete().eq("assessment_id", assessment_id);
    await admin.from("marking_jobs").delete().eq("assessment_id", assessment_id);
    await admin
      .from("assessment_assignments")
      .update({ status: "assigned", submitted_at: null, reviewed_at: null, reviewed_by: null })
      .eq("assessment_id", assessment_id);

    return new Response(JSON.stringify({ success: true, updated: updates.length }), {
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
