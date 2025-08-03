
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

  try {
    const { assessmentId, numberOfQuestions, topic, prompt } = await req.json();
    
    if (!assessmentId) {
      throw new Error("Assessment ID is required");
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

    // Get the assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message}`);
    }

    // Update status to processing
    await supabase
      .from('ai_assessments')
      .update({ 
        processing_status: 'processing',
        processing_error: null 
      })
      .eq('id', assessmentId);

    console.log("Processing assessment:", assessment.title);
    console.log("Topic:", topic);
    console.log("Number of questions:", numberOfQuestions);
    console.log("Prompt:", prompt);

    // Check if we have the required AI generation parameters
    if (!topic || !prompt || !numberOfQuestions) {
      throw new Error("Missing required parameters: topic, prompt, or numberOfQuestions");
    }

    // Use OpenAI to extract questions from the provided text
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const generationPrompt = `
    You are an expert assessment creator. Generate ${numberOfQuestions} exam questions for the topic: "${topic}".
    
    Assessment Details:
    - Subject: ${assessment.subject || 'Not specified'}
    - Exam Board: ${assessment.exam_board || 'Not specified'}
    - Year: ${assessment.year || 'Not specified'}
    - Paper Type: ${assessment.paper_type || 'Not specified'}
    - Time Limit: ${assessment.time_limit_minutes || 'Not specified'} minutes
    
    Generation Instructions:
    ${prompt}
    
    Please generate and format as JSON with this exact structure:
    {
      "questions": [
        {
          "question_number": 1,
          "question_text": "The complete question text with clear instructions",
          "question_type": "multiple_choice|short_answer|extended_writing",
          "marks_available": 5,
          "correct_answer": "The correct answer or detailed marking scheme",
          "keywords": ["keyword1", "keyword2", "keyword3"],
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ],
      "total_marks": 50,
      "confidence_score": 0.95
    }
    
    Requirements:
    - Generate exactly ${numberOfQuestions} unique, high-quality questions
    - Question types must be ONLY one of: multiple_choice, short_answer, extended_writing
    - DO NOT generate calculation, draw, or any other question types - they are not supported
    - Assign realistic mark allocations (1-20 marks per question)
    - Include detailed correct answers or marking schemes
    - Add relevant keywords for each question to aid in marking
    - Ensure questions are appropriate for the specified level and exam board
    - Questions should vary in difficulty and style
    - Total marks should be the sum of all individual question marks
    
    MULTIPLE CHOICE QUESTIONS SPECIFIC REQUIREMENTS:
    - For multiple_choice questions, MUST include "options" array with exactly 4 options
    - Options should be clear, distinct choices labeled as "Option A", "Option B", "Option C", "Option D"
    - The "correct_answer" for multiple choice should be the letter only: "A", "B", "C", or "D"
    - Example multiple choice question:
    {
      "question_number": 1,
      "question_text": "What is the capital of France?",
      "question_type": "multiple_choice",
      "marks_available": 1,
      "correct_answer": "A",
      "keywords": ["geography", "capital", "France"],
      "options": ["Paris", "London", "Berlin", "Madrid"]
    }
    `;

    console.log("Sending request to OpenAI...");

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert assessment creator specializing in generating high-quality exam questions. Always return valid JSON.'
          },
          {
            role: 'user',
            content: generationPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 8000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log("OpenAI response received");

    let extractedData;
    try {
      const aiContent = openAIData.choices[0].message.content;
      console.log("AI response content:", aiContent);
      
      // Clean up the JSON response (remove markdown code blocks if present)
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Validate the extracted data
    if (!extractedData.questions || !Array.isArray(extractedData.questions)) {
      throw new Error("Invalid AI response: missing questions array");
    }

    console.log(`Generated ${extractedData.questions.length} questions`);

    // Store the questions in the database
    for (let i = 0; i < extractedData.questions.length; i++) {
      const question = extractedData.questions[i];
      
      // Validate question type is supported
      const supportedTypes = ['short_answer', 'extended_writing', 'multiple_choice'];
      if (!supportedTypes.includes(question.question_type)) {
        console.warn(`Unsupported question type ${question.question_type}, defaulting to short_answer`);
        question.question_type = 'short_answer';
      }
      
      // Prepare marking scheme based on question type
      let markingScheme = {};
      if (question.question_type === 'multiple_choice' && question.options) {
        markingScheme = {
          options: question.options,
          correct_answer: question.correct_answer
        };
      }
      
      const { error: questionError } = await supabase
        .from('assessment_questions')
        .insert({
          assessment_id: assessmentId,
          question_number: question.question_number || (i + 1),
          question_text: question.question_text,
          question_type: question.question_type,
          marks_available: question.marks_available || 1,
          correct_answer: question.correct_answer || '',
          marking_scheme: markingScheme,
          keywords: question.keywords || [],
          position: i + 1,
        });

      if (questionError) {
        console.error("Error inserting question:", questionError);
        throw new Error(`Failed to insert question ${i + 1}: ${questionError.message}`);
      }
    }

    // Update the assessment with the extracted data
    const { error: updateError } = await supabase
      .from('ai_assessments')
      .update({
        processing_status: 'completed',
        ai_extraction_data: extractedData,
        ai_confidence_score: extractedData.confidence_score || 0.8,
        total_marks: extractedData.total_marks || extractedData.questions.reduce((sum: number, q: any) => sum + (q.marks_available || 1), 0),
        processing_error: null
      })
      .eq('id', assessmentId);

    if (updateError) {
      throw new Error(`Failed to update assessment: ${updateError.message}`);
    }

    console.log("Assessment processing completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Assessment generated successfully",
        questionsGenerated: extractedData.questions.length,
        totalMarks: extractedData.total_marks
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-process-assessment function:", error);
    
    // Update the assessment status to failed
    if (req.method === "POST") {
      try {
        const requestBody = await req.json();
        const assessmentId = requestBody.assessmentId;
        if (assessmentId) {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
          );
          
          await supabase
            .from('ai_assessments')
            .update({ 
              processing_status: 'failed',
              processing_error: error.message
            })
            .eq('id', assessmentId);
        }
      } catch (updateError) {
        console.error("Failed to update assessment status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
