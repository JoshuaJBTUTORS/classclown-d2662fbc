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

  let assessmentId: string | null = null;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestBody: ProcessAssessmentRequest = await req.json();
    assessmentId = requestBody.assessmentId;
    console.log('Processing assessment:', assessmentId);

    // Check if OpenAI API key is available
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      console.error("OpenAI API key not configured");
      if (assessmentId) {
        await supabase
          .from('ai_assessments')
          .update({ 
            processing_status: 'failed',
            processing_error: 'OpenAI API key not configured' 
          })
          .eq('id', assessmentId);
      }
      throw new Error("OpenAI API key not configured");
    }

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

    console.log('Found assessment:', assessment.title, 'Subject:', assessment.subject || 'Unknown');

    // Get content from text fields or fallback to PDFs
    let questionsContent = '';
    let answersContent = '';
    let contentSource = 'text';

    if (assessment.questions_text && assessment.answers_text) {
      // Use text content directly
      questionsContent = assessment.questions_text;
      answersContent = assessment.answers_text;
      console.log('Using provided text content');
    } else if (assessment.questions_pdf_url || assessment.answers_pdf_url) {
      // Fallback to PDF processing for existing assessments
      contentSource = 'pdf';
      console.log('Falling back to PDF processing for legacy assessment');
      
      if (assessment.questions_pdf_url) {
        const result = await downloadAndExtractPDF(supabase, assessment.questions_pdf_url, 'questions');
        questionsContent = result.content;
      }
      
      if (assessment.answers_pdf_url) {
        const result = await downloadAndExtractPDF(supabase, assessment.answers_pdf_url, 'answers');
        answersContent = result.content;
      }
    } else {
      // Generate sample content if no content provided
      console.log('No content provided, generating sample content');
      questionsContent = generateSampleQuestionContent(assessment);
      answersContent = generateSampleAnswerContent(assessment);
      contentSource = 'sample';
    }

    console.log('Content lengths:', {
      questions: questionsContent.length,
      answers: answersContent.length,
      source: contentSource
    });

    // Validate content
    if (questionsContent.length < 50 || answersContent.length < 50) {
      throw new Error('Insufficient content provided. Please ensure both questions and answers have meaningful content.');
    }

    // Process with AI (OpenAI)
    const aiResponse = await processWithAI(questionsContent, answersContent, openaiKey, assessment);
    console.log('AI processing completed with confidence:', aiResponse.confidence_score);

    // Update assessment with AI-generated data
    const { error: updateError } = await supabase
      .from('ai_assessments')
      .update({
        processing_status: 'completed',
        ai_extraction_data: aiResponse,
        ai_confidence_score: aiResponse.confidence_score,
        subject: aiResponse.metadata.subject || assessment.subject,
        exam_board: aiResponse.metadata.exam_board || assessment.exam_board,
        year: aiResponse.metadata.year || assessment.year,
        total_marks: aiResponse.metadata.total_marks || assessment.total_marks,
        time_limit_minutes: aiResponse.metadata.time_limit_minutes || assessment.time_limit_minutes,
        description: aiResponse.metadata.description || assessment.description,
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
        question_type: q.question_type || 'short_answer',
        marks_available: q.marks_available || 1,
        correct_answer: q.correct_answer || '',
        marking_scheme: q.marking_scheme || {},
        keywords: q.keywords || [],
        position: index,
      }));

      const { error: questionsError } = await supabase
        .from('assessment_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
        throw questionsError;
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
    
    // Update status to failed with better error handling
    if (assessmentId) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        await supabase
          .from('ai_assessments')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message 
          })
          .eq('id', assessmentId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function downloadAndExtractPDF(supabase: any, filePath: string, type: 'questions' | 'answers'): Promise<{content: string, success: boolean}> {
  try {
    console.log(`Downloading file: ${filePath} Type: ${type}`);
    
    const { data, error } = await supabase.storage
      .from('assessment-files')
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      return { content: '', success: false };
    }

    if (!data) {
      console.error('No data received from storage');
      return { content: '', success: false };
    }

    // Get file size for logging
    const fileSize = data.size || 0;
    console.log(`Downloaded file size: ${fileSize} bytes`);

    if (fileSize === 0) {
      console.error('Downloaded file is empty');
      return { content: '', success: false };
    }

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`Converted to buffer, attempting PDF parsing...`);

    try {
      // Try using pdf-parse with better error handling
      const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
      const pdfData = await pdfParse.default(uint8Array);
      
      const extractedText = pdfData.text || '';
      console.log(`PDF parsing completed. Text length: ${extractedText.length}`);
      
      if (extractedText.trim().length === 0) {
        console.warn(`No text content extracted from ${type} PDF - may be image-based or corrupted`);
        return { content: '', success: false };
      }
      
      // Log a preview of extracted content
      const preview = extractedText.substring(0, 500).replace(/\s+/g, ' ').trim();
      console.log(`Successfully extracted text preview: "${preview}..."`);
      
      return { content: extractedText, success: true };
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      console.log('Attempting alternative text extraction...');
      
      // Try alternative approach - convert to text using a different method
      try {
        // Simple fallback - try to decode as text directly (for some PDFs)
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(uint8Array);
        
        // Extract readable text portions (basic heuristic)
        const cleanText = rawText
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanText.length > 50) { // Arbitrary threshold for meaningful content
          console.log(`Alternative extraction succeeded, text length: ${cleanText.length}`);
          return { content: cleanText, success: true };
        }
      } catch (altError) {
        console.error('Alternative extraction failed:', altError);
      }
      
      return { content: '', success: false };
    }
  } catch (error) {
    console.error('Error downloading/extracting PDF:', error);
    return { content: '', success: false };
  }
}

