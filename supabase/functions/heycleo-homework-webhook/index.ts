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
 *   
 *   // Primary lookup (optional - use if available)
 *   homework_id?: string;        // UUID of homework in Class Beyond
 *   
 *   // Alternative lookup fields (used when homework_id not available)
 *   homework_title?: string;     // Title of the homework assignment
 *   due_date?: string;           // Due date for disambiguation
 *   subject?: string;            // Subject for disambiguation
 *   
 *   // Required fields
 *   student_email: string;       // Student's email to match
 *   completed_at: string;        // ISO timestamp
 *   
 *   // Optional fields
 *   user_id?: string;            // HeyCleo user UUID
 *   conversation_id?: string;    // HeyCleo conversation UUID
 *   time_spent_seconds?: number; // Total time spent
 *   total_questions: number;
 *   correct_answers: number;
 *   incorrect_answers: number;
 *   accuracy_percentage: number;
 *   questions?: Array<{          // Detailed question breakdown
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
  // Primary lookup
  homework_id?: string;
  // Alternative lookup fields
  homework_title?: string;
  due_date?: string;
  subject?: string;
  // Required fields
  student_email: string;
  completed_at: string;
  // Optional fields
  user_id?: string;
  conversation_id?: string;
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
      // Primary lookup - now optional
      homework_id:
        asNonEmptyString(rawPayload.homework_id) ||
        asNonEmptyString(rawPayload.homeworkId),
      // Alternative lookup fields
      homework_title:
        asNonEmptyString(rawPayload.homework_title) ||
        asNonEmptyString(rawPayload.homeworkTitle) ||
        asNonEmptyString(rawPayload.title),
      due_date:
        asNonEmptyString(rawPayload.due_date) ||
        asNonEmptyString(rawPayload.dueDate),
      subject:
        asNonEmptyString(rawPayload.subject),
      // Required fields
      student_email:
        asNonEmptyString(rawPayload.student_email) ||
        asNonEmptyString(rawPayload.studentEmail) ||
        "",
      completed_at:
        asNonEmptyString(rawPayload.completed_at) ||
        asNonEmptyString(rawPayload.completedAt) ||
        "",
      // Optional fields
      user_id:
        asNonEmptyString(rawPayload.user_id) ||
        asNonEmptyString(rawPayload.userId),
      conversation_id:
        asNonEmptyString(rawPayload.conversation_id) ||
        asNonEmptyString(rawPayload.conversationId) ||
        asNonEmptyString(rawPayload.conversationID),
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
      homework_id: payload.homework_id || "(not provided)",
      homework_title: payload.homework_title || "(not provided)",
      due_date: payload.due_date || "(not provided)",
      subject: payload.subject || "(not provided)",
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

    // Validate required fields
    // homework_id is now optional - we can match by title instead
    const missing: string[] = [];
    if (!payload.student_email) missing.push("student_email");
    if (!payload.completed_at) missing.push("completed_at");
    
    // Need either homework_id OR homework_title for matching
    if (!payload.homework_id && !payload.homework_title) {
      missing.push("homework_id or homework_title");
    }

    if (missing.length) {
      console.error("Missing required fields:", {
        missing,
        payloadKeys,
        hasHomeworkId: !!payload.homework_id,
        hasHomeworkTitle: !!payload.homework_title,
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

    // Find the homework - try by ID first, then fall back to title matching
    let homework: { id: string; title: string; lesson_id: string } | null = null;
    let matchMethod = "";

    // Method 1: Direct ID lookup (preferred)
    if (payload.homework_id) {
      console.log("Attempting homework lookup by ID:", payload.homework_id);
      const { data: homeworkById, error: homeworkError } = await supabase
        .from("homework")
        .select("id, title, lesson_id")
        .eq("id", payload.homework_id)
        .single();

      if (!homeworkError && homeworkById) {
        homework = homeworkById;
        matchMethod = "id";
        console.log("Found homework by ID:", homework.id, homework.title);
      } else {
        console.warn("Homework not found by ID, will try title matching:", payload.homework_id, homeworkError?.message);
      }
    }

    // Method 2: Title + Student matching (fallback)
    // Try with ALL students matching this email (handles duplicates)
    if (!homework && payload.homework_title) {
      console.log("Attempting homework lookup by title:", payload.homework_title);
      
      // Get all student IDs for this email to handle duplicates
      const allStudentIds = students.map(s => s.id);
      console.log("Searching for homework assigned to any of student IDs:", allStudentIds);
      
      // Use wildcard matching to handle trailing/leading whitespace in DB
      const titlePattern = `%${payload.homework_title.trim()}%`;
      
      // Find homework assigned to ANY of these students via lesson_students
      // Join: homework -> lessons -> lesson_students -> students
      const { data: matchedHomework, error: matchError } = await supabase
        .from("homework")
        .select(`
          id,
          title,
          lesson_id,
          due_date,
          lessons!inner (
            id,
            lesson_students!inner (
              student_id
            )
          )
        `)
        .ilike("title", titlePattern)
        .in("lessons.lesson_students.student_id", allStudentIds)
        .order("created_at", { ascending: false })
        .limit(10);

      if (matchError) {
        console.error("Homework title search error:", matchError);
      } else if (matchedHomework && matchedHomework.length > 0) {
        // If we have due_date, try to find exact match first
        if (payload.due_date) {
          const payloadDueDate = new Date(payload.due_date).toISOString().split("T")[0];
          const exactMatch = matchedHomework.find(h => {
            if (!h.due_date) return false;
            const homeworkDueDate = new Date(h.due_date).toISOString().split("T")[0];
            return homeworkDueDate === payloadDueDate;
          });
          if (exactMatch) {
            homework = { id: exactMatch.id, title: exactMatch.title, lesson_id: exactMatch.lesson_id };
            matchMethod = "title+due_date";
            console.log("Found homework by title + due date:", homework.id, homework.title);
          }
        }
        
        // Otherwise take the most recent match
        if (!homework) {
          const firstMatch = matchedHomework[0];
          homework = { id: firstMatch.id, title: firstMatch.title, lesson_id: firstMatch.lesson_id };
          matchMethod = "title";
          if (matchedHomework.length > 1) {
            console.warn("Multiple homework matches found by title, using most recent:", {
              title: payload.homework_title,
              matchCount: matchedHomework.length,
              selectedId: homework.id,
              allIds: matchedHomework.map(h => h.id),
            });
          } else {
            console.log("Found homework by title:", homework.id, homework.title);
          }
        }
      } else {
        console.warn("No homework found by title for this student:", payload.homework_title);
      }
    }

    // If still no homework found, return error
    if (!homework) {
      const errorDetails = payload.homework_id
        ? `No homework with ID: ${payload.homework_id}`
        : `No homework with title "${payload.homework_title}" assigned to student ${studentEmail}`;
      
      console.error("Homework not found:", {
        homework_id: payload.homework_id,
        homework_title: payload.homework_title,
        student_id: student.id,
        student_email: studentEmail,
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Homework not found",
          details: errorDetails,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Homework matched successfully:", {
      id: homework.id,
      title: homework.title,
      matchMethod,
    });

    // Insert or update the completion record
    const completionData = {
      homework_id: homework.id,
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

    // Build detailed feedback for tutors
    const grade = getGradeFromPercentage(payload.accuracy_percentage);
    const timeSpentMinutes = payload.time_spent_seconds 
      ? Math.round(payload.time_spent_seconds / 60) 
      : null;
    
    let feedback = `## HeyCleo AI Tutor Results\n\n`;
    feedback += `**Score:** ${payload.correct_answers}/${payload.total_questions} (${payload.accuracy_percentage}%)\n`;
    feedback += `**Grade:** ${grade}\n`;
    if (timeSpentMinutes !== null) {
      feedback += `**Time Spent:** ${timeSpentMinutes} minute${timeSpentMinutes !== 1 ? 's' : ''}\n`;
    }
    feedback += `**Completed:** ${new Date(payload.completed_at).toLocaleString('en-GB')}\n`;
    
    // Add question breakdown if available
    if (payload.questions && payload.questions.length > 0) {
      feedback += `\n### Question Breakdown\n\n`;
      payload.questions.forEach((q, index) => {
        const status = q.is_correct ? '✓' : '✗';
        feedback += `${index + 1}. ${status} ${q.question_text}\n`;
        feedback += `   Answer: ${q.answer_text}\n`;
        if (q.time_taken_seconds) {
          feedback += `   Time: ${q.time_taken_seconds}s\n`;
        }
        feedback += `\n`;
      });
    }
    
    if (payload.conversation_id) {
      feedback += `\n---\n*Session ID: ${payload.conversation_id}*`;
    }

    // Create or update homework_submissions table for analytics tracking
    const { data: existingSubmission } = await supabase
      .from("homework_submissions")
      .select("id")
      .eq("homework_id", homework.id)
      .eq("student_id", student.id)
      .maybeSingle();

    const submissionData = {
      status: "graded",
      percentage_score: payload.accuracy_percentage,
      grade: grade,
      submitted_at: payload.completed_at,
      feedback: feedback,
      submission_text: payload.conversation_id
        ? `Completed via HeyCleo AI Tutor (Session: ${payload.conversation_id})`
        : "Completed via HeyCleo AI Tutor",
    };

    if (existingSubmission) {
      const { error: updateError } = await supabase
        .from("homework_submissions")
        .update(submissionData)
        .eq("id", existingSubmission.id);

      if (updateError) {
        console.error("Failed to update homework submission:", updateError);
      } else {
        console.log("Updated homework submission:", existingSubmission.id);
      }
    } else {
      const { data: newSubmission, error: insertError } = await supabase
        .from("homework_submissions")
        .insert({
          homework_id: homework.id,
          student_id: student.id,
          ...submissionData,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to create homework submission:", insertError);
      } else {
        console.log("Created new homework submission for student:", student.id);
      }
    }

    // Return success response with matched homework_id (so HeyCleo can cache it)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Homework completion recorded successfully",
        data: {
          completion_id: completion.id,
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          homework_id: homework.id,
          homework_title: homework.title,
          match_method: matchMethod,
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
