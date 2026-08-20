import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Keep each invocation comfortably inside the edge runtime wall clock.
const TIME_BUDGET_MS = 40_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ageGuidelines(year: unknown) {
  const yearNum = parseInt(String(year ?? "")) || 7;
  if (yearNum <= 6) {
    return {
      tone: "encouraging and supportive",
      language: "simple, clear language that a child can understand",
      structure: "Start with praise, explain gently what needs work, end with encouragement",
      examples: "Use everyday examples and analogies that young children relate to",
    };
  }
  if (yearNum <= 9) {
    return {
      tone: "supportive but more detailed",
      language: "introduce subject terminology gradually with explanations",
      structure: "Balance praise with constructive guidance, explain reasoning",
      examples: "Use relatable examples while building academic vocabulary",
    };
  }
  if (yearNum <= 11) {
    return {
      tone: "exam-focused but encouraging",
      language: "use proper subject terminology with clear explanations",
      structure: "Focus on exam technique, mark schemes, and improvement strategies",
      examples: "Reference exam criteria and provide specific next steps",
    };
  }
  return {
    tone: "analytical and university-preparation focused",
    language: "sophisticated subject terminology with detailed analysis",
    structure: "Encourage critical thinking, evaluation, and independent analysis",
    examples: "Connect to broader concepts and encourage deeper exploration",
  };
}

function subjectFocus(subject: unknown) {
  const s = String(subject ?? "").toLowerCase();
  if (s.includes("math")) {
    return "Focus on mathematical reasoning, method, and accuracy. Award method marks even if the final answer is wrong.";
  }
  if (s.includes("english")) {
    return "Emphasize creativity, expression, and communication. Encourage personal voice while noting technical improvements.";
  }
  if (s.includes("science") || s.includes("biology") || s.includes("chemistry") || s.includes("physics")) {
    return "Balance conceptual understanding with practical application. Encourage scientific thinking and observation.";
  }
  return "Focus on understanding, analysis, and clear communication of ideas.";
}

function buildPrompt(assessment: any, question: any, studentAnswer: string) {
  const g = ageGuidelines(assessment?.year);
  return `
You are an expert teacher marking a student's answer. Provide AGE-APPROPRIATE feedback.

ASSESSMENT CONTEXT:
- Subject: ${assessment?.subject || "General"}
- Year Group: ${assessment?.year ?? "Not specified"}
- Exam Board: ${assessment?.exam_board || "Not specified"}

QUESTION DETAILS:
- Question: ${question.question_text}
- Question Type: ${question.question_type}
- Marks Available: ${question.marks_available}
- Correct Answer: ${question.correct_answer}
- Marking Scheme: ${JSON.stringify(question.marking_scheme)}
- Keywords: ${JSON.stringify(question.keywords)}

STUDENT ANSWER: ${studentAnswer}

FEEDBACK GUIDELINES FOR THIS AGE GROUP:
- Tone: ${g.tone}
- Language Level: ${g.language}
- Structure: ${g.structure}
- Examples: ${g.examples}
- Subject Focus: ${subjectFocus(assessment?.subject)}

Respond with JSON only, in exactly this shape:
{
  "marks": [number between 0 and ${question.marks_available}],
  "maxMarks": ${question.marks_available},
  "feedback": "[age-appropriate feedback]",
  "confidence": [number between 0 and 1],
  "topicAnalysis": {
    "topics": [],
    "knowledgeGaps": [],
    "strengths": [],
    "conceptsToReview": []
  }
}

FEEDBACK REQUIREMENTS:
1. Always start with something the student did well.
2. Use age-appropriate language and tone.
3. Explain corrections suitably for the year group.
4. Give encouraging, actionable next steps.
5. End on an encouraging note.`;
}

