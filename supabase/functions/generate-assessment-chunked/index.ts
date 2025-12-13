import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 10;

function repairJSON(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
  
  // Try to extract JSON object/array if there's extra text
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  // Fix common JSON issues
  // 1. Replace unescaped newlines in strings
  cleaned = cleaned.replace(/([^\\])\\n(?!["\s\]}])/g, '$1\\\\n');
  
  // 2. Fix unescaped quotes within string values (more robust approach)
  // First, let's try to parse it directly
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e) {
    // Continue with repairs
  }
  
  // 3. Replace control characters that break JSON
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') {
      return char; // Keep these
    }
    return ''; // Remove other control chars
  });
  
  // 4. Fix trailing commas before closing brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // 5. Try line-by-line repair for escaped quote issues
  const lines = cleaned.split('\n');
  const repairedLines = lines.map(line => {
    // Match string value patterns and escape internal quotes
    const match = line.match(/^(\s*"[^"]+"\s*:\s*")(.*)(",?\s*)$/);
    if (match) {
      const [, prefix, value, suffix] = match;
      // Escape unescaped quotes in the value (not already escaped)
      let repairedValue = '';
      for (let i = 0; i < value.length; i++) {
        if (value[i] === '"' && (i === 0 || value[i - 1] !== '\\')) {
          repairedValue += '\\"';
        } else {
          repairedValue += value[i];
        }
      }
      return prefix + repairedValue + suffix;
    }
    return line;
  });
  
  return repairedLines.join('\n');
}

// Generate extract for English Language papers
async function generateExtract(
  openAIApiKey: string,
  assessment: any,
  prompt: string
): Promise<{ text: string; source: string; type: string }> {
  const extractType = assessment.extract_type || 'fiction';
  
  const extractPrompt = `
You are an expert in creating authentic GCSE English Language exam extracts.

Generate a ${extractType} extract suitable for GCSE English Language ${assessment.exam_board || 'AQA'} assessment.

Requirements:
- 400-600 words in length
- Rich in literary techniques suitable for analysis (metaphors, similes, personification, etc.)
- Age-appropriate content for 14-16 year olds
- Include line numbers every 5 lines (format: "5 | text here")
- Provide attribution (e.g., "Adapted from 'Title' by Author Name")
- The text should allow for:
  - Information retrieval questions
  - Language analysis questions
  - Structure analysis questions
  - Evaluation/opinion questions

Topic/Theme from user: ${prompt}

Return JSON:
{
  "extract_text": "1 | First line of the extract...\\n2 | Second line...\\n...\\n5 | Fifth line with number marker...\\n...",
  "source": "Adapted from 'Title of Work' by Author Name (Year)",
  "type": "${extractType}"
}

IMPORTANT: Include line numbers in the text itself, formatted as "LINE_NUMBER | text content"
`;

  console.log(`Generating extract for English Language paper at ${new Date().toISOString()}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are an expert in creating GCSE English Language exam materials. Always return valid JSON.' },
        { role: 'user', content: extractPrompt }
      ],
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate extract: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response when generating extract');
  }

  try {
    const repairedContent = repairJSON(content);
    const parsed = JSON.parse(repairedContent);
    return {
      text: parsed.extract_text,
      source: parsed.source,
      type: parsed.type || extractType
    };
  } catch (e) {
    console.error('Failed to parse extract JSON:', e);
    throw new Error('Failed to parse extract response');
  }
}

// Generate questions based on an extract (for English Language)
async function generateQuestionsFromExtract(
  openAIApiKey: string,
  batchNumber: number,
  batchSize: number,
  startNumber: number,
  extract: { text: string; source: string; type: string },
  assessment: any
): Promise<any[]> {
  const generationPrompt = `
You are an expert GCSE English Language examiner. Generate ${batchSize} exam questions based on THIS SPECIFIC EXTRACT.

THE EXTRACT (Source: ${extract.source}):
---
${extract.text}
---

Assessment Details:
- Exam Board: ${assessment.exam_board || 'AQA'}
- Paper Type: ${assessment.paper_type || 'Paper 1'}

Generate questions numbered ${startNumber} to ${startNumber + batchSize - 1}.

QUESTION TYPES TO INCLUDE (in order):
1. Information Retrieval (4 marks): "Read lines X-Y. List four things about..."
2. Language Analysis (8 marks): "Look at lines X-Y. How does the writer use language to describe/present..."
3. Structure Analysis (8 marks): "How does the writer structure the text to..."
4. Evaluation (20 marks): "[Statement about the text]. To what extent do you agree?"

Return JSON:
{
  "questions": [
    {
      "question_number": ${startNumber},
      "question_text": "Read lines 1-10. List four things you learn about the character's feelings.",
      "question_type": "short_answer",
      "marks_available": 4,
      "correct_answer": "Award 1 mark for each valid point from the text (max 4). Accept: [specific points from extract]",
      "keywords": ["point1", "point2", "point3", "point4"],
      "line_reference": "1-10"
    }
  ]
}

CRITICAL RULES:
- EVERY question MUST reference specific line numbers from the extract
- Questions must be answerable ONLY from the given extract
- Mark allocations: Retrieval (4), Language (8), Structure (8), Evaluation (16-20)
- Use extended_writing type for 8+ mark questions, short_answer for 4 marks
`;

  console.log(`[Batch ${batchNumber}] Generating questions from extract at ${new Date().toISOString()}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are an expert GCSE English Language examiner. Always return valid JSON with properly escaped quotes.' },
        { role: 'user', content: generationPrompt }
      ],
      max_completion_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error(`Empty response from OpenAI for batch ${batchNumber}`);
  }

  try {
    const repairedContent = repairJSON(content);
    const parsed = JSON.parse(repairedContent);
    return parsed.questions || [];
  } catch (e) {
    console.error(`JSON parse error for batch ${batchNumber}:`, e);
    throw new Error(`Failed to parse questions JSON: ${e.message}`);
  }
}

