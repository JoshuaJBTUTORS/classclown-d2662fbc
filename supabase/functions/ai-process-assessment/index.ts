
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
    console.log('Processing assessment:', assessmentId);

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

    console.log('Found assessment:', assessment.title);

    // Download and process PDFs
    const questionsContent = await downloadAndExtractPDF(supabase, assessment.questions_pdf_url);
    const answersContent = await downloadAndExtractPDF(supabase, assessment.answers_pdf_url);

    console.log('Extracted PDF content lengths:', {
      questions: questionsContent.length,
      answers: answersContent.length
    });

    // Process with AI (OpenAI)
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const aiResponse = await processWithAI(questionsContent, answersContent, openaiKey);
    console.log('AI processing completed with confidence:', aiResponse.confidence_score);

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
      console.log('Creating', aiResponse.questions.length, 'questions');
      
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
      } else {
        console.log('Successfully created', questionsToInsert.length, 'questions');
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
    
    try {
      const { assessmentId } = await req.json();
      if (assessmentId) {
        await supabase
          .from('ai_assessments')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message 
          })
          .eq('id', assessmentId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function downloadAndExtractPDF(supabase: any, filePath: string): Promise<string> {
  try {
    console.log('Downloading file:', filePath);
    
    const { data, error } = await supabase.storage
      .from('assessment-files')
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      throw error;
    }

    // For now, we'll create mock content based on the filename to demonstrate the flow
    // In a production environment, you'd use a PDF parsing library like pdf-parse
    const fileName = filePath.split('/').pop() || 'unknown';
    
    if (fileName.toLowerCase().includes('question')) {
      return generateMockQuestionContent();
    } else {
      return generateMockAnswerContent();
    }
  } catch (error) {
    console.error('Error downloading/extracting PDF:', error);
    throw error;
  }
}

function generateMockQuestionContent(): string {
  return `
MATHEMATICS EXAM PAPER
Paper 1 - Calculator Allowed
Time: 90 minutes
Total Marks: 100

Question 1 (5 marks)
Solve for x: 2x + 7 = 19

Question 2 (8 marks)
A triangle has sides of length 5cm, 12cm and 13cm.
a) Show that this is a right-angled triangle. (3 marks)
b) Calculate the area of the triangle. (5 marks)

Question 3 (12 marks)
The equation of a line is y = 2x + 3
a) What is the gradient of this line? (2 marks)
b) What is the y-intercept? (2 marks)
c) Sketch the line on the coordinate grid provided. (4 marks)
d) Find the equation of a line parallel to this line that passes through point (0, -1). (4 marks)

Question 4 (15 marks)
A box contains 8 red balls and 12 blue balls.
a) What is the probability of selecting a red ball? (3 marks)
b) Two balls are selected without replacement. Calculate the probability that both balls are blue. (6 marks)
c) If balls are replaced after each selection, what is the probability of selecting 2 red balls in 3 attempts? (6 marks)
  `;
}

function generateMockAnswerContent(): string {
  return `
MATHEMATICS EXAM PAPER - MARKING SCHEME
Paper 1 - Calculator Allowed

Question 1 (5 marks)
Solve for x: 2x + 7 = 19
Answer: x = 6
Method:
2x + 7 = 19
2x = 19 - 7 = 12
x = 12/2 = 6
Marks: 1 mark for rearranging, 1 mark for subtracting 7, 2 marks for dividing by 2, 1 mark for correct answer

Question 2 (8 marks)
a) Using Pythagoras: 5² + 12² = 25 + 144 = 169 = 13² ✓ (3 marks)
b) Area = ½ × base × height = ½ × 5 × 12 = 30 cm² (5 marks)

Question 3 (12 marks)
a) Gradient = 2 (2 marks)
b) y-intercept = 3 (2 marks)
c) Sketch showing correct line through (0,3) with gradient 2 (4 marks)
d) Parallel line: y = 2x - 1 (4 marks)

Question 4 (15 marks)
a) P(red) = 8/20 = 2/5 = 0.4 (3 marks)
b) P(both blue) = (12/20) × (11/19) = 132/380 = 33/95 (6 marks)
c) P(2 red in 3) = C(3,2) × (2/5)² × (3/5)¹ = 3 × 4/25 × 3/5 = 36/125 (6 marks)
  `;
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
    "time_limit_minutes": 90,
    "description": "Brief description of the assessment"
  },
  "questions": [
    {
      "question_number": 1,
      "question_text": "The actual question text",
      "question_type": "calculation",
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

  console.log('Sending request to OpenAI...');

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
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    const parsedContent = JSON.parse(content);
    console.log('Successfully parsed AI response');
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Invalid JSON response from AI');
  }
}
