
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
    const { assessmentId } = await req.json();
    
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
    console.log("Questions text length:", assessment.questions_text?.length || 0);
    console.log("Answers text length:", assessment.answers_text?.length || 0);

    // Check if we have actual content to process
    if (!assessment.questions_text || assessment.questions_text.trim().length === 0) {
      throw new Error("No questions text provided for AI processing");
    }

    // Use OpenAI to extract questions from the provided text
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const extractionPrompt = `
    You are an assessment extraction AI. Extract structured questions from the following text content.
    
    Questions Text:
    ${assessment.questions_text}
    
    ${assessment.answers_text ? `Answers Text:\n${assessment.answers_text}` : ''}
    
    Please extract and format as JSON with this structure:
    {
      "questions": [
        {
          "question_number": 1,
          "question_text": "The actual question text",
          "question_type": "multiple_choice|short_answer|extended_writing|calculation",
          "marks_available": 5,
          "correct_answer": "The correct answer or marking scheme",
          "keywords": ["keyword1", "keyword2"]
        }
      ],
      "total_marks": 25,
      "confidence_score": 0.95
    }
    
    Ensure:
    - Question types are one of: multiple_choice, short_answer, extended_writing, calculation
    - Marks are realistic integers
    - Extract actual questions, don't create sample content
    - Include keywords that would help in marking
    `;

    console.log("Sending request to OpenAI...");

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert at extracting structured questions from assessment text. Always return valid JSON.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
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

    console.log(`Extracted ${extractedData.questions.length} questions`);

    // Store the questions in the database
    for (let i = 0; i < extractedData.questions.length; i++) {
      const question = extractedData.questions[i];
      
      const { error: questionError } = await supabase
        .from('assessment_questions')
        .insert({
          assessment_id: assessmentId,
          question_number: question.question_number || (i + 1),
          question_text: question.question_text,
          question_type: question.question_type || 'short_answer',
          marks_available: question.marks_available || 1,
          correct_answer: question.correct_answer || '',
          marking_scheme: {},
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
        message: "Assessment processed successfully",
        questionsExtracted: extractedData.questions.length,
        totalMarks: extractedData.total_marks
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ai-process-assessment function:", error);
    
    // Update the assessment status to failed
    if (req.method === "POST") {
      try {
        const { assessmentId } = await req.json();
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