function generateSampleQuestionContent(assessment: any): string {
  const subject = assessment.subject || 'General Studies';
  const totalMarks = assessment.total_marks || 50;
  
  return `
${subject.toUpperCase()} EXAM PAPER
${assessment.title || 'Sample Assessment'}
Time: ${assessment.time_limit_minutes || 60} minutes
Total Marks: ${totalMarks}

Question 1 (${Math.floor(totalMarks * 0.2)} marks)
Define and explain the key concepts related to ${subject}.

Question 2 (${Math.floor(totalMarks * 0.3)} marks)
Analyze the following scenario and provide a detailed response:
[Sample scenario based on ${subject}]

Question 3 (${Math.floor(totalMarks * 0.3)} marks)
Compare and contrast different approaches in ${subject}.
Include examples to support your answer.

Question 4 (${Math.floor(totalMarks * 0.2)} marks)
Evaluate the importance of [key topic] in ${subject}.
Justify your answer with relevant evidence.
  `;
}

function generateSampleAnswerContent(assessment: any): string {
  const subject = assessment.subject || 'General Studies';
  const totalMarks = assessment.total_marks || 50;
  
  return `
${subject.toUpperCase()} EXAM PAPER - MARKING SCHEME
${assessment.title || 'Sample Assessment'} - Answer Key

Question 1 (${Math.floor(totalMarks * 0.2)} marks)
Expected Answer: Comprehensive definition with key points
- Define main concepts (5 marks)
- Provide examples (3 marks)
- Show understanding (2 marks)

Question 2 (${Math.floor(totalMarks * 0.3)} marks)
Expected Answer: Detailed analysis with structured response
- Identify key issues (5 marks)
- Apply relevant theory (5 marks)
- Provide justified conclusion (5 marks)

Question 3 (${Math.floor(totalMarks * 0.3)} marks)
Expected Answer: Comparative analysis
- Identify similarities (5 marks)
- Identify differences (5 marks)
- Use relevant examples (5 marks)

Question 4 (${Math.floor(totalMarks * 0.2)} marks)
Expected Answer: Evaluative response
- State importance clearly (3 marks)
- Provide supporting evidence (4 marks)
- Show critical thinking (3 marks)
  `;
}

function cleanJsonString(content: string): string {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  
  // Remove ```json at the beginning
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  // Remove ``` at the end
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

async function processWithAI(questionsContent: string, answersContent: string, openaiKey: string, assessment: any) {
  const prompt = `
You are an expert assessment processor specializing in educational content analysis. I will provide you with the actual content from assessment materials (questions and answers).

Your task is to carefully analyze the PROVIDED CONTENT and return a structured JSON response. DO NOT generate generic or sample content - extract and process only what is actually in the documents.

Expected JSON format:
{
  "confidence_score": 0.95,
  "metadata": {
    "subject": "Detected subject from content",
    "exam_board": "Detected exam board or 'Unknown'",
    "year": 2023,
    "total_marks": 100,
    "time_limit_minutes": 90,
    "description": "Description based on actual content"
  },
  "questions": [
    {
      "question_number": 1,
      "question_text": "Exact question text from the document",
      "question_type": "short_answer|calculation|extended_writing|multiple_choice",
      "marks_available": 5,
      "correct_answer": "Answer from marking scheme",
      "marking_scheme": {
        "criteria": "Marking criteria from document",
        "mark_allocation": "How marks are distributed"
      },
      "keywords": ["relevant", "keywords", "from", "content"]
    }
  ]
}

Assessment Context:
- Title: ${assessment.title || 'Unknown'}
- Subject: ${assessment.subject || 'Unknown'}
- Exam Board: ${assessment.exam_board || 'Unknown'}

ACTUAL QUESTIONS CONTENT:
${questionsContent}

ACTUAL ANSWERS/MARKING SCHEME CONTENT:
${answersContent}

CRITICAL INSTRUCTIONS:
1. Extract questions EXACTLY as they appear in the content
2. Use the actual subject matter from the content - if the content is about biology/science, DO NOT label it as mathematics
3. Match questions to their corresponding answers from the marking scheme
4. Determine question types based on the actual content structure
5. Extract marking schemes directly from the answers content
6. If content is unclear, set confidence_score lower
7. Return ONLY valid JSON without markdown formatting
8. Pay special attention to the subject - analyze the content to determine if it's Biology, Chemistry, Physics, Mathematics, etc.

Analyze the actual content above and extract the real questions and answers. Make sure the subject field reflects the actual content of the exam papers.
`;

  console.log('Sending request to OpenAI with actual content...');
  console.log('Content preview - Questions:', questionsContent.substring(0, 200));
  console.log('Content preview - Answers:', answersContent.substring(0, 200));

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
    // Clean the JSON string to remove markdown formatting
    const cleanedContent = cleanJsonString(content);
    console.log('Cleaned AI response for parsing');
    
    const parsedContent = JSON.parse(cleanedContent);
    console.log('Successfully parsed AI response');
    console.log('Detected subject from AI:', parsedContent.metadata?.subject);
    return parsedContent;
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    console.error('Parse error:', parseError);
    throw new Error('Invalid JSON response from AI - please try again');
  }
}