async function generateQuestionBatch(
  openAIApiKey: string,
  batchNumber: number,
  batchSize: number,
  startNumber: number,
  topic: string,
  prompt: string,
  assessment: any
): Promise<any[]> {
  const generationPrompt = `
You are an expert assessment creator. Generate ${batchSize} exam questions for the topic: "${topic}".

Assessment Details:
- Subject: ${assessment.subject || 'Not specified'}
- Exam Board: ${assessment.exam_board || 'Not specified'}
- Year: ${assessment.year || 'Not specified'}
- Paper Type: ${assessment.paper_type || 'Not specified'}
- Time Limit: ${assessment.time_limit_minutes || 'Not specified'} minutes

Generation Instructions:
${prompt}

IMPORTANT: Generate questions numbered ${startNumber} to ${startNumber + batchSize - 1}.

Please format as JSON with this exact structure:
{
  "questions": [
    {
      "question_number": ${startNumber},
      "question_text": "The complete question text with clear instructions",
      "question_type": "short_answer|extended_writing",
      "marks_available": 5,
      "correct_answer": "The correct answer or detailed marking scheme",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

CRITICAL FORMATTING RULES FOR MATHS/SCIENCE:
- ALL mathematical expressions MUST use LaTeX syntax wrapped in dollar signs
- Powers/exponents: Use $3^2$ NOT 3^2
- Fractions: Use $\\frac{1}{2}$ NOT 1/2
- Square roots: Use $\\sqrt{16}$ NOT sqrt(16)
- Subscripts: Use $H_2O$ NOT H2O
- Equations: Use $x + 5 = 12$ NOT x + 5 = 12
- Example: "Calculate the value of $3^2 + 4^2$ using BIDMAS" NOT "Calculate the value of 3^2 + 4^2"

Requirements:
- Generate exactly ${batchSize} unique, high-quality questions
- Question types must be ONLY: short_answer, extended_writing
- Use short_answer for brief responses (1-3 sentences)
- Use extended_writing for detailed explanations or essays
- Assign realistic mark allocations (1-20 marks per question)
- Include detailed correct answers and keywords
`;

  console.log(`[Batch ${batchNumber}] Starting OpenAI API call at ${new Date().toISOString()}`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment creator. Always return valid JSON with properly escaped quotes.'
        },
        {
          role: 'user',
          content: generationPrompt
        }
      ],
      max_completion_tokens: 16000,
    }),
  });

  console.log(`[Batch ${batchNumber}] OpenAI API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Batch ${batchNumber}] OpenAI API error response: ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[Batch ${batchNumber}] OpenAI API response received. Choices: ${data.choices?.length || 0}, Model: ${data.model || 'unknown'}`);
  
  const content = data.choices[0]?.message?.content;
  
  if (!content || content.trim() === '') {
    console.error(`[Batch ${batchNumber}] Empty content. Full response:`, JSON.stringify(data).substring(0, 1000));
    throw new Error(`Empty response from OpenAI for batch ${batchNumber}`);
  }
  
  console.log(`[Batch ${batchNumber}] Content received, length: ${content.length} chars`);

  let parsed;
  try {
    const repairedContent = repairJSON(content);
    parsed = JSON.parse(repairedContent);
  } catch (parseError) {
    console.error(`JSON parse error for batch ${batchNumber}:`, parseError.message);
    console.error(`Raw content (first 500 chars):`, content.substring(0, 500));
    
    // Last resort: try to extract questions array manually
    const questionsMatch = content.match(/"questions"\s*:\s*\[([\s\S]*?)\]/);
    if (questionsMatch) {
      try {
        parsed = { questions: JSON.parse('[' + questionsMatch[1] + ']') };
      } catch (e) {
        throw new Error(`Failed to parse JSON after repair: ${parseError.message}`);
      }
    } else {
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
  }
  
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error(`Invalid response structure for batch ${batchNumber}`);
  }

  return parsed.questions;
}

