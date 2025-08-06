
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

    // Get question details with assessment context
    const { data: question, error: questionError } = await supabase
      .from('assessment_questions')
      .select(`
        *,
        ai_assessments!inner(
          subject,
          year,
          exam_board,
          title
        )
      `)
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

    // Get age-appropriate feedback guidelines
    const assessment = question.ai_assessments;
    const getAgeAppropriateGuidelines = (year, subject) => {
      const yearNum = parseInt(year) || 7;
      
      if (yearNum <= 6) {
        // Primary/KS2 (Years 3-6)
        return {
          tone: "encouraging and supportive",
          language: "simple, clear language that a child can understand",
          structure: "Start with praise, explain gently what needs work, end with encouragement",
          examples: "Use everyday examples and analogies that young children relate to"
        };
      } else if (yearNum <= 9) {
        // Secondary/KS3 (Years 7-9)  
        return {
          tone: "supportive but more detailed",
          language: "introduce subject terminology gradually with explanations",
          structure: "Balance praise with constructive guidance, explain reasoning",
          examples: "Use relatable examples while building academic vocabulary"
        };
      } else if (yearNum <= 11) {
        // GCSE/KS4 (Years 10-11)
        return {
          tone: "exam-focused but encouraging",
          language: "use proper subject terminology with clear explanations",
          structure: "Focus on exam technique, mark schemes, and improvement strategies",
          examples: "Reference exam criteria and provide specific next steps"
        };
      } else {
        // A-Level/KS5 (Years 12-13)
        return {
          tone: "analytical and university-preparation focused",
          language: "sophisticated subject terminology with detailed analysis",
          structure: "Encourage critical thinking, evaluation, and independent analysis",
          examples: "Connect to broader concepts and encourage deeper exploration"
        };
      }
    };

    const subjectGuidelines = (subject) => {
      const subjectLower = subject?.toLowerCase() || '';
      if (subjectLower.includes('math') || subjectLower.includes('maths')) {
        return "Focus on mathematical reasoning, method, and accuracy. Praise correct methods even if final answer is wrong.";
      } else if (subjectLower.includes('english')) {
        return "Emphasize creativity, expression, and communication. Encourage personal voice while noting technical improvements.";
      } else if (subjectLower.includes('science') || subjectLower.includes('biology') || subjectLower.includes('chemistry') || subjectLower.includes('physics')) {
        return "Balance conceptual understanding with practical application. Encourage scientific thinking and observation.";
      } else {
        return "Focus on understanding, analysis, and clear communication of ideas.";
      }
    };

    const guidelines = getAgeAppropriateGuidelines(assessment?.year, assessment?.subject);
    const subjectFocus = subjectGuidelines(assessment?.subject);

    // Prepare the age-appropriate marking prompt
    const markingPrompt = `
You are an expert teacher marking a student's answer. Please analyze the following with AGE-APPROPRIATE feedback:

ASSESSMENT CONTEXT:
- Subject: ${assessment?.subject || 'General'}
- Year Group: ${assessment?.year || 'Not specified'}
- Exam Board: ${assessment?.exam_board || 'Not specified'}

QUESTION DETAILS:
- Question: ${question.question_text}
- Question Type: ${question.question_type}
- Marks Available: ${question.marks_available}
- Correct Answer: ${question.correct_answer}
- Marking Scheme: ${JSON.stringify(question.marking_scheme)}
- Keywords: ${JSON.stringify(question.keywords)}

STUDENT ANSWER: ${studentAnswer}

FEEDBACK GUIDELINES FOR THIS AGE GROUP:
- Tone: ${guidelines.tone}
- Language Level: ${guidelines.language}
- Structure: ${guidelines.structure}
- Examples: ${guidelines.examples}
- Subject Focus: ${subjectFocus}

Please provide your assessment in the following JSON format:
{
  "marks": [number between 0 and ${question.marks_available}],
  "maxMarks": ${question.marks_available},
  "feedback": "[Age-appropriate feedback following the guidelines above]",
  "confidence": [number between 0 and 1],
  "topicAnalysis": {
    "topics": ["topic1", "topic2", ...],
    "knowledgeGaps": ["gap1", "gap2", ...],
    "strengths": ["strength1", "strength2", ...],
    "conceptsToReview": ["concept1", "concept2", ...]
  }
}

IMPORTANT FEEDBACK REQUIREMENTS:
1. ALWAYS start with something positive the student did well
2. Use age-appropriate language and tone as specified above
3. Explain corrections in a way suitable for the year group
4. Provide encouraging, actionable next steps
5. For younger students: be very encouraging and use simple explanations
6. For older students: be more analytical and detailed
7. Match the subject-specific focus guidelines
8. End feedback on an encouraging note that motivates further learning

Focus on understanding, effort, and providing constructive guidance that builds confidence.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
      }, {
        onConflict: 'session_id,question_id'
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
