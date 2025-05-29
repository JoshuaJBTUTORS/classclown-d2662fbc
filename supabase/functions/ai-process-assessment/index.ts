
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessAssessmentRequest {
  assessmentId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { assessmentId }: ProcessAssessmentRequest = await req.json();

    // Update status to processing
    await supabase
      .from('ai_assessments')
      .update({ processing_status: 'processing' })
      .eq('id', assessmentId);

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error('Assessment not found');
    }

    // Download and process PDFs
    const questionsContent = await downloadAndExtractPDF(supabase, assessment.questions_pdf_url);
    const answersContent = await downloadAndExtractPDF(supabase, assessment.answers_pdf_url);

    // Process with AI (OpenAI)
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const aiResponse = await processWithAI(questionsContent, answersContent, openaiKey);

    // Update assessment with AI-generated data
    const { error: updateError } = await supabase
      .from('ai_assessments')
      .update({
        processing_status: 'completed',
        ai_extraction_data: aiResponse,
        ai_confidence_score: aiResponse.confidence_score,
        subject: aiResponse.metadata.subject,
        exam_board: aiResponse.metadata.exam_board,
        year: aiResponse.metadata.year,
        total_marks: aiResponse.metadata.total_marks,
        time_limit_minutes: aiResponse.metadata.time_limit_minutes,
        description: aiResponse.metadata.description,
      })
      .eq('id', assessmentId);

    if (updateError) throw updateError;

    // Create questions
    if (aiResponse.questions && aiResponse.questions.length > 0) {
      const questionsToInsert = aiResponse.questions.map((q: any, index: number) => ({
        assessment_id: assessmentId,
        question_number: q.question_number || index + 1,
        question_text: q.question_text,
        question_type: q.question_type,
        marks_available: q.marks_available,
        correct_answer: q.correct_answer,
        marking_scheme: q.marking_scheme || {},
        keywords: q.keywords || [],
        position: index,
      }));

      const { error: questionsError } = await supabase
        .from('assessment_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing assessment:", error);
    
    // Update status to failed
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { assessmentId } = await req.json().catch(() => ({}));
    if (assessmentId) {
      await supabase
        .from('ai_assessments')
        .update({ 
          processing_status: 'failed',
          processing_error: error.message 
        })
        .eq('id', assessmentId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function downloadAndExtractPDF(supabase: any, filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('assessment-files')
    .download(filePath);

  if (error) throw error;

  // For now, return a placeholder. In a real implementation, you'd use a PDF parsing library
  // like pdf-parse or similar to extract text content from the PDF
  return `[PDF Content from ${filePath}] - This would contain the actual extracted text from the PDF file.`;
}

async function processWithAI(questionsContent: string, answersContent: string, openaiKey: string) {
  const prompt = `
You are an expert assessment processor. I will provide you with the content extracted from two PDF files:
1. Questions PDF: Contains the exam questions
2. Answers PDF: Contains the marking scheme/correct answers

Your task is to analyze these and return a structured JSON response with the following format:

{
  "confidence_score": 0.95,
  "metadata": {
    "subject": "Mathematics",
    "exam_board": "AQA",
    "year": 2023,
    "total_marks": 100,
    "time_limit_minutes": 120,
    "description": "Brief description of the assessment"
  },
  "questions": [
    {
      "question_number": 1,
      "question_text": "The actual question text",
      "question_type": "multiple_choice|short_answer|extended_writing|calculation",
      "marks_available": 5,
      "correct_answer": "The correct answer",
      "marking_scheme": {
        "criteria": "How to mark this question",
        "mark_allocation": "Breakdown of marks"
      },
      "keywords": ["key", "terms", "for", "marking"]
    }
  ]
}

Questions PDF Content:
${questionsContent}

Answers PDF Content:
${answersContent}

Analyze the content and extract all questions, determine their types, and map them to the correct answers. Return only valid JSON.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid JSON response from AI');
  }
}
