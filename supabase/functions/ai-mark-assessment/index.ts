import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log('🚀 AI Mark Assessment function called - DEPLOYED VERSION');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  try {
    // Check if OpenAI API key is configured
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('🔑 OpenAI API key configured:', !!openAIApiKey);
    
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestBody = await req.json();
    console.log('📝 Request body:', requestBody);
    
    const { sessionId, questionId, studentAnswer } = requestBody;
    
    if (!sessionId) {
      console.error('❌ Session ID missing');
      return new Response(
        JSON.stringify({ success: false, error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔗 Supabase client created successfully');

    // If questionId is provided, mark a single question
    if (questionId && studentAnswer !== undefined) {
      console.log('📋 Marking single question');
      const result = await markSingleQuestion(supabase, sessionId, questionId, studentAnswer, openAIApiKey);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Otherwise, mark all questions in the session
    console.log('📋 Marking all questions in session');
    const result = await markAllQuestions(supabase, sessionId, openAIApiKey);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("💥 Error in ai-mark-assessment function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unexpected error occurred while marking the assessment",
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function markSingleQuestion(supabase: any, sessionId: string, questionId: string, studentAnswer: string, openAIApiKey: string) {
  console.log("🔍 Marking single question:", questionId);
  console.log("📝 Student answer length:", studentAnswer.length);

  try {
    // Get the question details
    console.log("🔍 Fetching question details...");
    const { data: question, error: questionError } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.error('❌ Failed to fetch question:', questionError);
      throw new Error(`Failed to fetch question: ${questionError?.message || 'Question not found'}`);
    }

    console.log('📄 Question details:', {
      id: question.id,
      type: question.question_type,
      marks: question.marks_available,
      hasCorrectAnswer: !!question.correct_answer
    });

    // Get or create student response
    console.log("🔍 Checking for existing response...");
    const { data: existingResponse } = await supabase
      .from('student_responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .maybeSingle();

    console.log('📝 Existing response:', existingResponse ? 'Found' : 'Not found');

    const markingResult = await evaluateAnswer(question, studentAnswer, openAIApiKey);
    console.log('🎯 Marking result:', markingResult);

    const responseData = {
      session_id: sessionId,
      question_id: questionId,
      student_answer: studentAnswer,
      marks_awarded: markingResult.marks,
      ai_feedback: markingResult.feedback,
      confidence_score: markingResult.confidence,
      marking_breakdown: markingResult.breakdown,
      marked_at: new Date().toISOString(),
    };

    if (existingResponse) {
      console.log("🔄 Updating existing response...");
      const { error: updateError } = await supabase
        .from('student_responses')
        .update(responseData)
        .eq('id', existingResponse.id);

      if (updateError) {
        console.error('❌ Failed to update response:', updateError);
        throw new Error(`Failed to update response: ${updateError.message}`);
      }
    } else {
      console.log("➕ Creating new response...");
      const { error: insertError } = await supabase
        .from('student_responses')
        .insert(responseData);

      if (insertError) {
        console.error('❌ Failed to insert response:', insertError);
        throw new Error(`Failed to insert response: ${insertError.message}`);
      }
    }

    console.log("✅ Response saved successfully");

    return {
      success: true,
      marks: markingResult.marks,
      maxMarks: question.marks_available,
      feedback: markingResult.feedback,
      confidence: markingResult.confidence,
    };

  } catch (error) {
    console.error("💥 Error in markSingleQuestion:", error);
    throw error;
  }
}

async function markAllQuestions(supabase: any, sessionId: string, openAIApiKey: string) {
  console.log("Marking all questions for session:", sessionId);

  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from('assessment_sessions')
    .select('*, assessment_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(`Failed to fetch session: ${sessionError?.message}`);
  }

  // Get all questions for the assessment
  const { data: questions, error: questionsError } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', session.assessment_id)
    .order('position');

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  // Get all student responses for this session
  const { data: responses, error: responsesError } = await supabase
    .from('student_responses')
    .select('*')
    .eq('session_id', sessionId);

  if (responsesError) {
    throw new Error(`Failed to fetch responses: ${responsesError.message}`);
  }

  let totalMarks = 0;
  let totalMaxMarks = 0;
  const markingResults = [];

  for (const question of questions) {
    const response = responses.find(r => r.question_id === question.id);
    const studentAnswer = response?.student_answer || '';

    const markingResult = await evaluateAnswer(question, studentAnswer, openAIApiKey);
    totalMarks += markingResult.marks;
    totalMaxMarks += question.marks_available;

    // Update or insert the response with marking
    const responseData = {
      session_id: sessionId,
      question_id: question.id,
      student_answer: studentAnswer,
      marks_awarded: markingResult.marks,
      ai_feedback: markingResult.feedback,
      confidence_score: markingResult.confidence,
      marking_breakdown: markingResult.breakdown,
      marked_at: new Date().toISOString(),
    };

    if (response) {
      await supabase
        .from('student_responses')
        .update(responseData)
        .eq('id', response.id);
    } else {
      await supabase
        .from('student_responses')
        .insert(responseData);
    }

    markingResults.push({
      questionId: question.id,
      marks: markingResult.marks,
      maxMarks: question.marks_available,
      feedback: markingResult.feedback,
    });
  }

  // Update session with total marks
  await supabase
    .from('assessment_sessions')
    .update({
      total_marks_achieved: totalMarks,
      total_marks_available: totalMaxMarks,
    })
    .eq('id', sessionId);

  return {
    success: true,
    totalMarks,
    totalMaxMarks,
    percentage: Math.round((totalMarks / totalMaxMarks) * 100),
    results: markingResults,
  };
}

async function evaluateAnswer(question: any, studentAnswer: string, openAIApiKey: string) {
  console.log("🔍 Evaluating answer for question type:", question.question_type);
  
  if (!openAIApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // Handle different question types
  if (question.question_type === 'multiple_choice') {
    console.log("📝 Evaluating multiple choice question");
    return evaluateMultipleChoice(question, studentAnswer);
  } else {
    console.log("📝 Evaluating worded answer using AI");
    return await evaluateWordedAnswer(question, studentAnswer, openAIApiKey);
  }
}

function evaluateMultipleChoice(question: any, studentAnswer: string) {
  const isCorrect = studentAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
  
  return {
    marks: isCorrect ? question.marks_available : 0,
    feedback: isCorrect 
      ? "Correct answer!" 
      : `Incorrect. The correct answer is: ${question.correct_answer}`,
    confidence: 1.0,
    breakdown: {
      type: 'multiple_choice',
      correct: isCorrect,
      expected: question.correct_answer,
      given: studentAnswer,
    }
  };
}

async function evaluateWordedAnswer(question: any, studentAnswer: string, openAIApiKey: string) {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      marks: 0,
      feedback: "No answer provided.",
      confidence: 1.0,
      breakdown: {
        type: 'worded',
        reason: 'no_answer',
      }
    };
  }

  const prompt = `
You are an expert examiner marking a student's answer. Please evaluate the student's response against the correct answer.

Question: ${question.question_text}
Marks Available: ${question.marks_available}
Correct Answer: ${question.correct_answer}
Student Answer: ${studentAnswer}
Keywords to look for: ${question.keywords ? question.keywords.join(', ') : 'None specified'}

Please provide:
1. A mark out of ${question.marks_available} (as an integer)
2. Constructive feedback explaining what was correct/incorrect
3. A confidence score between 0 and 1 for your marking

Respond in JSON format:
{
  "marks": <integer between 0 and ${question.marks_available}>,
  "feedback": "<detailed feedback string>",
  "confidence": <decimal between 0 and 1>,
  "key_points_found": ["<list of key points the student got right>"],
  "key_points_missing": ["<list of key points the student missed>"]
}
`;

  try {
    console.log("🤖 Calling OpenAI API...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert examiner. Always respond with valid JSON and be fair but thorough in your marking.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("❌ OpenAI API error:", response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ OpenAI response received");
    
    const aiContent = data.choices[0].message.content;
    
    // Clean and parse the JSON response
    const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleanedContent);

    return {
      marks: Math.max(0, Math.min(result.marks, question.marks_available)),
      feedback: result.feedback,
      confidence: result.confidence || 0.8,
      breakdown: {
        type: 'worded',
        key_points_found: result.key_points_found || [],
        key_points_missing: result.key_points_missing || [],
        ai_evaluation: result,
      }
    };

  } catch (error) {
    console.error("💥 Error in AI evaluation:", error);
    
    // Fallback: Simple keyword matching
    const keywords = question.keywords || [];
    const answerLower = studentAnswer.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    );
    
    const keywordScore = keywords.length > 0 
      ? (matchedKeywords.length / keywords.length) 
      : 0.5; // Default score if no keywords
    
    const estimatedMarks = Math.round(keywordScore * question.marks_available);
    
    return {
      marks: estimatedMarks,
      feedback: `AI marking temporarily unavailable. Estimated score based on keyword matching: ${matchedKeywords.length}/${keywords.length} key terms found.`,
      confidence: 0.5,
      breakdown: {
        type: 'worded_fallback',
        matched_keywords: matchedKeywords,
        total_keywords: keywords.length,
        error: error.message,
      }
    };
  }
}
