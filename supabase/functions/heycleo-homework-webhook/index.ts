import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * HeyCleo Homework Webhook Receiver
 * 
 * Expected Payload from HeyCleo:
 * {
 *   secret: string;              // Must match HEYCLEO_CROSS_PLATFORM_SECRET
 *   homework_id: string;         // UUID of homework in Class Beyond
 *   student_email: string;       // Student's email to match
 *   user_id?: string;            // HeyCleo user UUID (optional)
 *   conversation_id: string;     // HeyCleo conversation UUID
 *   completed_at: string;        // ISO timestamp
 *   time_spent_seconds?: number; // Total time spent (optional)
 *   total_questions: number;
 *   correct_answers: number;
 *   incorrect_answers: number;
 *   accuracy_percentage: number;
 *   questions?: Array<{          // Detailed question breakdown (optional)
 *     question_id: string;
 *     question_text: string;
 *     answer_text: string;
 *     is_correct: boolean;
 *     time_taken_seconds?: number;
 *     step_id?: string;
 *   }>;
 * }
 */

interface HomeworkCompletionPayload {
  secret: string;
  homework_id: string;
  student_email: string;
  user_id?: string;
  conversation_id?: string;
  completed_at: string;
  time_spent_seconds?: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  questions?: Array<{
    question_id: string;
    question_text: string;
    answer_text: string;
    is_correct: boolean;
    time_taken_seconds?: number;
    step_id?: string;
  }>;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length ? s : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      console.error("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse + normalize the request body (support snake_case and camelCase keys)
    const raw = await req.json();
    const rawPayload = (raw && typeof raw === "object")
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

    const incomingSecret =
      asNonEmptyString(rawPayload.secret) ||
      asNonEmptyString(req.headers.get("x-heycleo-secret")) ||
      asNonEmptyString(req.headers.get("x-webhook-secret")) ||
      "";

    const payload: HomeworkCompletionPayload = {
      secret: incomingSecret,
      homework_id:
        asNonEmptyString(rawPayload.homework_id) ||
        asNonEmptyString(rawPayload.homeworkId) ||
        "",
      student_email:
        asNonEmptyString(rawPayload.student_email) ||
        asNonEmptyString(rawPayload.studentEmail) ||
        "",
      user_id:
        asNonEmptyString(rawPayload.user_id) ||
        asNonEmptyString(rawPayload.userId),
      conversation_id:
        asNonEmptyString(rawPayload.conversation_id) ||
        asNonEmptyString(rawPayload.conversationId) ||
        asNonEmptyString(rawPayload.conversationID),
      completed_at:
        asNonEmptyString(rawPayload.completed_at) ||
        asNonEmptyString(rawPayload.completedAt) ||
        "",
      time_spent_seconds:
        asNumber(rawPayload.time_spent_seconds) ??
        asNumber(rawPayload.timeSpentSeconds),
      total_questions:
        asNumber(rawPayload.total_questions) ??
        asNumber(rawPayload.totalQuestions) ??
        0,
      correct_answers:
        asNumber(rawPayload.correct_answers) ??
        asNumber(rawPayload.correctAnswers) ??
        0,
      incorrect_answers:
        asNumber(rawPayload.incorrect_answers) ??
        asNumber(rawPayload.incorrectAnswers) ??
        0,
      accuracy_percentage:
        asNumber(rawPayload.accuracy_percentage) ??
        asNumber(rawPayload.accuracyPercentage) ??
        0,
      questions: Array.isArray(rawPayload.questions)
        ? (rawPayload.questions as HomeworkCompletionPayload["questions"])
        : undefined,
    };

    const payloadKeys = Object.keys(rawPayload);
    console.log("Received homework completion webhook:", {
      payload_keys: payloadKeys,
      homework_id: payload.homework_id,
      student_email: payload.student_email,
      conversation_id: payload.conversation_id,
      completed_at: payload.completed_at,
      total_questions: payload.total_questions,
      accuracy_percentage: payload.accuracy_percentage,
    });

    // Validate the shared secret
    const sharedSecret = Deno.env.get("HEYCLEO_CROSS_PLATFORM_SECRET");
    if (!sharedSecret) {
      console.error("HEYCLEO_CROSS_PLATFORM_SECRET not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.secret !== sharedSecret) {
      console.error("Invalid secret provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields (conversation_id is optional)
    const missing: string[] = [];
    if (!payload.homework_id) missing.push("homework_id");
    if (!payload.student_email) missing.push("student_email");
    if (!payload.completed_at) missing.push("completed_at");

    if (missing.length) {
      console.error("Missing required fields:", {
        missing,
        payloadKeys,
        hasHomeworkId: !!payload.homework_id,
        hasStudentEmail: !!payload.student_email,
        hasConversationId: !!payload.conversation_id,
        hasCompletedAt: !!payload.completed_at,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
          missing,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const studentEmail = payload.student_email.trim().toLowerCase();

    // Look up the student by email - handle duplicates gracefully by taking most recent
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, email, created_at")
      .eq("email", studentEmail)
      .order("created_at", { ascending: false })
      .limit(10);

    if (studentError) {
      console.error("Student lookup error:", studentEmail, studentError);
      return new Response(
        JSON.stringify({ success: false, error: "Student lookup failed", details: studentError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!students || students.length === 0) {
      console.error("Student not found:", studentEmail);
      return new Response(
        JSON.stringify({ success: false, error: "Student not found", details: `No student with email: ${studentEmail}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Warn if there are duplicate students with same email
    if (students.length > 1) {
      console.warn("Multiple students found with same email - using most recent:", {
        email: studentEmail,
        count: students.length,
        studentIds: students.map(s => s.id),
      });
    }

    const student = students[0];

    console.log("Found student:", student.id, student.first_name, student.last_name);

    // Validate the homework exists
    const { data: homework, error: homeworkError } = await supabase
      .from("homework")
      .select("id, title, lesson_id")
      .eq("id", payload.homework_id)
      .single();

    if (homeworkError || !homework) {
      console.error("Homework not found:", payload.homework_id, homeworkError);
      return new Response(
        JSON.stringify({ success: false, error: "Homework not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found homework:", homework.id, homework.title);

    // Insert or update the completion record
    const completionData = {
      homework_id: payload.homework_id,
      student_id: student.id,
      heycleo_user_id: payload.user_id || null,
      conversation_id: payload.conversation_id || null,
      completed_at: payload.completed_at,
      time_spent_seconds: payload.time_spent_seconds || null,
      total_questions: payload.total_questions || 0,
      correct_answers: payload.correct_answers || 0,
      incorrect_answers: payload.incorrect_answers || 0,
      accuracy_percentage: payload.accuracy_percentage || 0,
      question_details: payload.questions || null,
      raw_payload: rawPayload,
      received_at: new Date().toISOString(),
    };

    const { data: completion, error: completionError } = await supabase
      .from("heycleo_homework_completions")
      .upsert(completionData, {
        onConflict: "homework_id,student_id,conversation_id",
      })
      .select()
      .single();

    if (completionError) {
      console.error("Failed to save completion:", completionError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save completion record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Saved completion record:", completion.id);

    // Also update the homework_submissions table if a submission exists
    const { data: existingSubmission } = await supabase
      .from("homework_submissions")
      .select("id")
      .eq("homework_id", payload.homework_id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingSubmission) {
      // Update existing submission with score
      const grade = getGradeFromPercentage(payload.accuracy_percentage);
      const { error: updateError } = await supabase
        .from("homework_submissions")
        .update({
          status: "graded",
          percentage_score: payload.accuracy_percentage,
          grade: grade,
          submitted_at: payload.completed_at,
          feedback: `Completed via HeyCleo. Score: ${payload.correct_answers}/${payload.total_questions} (${payload.accuracy_percentage}%)`,
        })
        .eq("id", existingSubmission.id);

      if (updateError) {
        console.error("Failed to update homework submission:", updateError);
      } else {
        console.log("Updated homework submission:", existingSubmission.id);
      }
    } else {
      // Create new submission
      const grade = getGradeFromPercentage(payload.accuracy_percentage);
      const { error: insertError } = await supabase
        .from("homework_submissions")
        .insert({
          homework_id: payload.homework_id,
          student_id: student.id,
          status: "graded",
          percentage_score: payload.accuracy_percentage,
          grade: grade,
          submitted_at: payload.completed_at,
          submission_text: payload.conversation_id
            ? `Completed via HeyCleo conversation: ${payload.conversation_id}`
            : "Completed via HeyCleo (conversation_id not provided)",
          feedback: `Completed via HeyCleo. Score: ${payload.correct_answers}/${payload.total_questions} (${payload.accuracy_percentage}%)`,
        });

      if (insertError) {
        console.error("Failed to create homework submission:", insertError);
      } else {
        console.log("Created new homework submission for student:", student.id);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Homework completion recorded successfully",
        data: {
          completion_id: completion.id,
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          homework_id: payload.homework_id,
          homework_title: homework.title,
          accuracy_percentage: payload.accuracy_percentage,
          recorded_at: completion.received_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to convert percentage to grade
function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return "A*";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}