async function markOne(
  openAiKey: string,
  assessment: any,
  question: any,
  studentAnswer: string,
): Promise<{ marks: number; feedback: string; confidence: number; topicAnalysis: any }> {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * Math.pow(3, attempt)); // 1.5s, 4.5s back-off

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert teacher who marks student answers strictly against the mark scheme and gives constructive feedback. Always respond with valid JSON in the exact format requested.",
          },
          { role: "user", content: buildPrompt(assessment, question, studentAnswer) },
        ],
      }),
    });

    if (!res.ok) {
      lastError = `OpenAI ${res.status}: ${await res.text()}`;
      // 4xx other than rate limiting will not succeed on retry
      if (res.status !== 429 && res.status < 500) break;
      continue;
    }

    const payload = await res.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      lastError = "Empty AI response";
      continue;
    }

    try {
      const parsed = JSON.parse(content);
      const max = Number(question.marks_available) || 0;
      const marks = Math.max(0, Math.min(max, Number(parsed.marks) || 0));
      return {
        marks,
        feedback: String(parsed.feedback || ""),
        confidence: Number(parsed.confidence) || 0,
        topicAnalysis: parsed.topicAnalysis || {},
      };
    } catch (_e) {
      lastError = "Failed to parse AI JSON";
    }
  }
  throw new Error(lastError || "Marking failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) return json({ success: false, error: "OPENAI_API_KEY is not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Missing authorization header" }, 401);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return json({ success: false, error: "Unauthorized" }, 401);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "owner");
    if (!isAdmin) return json({ success: false, error: "Admin or owner role required" }, 403);

    const { sessionId, remark = false } = await req.json();
    if (!sessionId) return json({ success: false, error: "sessionId is required" }, 400);

    const { data: session, error: sessionError } = await supabase
      .from("assessment_sessions")
      .select("id, assessment_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) return json({ success: false, error: "Session not found" }, 404);

    const { data: assessment } = await supabase
      .from("ai_assessments")
      .select("id, title, subject, year, exam_board")
      .eq("id", session.assessment_id)
      .single();

    const { data: questions } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", session.assessment_id);

    const questionMap = new Map((questions ?? []).map((q: any) => [q.id, q]));

    const { data: responses, error: responsesError } = await supabase
      .from("student_responses")
      .select("id, question_id, student_answer, marked_at")
      .eq("session_id", sessionId);

    if (responsesError) throw responsesError;

    const pending = (responses ?? []).filter((r: any) => remark || !r.marked_at);

    const started = Date.now();
    let marked = 0;
    let skipped = 0;
    const failures: Array<{ responseId: string; error: string }> = [];

    for (const response of pending) {
      if (Date.now() - started > TIME_BUDGET_MS) break;

      const question = questionMap.get(response.question_id);
      if (!question) {
        skipped++;
        continue;
      }

      const answer = String(response.student_answer ?? "").trim();
      const now = new Date().toISOString();

      // Blank answers cost nothing to mark — record a zero and move on.
      if (!answer) {
        await supabase
          .from("student_responses")
          .update({
            marks_awarded: 0,
            ai_feedback: "No answer given, so no marks could be awarded for this question.",
            confidence_score: 1,
            marking_breakdown: { blank: true, max_marks: question.marks_available, marked_at: now },
            marked_at: now,
            marked_by: user.id,
          })
          .eq("id", response.id);
        marked++;
        continue;
      }

      try {
        const result = await markOne(openAiKey, assessment, question, answer);
        await supabase
          .from("student_responses")
          .update({
            marks_awarded: result.marks,
            ai_feedback: result.feedback,
            confidence_score: result.confidence,
            marking_breakdown: {
              ai_marks: result.marks,
              max_marks: question.marks_available,
              feedback: result.feedback,
              confidence: result.confidence,
              topics: result.topicAnalysis?.topics ?? [],
              knowledge_gaps: result.topicAnalysis?.knowledgeGaps ?? [],
              strengths: result.topicAnalysis?.strengths ?? [],
              concepts_to_review: result.topicAnalysis?.conceptsToReview ?? [],
              marked_at: now,
            },
            marked_at: now,
            marked_by: user.id,
          })
          .eq("id", response.id);
        marked++;
      } catch (error: any) {
        // One bad question must not stop the run.
        console.error("Failed to mark response", response.id, error?.message);
        failures.push({ responseId: response.id, error: error?.message ?? "Unknown error" });
      }
    }

    // Recompute the session total from everything marked so far.
    const { data: allResponses } = await supabase
      .from("student_responses")
      .select("marks_awarded, marked_at, question_id")
      .eq("session_id", sessionId);

    const totalAchieved = (allResponses ?? []).reduce(
      (sum: number, r: any) => sum + (Number(r.marks_awarded) || 0),
      0,
    );
    const totalAvailable = (questions ?? []).reduce(
      (sum: number, q: any) => sum + (Number(q.marks_available) || 0),
      0,
    );

    await supabase
      .from("assessment_sessions")
      .update({ total_marks_achieved: totalAchieved, total_marks_available: totalAvailable })
      .eq("id", sessionId);

    const remaining = (allResponses ?? []).filter((r: any) => !r.marked_at).length;
    // Stop the client loop when nothing is left, or when this pass made no progress.
    const done = remaining === 0 || marked === 0;

    return json({
      success: true,
      done,
      marked,
      skipped,
      remaining,
      failed: failures.length,
      failures,
      totalAchieved,
      totalAvailable,
    });
  } catch (error: any) {
    console.error("mark-assessment-session error:", error);
    return json({ success: false, error: error?.message ?? "Internal server error" }, 500);
  }
});