async function processAssessmentInBackground(
  assessmentId: string,
  numberOfQuestions: number,
  topic: string,
  prompt: string
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    await supabase.from('ai_assessments').update({
      processing_status: 'failed',
      processing_error: 'OpenAI API key not configured'
    }).eq('id', assessmentId);
    return;
  }

  try {
    // Get assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message}`);
    }

    // Check if this is a GCSE/Year 11 English assessment (not KS2, KS3, or Literature)
    // Only GCSE-level English uses extract-based question generation
    const subjectLower = assessment.subject?.toLowerCase() || '';
    const isEnglishLanguage = subjectLower.includes('english') && 
      !subjectLower.includes('literature') &&
      !subjectLower.includes('ks2') &&
      !subjectLower.includes('ks3') &&
      (subjectLower.includes('gcse') || subjectLower.includes('year 11'));
    let extract: { text: string; source: string; type: string } | null = null;

    // For English Language, generate extract first
    if (isEnglishLanguage) {
      console.log('English Language assessment detected - generating extract first');
      
      await supabase.from('ai_assessments').update({
        processing_status: 'processing',
        processing_error: null,
        ai_extraction_data: {
          ...(assessment.ai_extraction_data || {}),
          progress: {
            total_questions: numberOfQuestions,
            generated_questions: 0,
            current_batch: 0,
            total_batches: Math.ceil(numberOfQuestions / BATCH_SIZE),
            status: 'generating_extract'
          }
        }
      }).eq('id', assessmentId);

      try {
        extract = await generateExtract(openAIApiKey, assessment, prompt);
        
        // Save extract to assessment
        await supabase.from('ai_assessments').update({
          extract_text: extract.text,
          extract_source: extract.source,
          extract_type: extract.type
        }).eq('id', assessmentId);
        
        console.log('Extract generated and saved successfully');
      } catch (extractError) {
        console.error('Failed to generate extract:', extractError);
        await supabase.from('ai_assessments').update({
          processing_status: 'failed',
          processing_error: `Failed to generate extract: ${extractError.message}`
        }).eq('id', assessmentId);
        return;
      }
    }

    const totalBatches = Math.ceil(numberOfQuestions / BATCH_SIZE);
    let totalMarks = 0;
    let questionsGenerated = 0;
    const failedBatches: number[] = [];

    console.log(`Starting chunked generation: ${numberOfQuestions} questions in ${totalBatches} batches`);

    // Update status to processing with initial progress
    await supabase.from('ai_assessments').update({
      processing_status: 'processing',
      processing_error: null,
      ai_extraction_data: {
        ...(assessment.ai_extraction_data || {}),
        progress: {
          total_questions: numberOfQuestions,
          generated_questions: 0,
          current_batch: 0,
          total_batches: totalBatches,
          failed_batches: [],
          status: 'generating'
        }
      }
    }).eq('id', assessmentId);

    // Process each batch
    for (let batch = 0; batch < totalBatches; batch++) {
      const startNumber = batch * BATCH_SIZE + 1;
      const batchSize = Math.min(BATCH_SIZE, numberOfQuestions - (batch * BATCH_SIZE));
      
      console.log(`Processing batch ${batch + 1}/${totalBatches}: questions ${startNumber} to ${startNumber + batchSize - 1}`);

      try {
        // Use different generation method for English Language
        let questions;
        if (isEnglishLanguage && extract) {
          questions = await generateQuestionsFromExtract(
            openAIApiKey,
            batch + 1,
            batchSize,
            startNumber,
            extract,
            assessment
          );
        } else {
          questions = await generateQuestionBatch(
            openAIApiKey,
            batch + 1,
            batchSize,
            startNumber,
            topic,
            prompt,
            assessment
          );
        }

        // Insert questions immediately after each batch
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          
          // Validate question type
          const supportedTypes = ['short_answer', 'extended_writing'];
          if (!supportedTypes.includes(question.question_type)) {
            question.question_type = 'short_answer';
          }

          const { error: questionError } = await supabase
            .from('assessment_questions')
            .insert({
              assessment_id: assessmentId,
              question_number: question.question_number || (startNumber + i),
              question_text: question.question_text,
              question_type: question.question_type,
              marks_available: question.marks_available || 1,
              correct_answer: question.correct_answer || '',
              marking_scheme: {},
              keywords: question.keywords || [],
              position: startNumber + i,
            });

          if (questionError) {
            console.error(`Error inserting question:`, questionError);
          } else {
            totalMarks += question.marks_available || 1;
            questionsGenerated++;
          }
        }

        // Update progress after each batch
        await supabase.from('ai_assessments').update({
          ai_extraction_data: {
            ...(assessment.ai_extraction_data || {}),
            progress: {
              total_questions: numberOfQuestions,
              generated_questions: questionsGenerated,
              current_batch: batch + 1,
              total_batches: totalBatches,
              failed_batches: failedBatches,
              status: 'generating'
            }
          },
          total_marks: totalMarks
        }).eq('id', assessmentId);

        console.log(`Batch ${batch + 1} complete. Total questions: ${questionsGenerated}/${numberOfQuestions}`);

      } catch (batchError) {
        console.error(`Batch ${batch + 1} failed:`, batchError);
        
        // Track failed batch but CONTINUE to next batch
        failedBatches.push(batch + 1);
        
        // Update progress with failed batch info
        await supabase.from('ai_assessments').update({
          ai_extraction_data: {
            ...(assessment.ai_extraction_data || {}),
            progress: {
              total_questions: numberOfQuestions,
              generated_questions: questionsGenerated,
              current_batch: batch + 1,
              total_batches: totalBatches,
              failed_batches: failedBatches,
              status: 'generating_with_errors'
            }
          }
        }).eq('id', assessmentId);
        
        console.log(`Batch ${batch + 1} failed, continuing to next batch...`);
        continue; // Continue to next batch instead of stopping!
      }

      // Small delay between batches to avoid rate limiting
      if (batch < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Determine final status based on results
    const finalStatus = failedBatches.length === 0 ? 'completed' : 
                        questionsGenerated > 0 ? 'partial' : 'failed';
    
    const errorMessage = failedBatches.length > 0 
      ? `Generated ${questionsGenerated}/${numberOfQuestions} questions. Failed batches: ${failedBatches.join(', ')}`
      : null;

    // Mark with final status
    await supabase.from('ai_assessments').update({
      processing_status: finalStatus,
      processing_error: errorMessage,
      total_marks: totalMarks,
      ai_confidence_score: failedBatches.length === 0 ? 0.9 : 0.7,
      ai_extraction_data: {
        ...(assessment.ai_extraction_data || {}),
        progress: {
          total_questions: numberOfQuestions,
          generated_questions: questionsGenerated,
          current_batch: totalBatches,
          total_batches: totalBatches,
          failed_batches: failedBatches,
          status: finalStatus
        }
      }
    }).eq('id', assessmentId);

    console.log(`Assessment generation ${finalStatus}: ${questionsGenerated} questions, ${totalMarks} total marks, ${failedBatches.length} failed batches`);

  } catch (error) {
    console.error('Assessment generation failed:', error);
    await supabase.from('ai_assessments').update({
      processing_status: 'failed',
      processing_error: error.message || 'Unknown error occurred'
    }).eq('id', assessmentId);
  }
}

serve(async (req) => {
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get assessment to get defaults if params not provided
    const { data: assessment, error: assessmentError } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(`Failed to fetch assessment: ${assessmentError?.message}`);
    }

    const finalTopic = topic || assessment.ai_extraction_data?.topic;
    const finalPrompt = prompt || assessment.ai_extraction_data?.prompt;
    const finalNumberOfQuestions = numberOfQuestions || assessment.ai_extraction_data?.numberOfQuestions;

    if (!finalTopic || !finalPrompt || !finalNumberOfQuestions) {
      throw new Error("Missing required parameters: topic, prompt, or numberOfQuestions");
    }

    // Update to processing immediately
    await supabase.from('ai_assessments').update({
      processing_status: 'processing',
      processing_error: null
    }).eq('id', assessmentId);

    // Start background processing
    EdgeRuntime.waitUntil(
      processAssessmentInBackground(assessmentId, finalNumberOfQuestions, finalTopic, finalPrompt)
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Assessment generation started in background",
        assessmentId,
        totalQuestions: finalNumberOfQuestions,
        estimatedBatches: Math.ceil(finalNumberOfQuestions / BATCH_SIZE)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error starting assessment generation:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
