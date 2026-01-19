import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkingRequest {
  jobId: string;
  batchSize?: number;
}

interface ResponseToMark {
  id: string;
  student_answer: string;
  question_id: string;
  session_id: string;
}

interface QuestionDetails {
  question_text: string;
  correct_answer: string;
  marks_available: number;
  marking_scheme: any;
}

interface BatchMarkingResult {
  responseId: string;
  marksAwarded: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
}

class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds = 60) {
    super('RATE_LIMIT');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isRateLimitError(err: any): err is RateLimitError {
  return err?.name === 'RateLimitError' || err?.message === 'RATE_LIMIT';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobId, batchSize = 50 }: MarkingRequest = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'jobId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('marking_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if job is paused or completed
    if (job.status === 'paused' || job.status === 'completed' || job.status === 'failed') {
      return new Response(
        JSON.stringify({ 
          status: job.status,
          message: `Job is ${job.status}`,
          progress: { marked: job.marked_count, total: job.total_responses, errors: job.error_count }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job to running with heartbeat
    await supabase
      .from('marking_jobs')
      .update({ 
        status: 'running', 
        started_at: job.started_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // Get sessions in the date range
    const { data: sessions } = await supabase
      .from('assessment_sessions')
      .select('id')
      .eq('status', 'completed')
      .gte('completed_at', job.date_range_start)
      .lte('completed_at', job.date_range_end);

    const sessionIds = sessions?.map(s => s.id) || [];

    if (sessionIds.length === 0) {
      await supabase
        .from('marking_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({ status: 'completed', message: 'No sessions to mark' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unmarked responses with question details
    const { data: responses, error: responsesError } = await supabase
      .from('student_responses')
      .select(`
        id,
        student_answer,
        question_id,
        session_id,
        assessment_questions!inner (
          id,
          question_text,
          correct_answer,
          marks_available,
          marking_scheme
        )
      `)
      .in('session_id', sessionIds)
      .is('marked_at', null)
      .limit(batchSize);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      throw responsesError;
    }

    if (!responses || responses.length === 0) {
      // All responses marked - get accurate count from DB
      const { count: actualMarkedCount } = await supabase
        .from('student_responses')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
        .not('marked_at', 'is', null);

      await supabase
        .from('marking_jobs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          marked_count: actualMarkedCount || job.total_responses
        })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({ 
          status: 'completed',
          message: 'All responses have been marked',
          progress: { marked: actualMarkedCount || job.total_responses, total: job.total_responses, errors: job.error_count }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[batch-mark] Job ${jobId}: Processing ${responses.length} responses`);
    console.log(`[batch-mark] Model: google/gemini-2.5-flash-lite`);

    let errorCount = 0;
    const updates: any[] = [];

    let rateLimited = false;
    let retryAfterSeconds = 60;


    // Group responses by question_id for batch marking
    const responsesByQuestion = new Map<string, { responses: any[]; question: QuestionDetails }>();
    
    for (const response of responses) {
      const question = response.assessment_questions as any;
      const questionId = question.id;
      
      if (!responsesByQuestion.has(questionId)) {
        responsesByQuestion.set(questionId, {
          responses: [],
          question: {
            question_text: question.question_text,
            correct_answer: question.correct_answer,
            marks_available: question.marks_available,
            marking_scheme: question.marking_scheme
          }
        });
      }
      responsesByQuestion.get(questionId)!.responses.push(response);
    }

    console.log(`[batch-mark] Grouped into ${responsesByQuestion.size} question batches`);

    // Process each question group sequentially to avoid rate limits
    const questionGroups = Array.from(responsesByQuestion.entries());
    
    for (const [questionId, { responses: questionResponses, question }] of questionGroups) {
      try {
        // Skip blank answers entirely - no AI call needed
        const blankResponses = questionResponses.filter(r => 
          !r.student_answer || r.student_answer.trim().length === 0
        );
        const nonBlankResponses = questionResponses.filter(r => 
          r.student_answer && r.student_answer.trim().length > 0
        );

        // Handle blank answers immediately
        for (const response of blankResponses) {
          updates.push({
            id: response.id,
            marks_awarded: 0,
            ai_feedback: 'No answer provided.',
            marking_breakdown: { strengths: [], improvements: ['Provide an answer to earn marks.'], aiMarked: true },
            confidence_score: 1.0,
            marked_at: new Date().toISOString(),
            marked_by: 'ai'
          });
        }

        if (nonBlankResponses.length === 0) {
          continue; // Move to next question
        }

        // Batch mark non-blank responses for this question (up to 10 at once)
        const BATCH_SIZE = 10;

        for (let j = 0; j < nonBlankResponses.length; j += BATCH_SIZE) {
          const batch = nonBlankResponses.slice(j, j + BATCH_SIZE);

          // Retry logic for non-rate-limit failures; on rate limit we pause the whole job.
          let retries = 0;
          const MAX_RETRIES = 2;
          let success = false;

          while (!success && retries < MAX_RETRIES && !rateLimited) {
            try {
              const results = await markMultipleResponsesWithAI(
                lovableApiKey,
                question,
                batch.map(r => ({ responseId: r.id, studentAnswer: r.student_answer }))
              );

              for (const result of results) {
                updates.push({
                  id: result.responseId,
                  marks_awarded: result.marksAwarded,
                  ai_feedback: result.feedback,
                  marking_breakdown: {
                    strengths: result.strengths,
                    improvements: result.improvements,
                    aiMarked: true
                  },
                  confidence_score: result.confidence,
                  marked_at: new Date().toISOString(),
                  marked_by: 'ai'
                });
              }

              success = true;

              // Conservative pacing between AI calls
              await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (batchError: any) {
              // If we hit a rate limit, pause the job and let the UI resume later.
              if (isRateLimitError(batchError)) {
                rateLimited = true;
                retryAfterSeconds = batchError.retryAfterSeconds || 60;
                console.log(`[batch-mark] Rate limited. Pausing job for ~${retryAfterSeconds}s`);
                break;
              }

              retries++;
              if (retries >= MAX_RETRIES) {
                console.error(`[batch-mark] Failed after ${MAX_RETRIES} attempts for question ${questionId}:`, batchError);
                // Mark failed responses with error (non-rate-limit failures only)
                for (const response of batch) {
                  updates.push({
                    id: response.id,
                    marks_awarded: 0,
                    ai_feedback: 'Error during AI marking. Manual review required.',
                    marking_breakdown: { strengths: [], improvements: ['Manual review recommended'], aiMarked: false },
                    confidence_score: 0,
                    marked_at: new Date().toISOString(),
                    marked_by: 'ai'
                  });
                  errorCount++;
                }
              } else {
                // Small backoff for transient errors
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
            }
          }

          if (rateLimited) break;
        }
      } catch (error) {
        console.error(`[batch-mark] Error processing question ${questionId}:`, error);
        errorCount += questionResponses.length;
      }

      if (rateLimited) break;
    }


    // Bulk update all responses at once
    if (updates.length > 0) {
      console.log(`[batch-mark] Bulk updating ${updates.length} responses`);
      
      // Supabase doesn't have native bulk upsert, so we'll do individual updates but in parallel
      const UPDATE_PARALLEL_LIMIT = 20;
      for (let i = 0; i < updates.length; i += UPDATE_PARALLEL_LIMIT) {
        const updateChunk = updates.slice(i, i + UPDATE_PARALLEL_LIMIT);
        await Promise.all(
          updateChunk.map(update => 
            supabase
              .from('student_responses')
              .update({
                marks_awarded: update.marks_awarded,
                ai_feedback: update.ai_feedback,
                marking_breakdown: update.marking_breakdown,
                confidence_score: update.confidence_score,
                marked_at: update.marked_at,
                marked_by: update.marked_by
              })
              .eq('id', update.id)
          )
        );
      }
    }

    // Get accurate marked count from DB (not incremental)
    const { count: actualMarkedCount } = await supabase
      .from('student_responses')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .not('marked_at', 'is', null);

    const newMarkedCount = actualMarkedCount || 0;
    const newErrorCount = job.error_count + errorCount;
    const isComplete = newMarkedCount >= job.total_responses;

    const elapsed = Date.now() - startTime;
    const responsesPerMinute = updates.length > 0 ? Math.round((updates.length / elapsed) * 60000) : 0;
    console.log(`[batch-mark] Completed batch in ${elapsed}ms (${updates.length} responses, ~${responsesPerMinute}/min)`);
    console.log(`[batch-mark] Total progress: ${newMarkedCount}/${job.total_responses}`);

    const shouldPause = rateLimited && !isComplete;
    const newStatus: 'running' | 'paused' | 'completed' = isComplete
      ? 'completed'
      : shouldPause
        ? 'paused'
        : 'running';

    // Update job with accurate count
    await supabase
      .from('marking_jobs')
      .update({
        marked_count: newMarkedCount,
        error_count: newErrorCount,
        last_processed_response_id: responses[responses.length - 1]?.id,
        status: newStatus,
        paused_at: shouldPause ? new Date().toISOString() : null,
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        status: newStatus,
        ...(shouldPause ? { reason: 'rate_limited', retryAfterSeconds } : {}),
        progress: {
          marked: newMarkedCount,
          total: job.total_responses,
          errors: newErrorCount,
          batchProcessed: updates.length,
          responsesPerMinute
        },
        hasMore: !isComplete
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[batch-mark] Error:', error);
    
    // Check for rate limit errors
    if (error instanceof Error && error.message.includes('429')) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (error instanceof Error && error.message.includes('402')) {
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function markMultipleResponsesWithAI(
  apiKey: string,
  question: QuestionDetails,
  answers: { responseId: string; studentAnswer: string }[]
): Promise<BatchMarkingResult[]> {
  
  const systemPrompt = `You are an expert exam marker for GCSE and A-Level assessments. Your task is to evaluate multiple student answers to the SAME question fairly and accurately.

You must use the mark_answers function to return your assessment for ALL answers provided.

Guidelines:
- Award marks based on the marking scheme and correct answer provided
- Be fair but rigorous in your assessment
- Look for key concepts, terminology, and understanding
- Partial credit should be given for partial understanding
- Provide brief, constructive feedback for each answer`;

  // Build the answers list
  const answersText = answers.map((a, i) => 
    `[Answer ${i + 1}] (ID: ${a.responseId})\n${a.studentAnswer}`
  ).join('\n\n');

  const userPrompt = `Please mark these ${answers.length} student answers to the same question:

QUESTION: ${question.question_text}

MODEL ANSWER: ${question.correct_answer}

${question.marking_scheme ? `MARKING SCHEME: ${JSON.stringify(question.marking_scheme)}` : ''}

MAXIMUM MARKS: ${question.marks_available}

STUDENT ANSWERS:
${answersText}

Mark each answer and provide marks (0-${question.marks_available}), brief feedback, strengths, and improvements for each.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'mark_answers',
            description: 'Submit marking results for multiple student answers',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      responseId: { type: 'string', description: 'The ID of the response being marked' },
                      marksAwarded: { type: 'number', description: 'Marks awarded (0 to maxMarks)' },
                      feedback: { type: 'string', description: 'Brief feedback (1 sentence)' },
                      strengths: { type: 'array', items: { type: 'string' }, description: '1-2 strengths' },
                      improvements: { type: 'array', items: { type: 'string' }, description: '1-2 improvements' },
                      confidence: { type: 'number', description: 'Confidence 0.0-1.0' }
                    },
                    required: ['responseId', 'marksAwarded', 'feedback', 'strengths', 'improvements', 'confidence']
                  },
                  description: 'Array of marking results, one per student answer'
                }
              },
              required: ['results'],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'mark_answers' } }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[batch-mark] AI API error:', response.status, errorText);

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfter = Number(retryAfterHeader || '60');
      throw new RateLimitError(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
    }

    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'mark_answers') {
    console.error('[batch-mark] No valid tool call in response');
    // Return fallback results
    return answers.map(a => ({
      responseId: a.responseId,
      marksAwarded: 0,
      feedback: 'Unable to assess automatically. Manual review required.',
      strengths: [],
      improvements: ['Manual review recommended'],
      confidence: 0
    }));
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  const results: BatchMarkingResult[] = [];

  // Map results back to response IDs
  const resultMap = new Map<string, any>();
  for (const result of (parsed.results || [])) {
    resultMap.set(result.responseId, result);
  }

  // Ensure we have a result for every answer
  for (const answer of answers) {
    const result = resultMap.get(answer.responseId);
    if (result) {
      results.push({
        responseId: answer.responseId,
        marksAwarded: Math.round(Math.max(0, Math.min(result.marksAwarded, question.marks_available))),
        feedback: result.feedback || '',
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      });
    } else {
      // Fallback for missing results
      results.push({
        responseId: answer.responseId,
        marksAwarded: 0,
        feedback: 'Unable to assess. Manual review required.',
        strengths: [],
        improvements: ['Manual review recommended'],
        confidence: 0
      });
    }
  }

  return results;
}
