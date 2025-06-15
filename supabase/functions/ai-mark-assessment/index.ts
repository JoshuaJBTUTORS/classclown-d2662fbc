
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sessionId, questionId, studentAnswer } = await req.json();

    if (!sessionId || !questionId || !studentAnswer) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required parameters: sessionId, questionId, or studentAnswer" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.error('Question fetch error:', questionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Question not found" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Prepare the marking prompt with topic analysis
    const markingPrompt = `
You are an expert teacher marking a student's answer. Please analyze the following:

QUESTION: ${question.question_text}
QUESTION TYPE: ${question.question_type}
MARKS AVAILABLE: ${question.marks_available}
CORRECT ANSWER: ${question.correct_answer}
MARKING SCHEME: ${JSON.stringify(question.marking_scheme)}
KEYWORDS: ${JSON.stringify(question.keywords)}

STUDENT ANSWER: ${studentAnswer}

Please provide your assessment in the following JSON format:
{
  "marks": [number between 0 and ${question.marks_available}],
  "maxMarks": ${question.marks_available},
  "feedback": "[detailed feedback explaining the marking]",
  "confidence": [number between 0 and 1],
  "topicAnalysis": {
    "topics": ["topic1", "topic2", ...],
    "knowledgeGaps": ["gap1", "gap2", ...],
    "strengths": ["strength1", "strength2", ...],
    "conceptsToReview": ["concept1", "concept2", ...]
  }
}

Focus on:
1. Accuracy of the answer
2. Understanding of key concepts
3. Application of methods/formulas
4. Clarity of explanation
5. Identifying specific topics the student struggles with
6. Recommending which concepts need review

Be fair but constructive in your feedback.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert teacher who provides detailed, constructive feedback on student answers. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: markingPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to get AI response" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const aiResult = await openAIResponse.json();
    
    if (!aiResult.choices || !aiResult.choices[0] || !aiResult.choices[0].message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid AI response format" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let markingResult;
    try {
      markingResult = JSON.parse(aiResult.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to parse AI marking result" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Enhanced marking breakdown with topic analysis
    const markingBreakdown = {
      ai_marks: markingResult.marks,
      max_marks: markingResult.maxMarks,
      feedback: markingResult.feedback,
      confidence: markingResult.confidence,
      topics: markingResult.topicAnalysis?.topics || [],
      knowledge_gaps: markingResult.topicAnalysis?.knowledgeGaps || [],
      strengths: markingResult.topicAnalysis?.strengths || [],
      concepts_to_review: markingResult.topicAnalysis?.conceptsToReview || [],
      marked_at: new Date().toISOString()
    };

    // Store the response with enhanced marking data
    const { error: insertError } = await supabase
      .from('student_responses')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        student_answer: studentAnswer,
        marks_awarded: markingResult.marks,
        ai_feedback: markingResult.feedback,
        marking_breakdown: markingBreakdown,
        confidence_score: markingResult.confidence,
        marked_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to save marking result" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log('Successfully marked question:', {
      questionId,
      marks: markingResult.marks,
      maxMarks: markingResult.maxMarks,
      confidence: markingResult.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        marks: markingResult.marks,
        maxMarks: markingResult.maxMarks,
        feedback: markingResult.feedback,
        confidence: markingResult.confidence,
        topicAnalysis: markingResult.topicAnalysis
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error in ai-mark-assessment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
