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

    const totalBatches = Math.ceil(numberOfQuestions / BATCH_SIZE);
    let totalMarks = 0;
    let questionsGenerated = 0;

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
          status: 'generating'
        }
      }
    }).eq('id', assessmentId);

    // Process each batch
    for (let batch = 0; batch < totalBatches; batch++) {
      const startNumber = batch * BATCH_SIZE + 1;
      const batchSize = Math.min(BATCH_SIZE, numberOfQuestions - questionsGenerated);
      
      console.log(`Processing batch ${batch + 1}/${totalBatches}: questions ${startNumber} to ${startNumber + batchSize - 1}`);

      try {
        const questions = await generateQuestionBatch(
          openAIApiKey,
          batch + 1,
          batchSize,
          startNumber,
          topic,
          prompt,
          assessment
        );

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
              question_number: question.question_number || (questionsGenerated + i + 1),
              question_text: question.question_text,
              question_type: question.question_type,
              marks_available: question.marks_available || 1,
              correct_answer: question.correct_answer || '',
              marking_scheme: {},
              keywords: question.keywords || [],
              position: questionsGenerated + i + 1,
            });

          if (questionError) {
            console.error(`Error inserting question:`, questionError);
          } else {
            totalMarks += question.marks_available || 1;
          }
        }

        questionsGenerated += questions.length;

        // Update progress after each batch
        await supabase.from('ai_assessments').update({
          ai_extraction_data: {
            ...(assessment.ai_extraction_data || {}),
            progress: {
              total_questions: numberOfQuestions,
              generated_questions: questionsGenerated,
              current_batch: batch + 1,
              total_batches: totalBatches,
              status: 'generating'
            }
          },
          total_marks: totalMarks
        }).eq('id', assessmentId);

        console.log(`Batch ${batch + 1} complete. Total questions: ${questionsGenerated}/${numberOfQuestions}`);

      } catch (batchError) {
        console.error(`Batch ${batch + 1} failed:`, batchError);
        
        // If we have some questions, mark as partial
        if (questionsGenerated > 0) {
          await supabase.from('ai_assessments').update({
            processing_status: 'partial',
            processing_error: `Generated ${questionsGenerated}/${numberOfQuestions} questions. Batch ${batch + 1} failed: ${batchError.message}`,
            ai_extraction_data: {
              ...(assessment.ai_extraction_data || {}),
              progress: {
                total_questions: numberOfQuestions,
                generated_questions: questionsGenerated,
                current_batch: batch + 1,
                total_batches: totalBatches,
                status: 'partial'
              }
            }
          }).eq('id', assessmentId);
          return;
        } else {
          throw batchError;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (batch < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Mark as completed
    await supabase.from('ai_assessments').update({
      processing_status: 'completed',
      processing_error: null,
      total_marks: totalMarks,
      ai_confidence_score: 0.9,
      ai_extraction_data: {
        ...(assessment.ai_extraction_data || {}),
        progress: {
          total_questions: numberOfQuestions,
          generated_questions: questionsGenerated,
          current_batch: totalBatches,
          total_batches: totalBatches,
          status: 'completed'
        }
      }
    }).eq('id', assessmentId);

    console.log(`Assessment generation completed: ${questionsGenerated} questions, ${totalMarks} total marks`);

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
