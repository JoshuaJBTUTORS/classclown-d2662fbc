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
  question_text: string;
  correct_answer: string;
  marks_available: number;
  marking_scheme: any;
}

interface MarkingResult {
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobId, batchSize = 10 }: MarkingRequest = await req.json();

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

    // Update job to running
    await supabase
      .from('marking_jobs')
      .update({ status: 'running', started_at: job.started_at || new Date().toISOString() })
      .eq('id', jobId);

    // Get unmarked responses in the date range
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
      // All responses marked
      await supabase
        .from('marking_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId);

      return new Response(
        JSON.stringify({ 
          status: 'completed',
          message: 'All responses have been marked',
          progress: { marked: job.marked_count, total: job.total_responses, errors: job.error_count }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${responses.length} responses for job ${jobId}`);

    let markedCount = 0;
    let errorCount = 0;

    // Process responses in parallel batches for speed
    const PARALLEL_LIMIT = 5;
    const chunks: typeof responses[] = [];
    for (let i = 0; i < responses.length; i += PARALLEL_LIMIT) {
      chunks.push(responses.slice(i, i + PARALLEL_LIMIT));
    }

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (response) => {
          try {
            const question = response.assessment_questions as any;
            
            // Call AI to mark the response
            const markingResult = await markResponseWithAI(
              lovableApiKey,
              question.question_text,
              response.student_answer || '',
              question.correct_answer,
              question.marks_available,
              question.marking_scheme
            );

            // Update the response with AI marking
            const { error: updateError } = await supabase
              .from('student_responses')
              .update({
                marks_awarded: markingResult.marksAwarded,
                ai_feedback: markingResult.feedback,
                marking_breakdown: {
                  strengths: markingResult.strengths,
                  improvements: markingResult.improvements,
                  aiMarked: true
                },
                confidence_score: markingResult.confidence,
                marked_at: new Date().toISOString(),
                marked_by: 'ai'
              })
              .eq('id', response.id);

            if (updateError) {
              console.error('Error updating response:', updateError);
              return { success: false };
            }
            return { success: true };
          } catch (error) {
            console.error(`Error marking response ${response.id}:`, error);
            return { success: false };
          }
        })
      );

      // Count successes and failures
      results.forEach(r => {
        if (r.success) markedCount++;
        else errorCount++;
      });
    }

    // Update job progress
    const newMarkedCount = job.marked_count + markedCount;
    const newErrorCount = job.error_count + errorCount;
    const isComplete = newMarkedCount >= job.total_responses;

    await supabase
      .from('marking_jobs')
      .update({
        marked_count: newMarkedCount,
        error_count: newErrorCount,
        last_processed_response_id: responses[responses.length - 1]?.id,
        status: isComplete ? 'completed' : 'running',
        completed_at: isComplete ? new Date().toISOString() : null
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({
        status: isComplete ? 'completed' : 'running',
        progress: {
          marked: newMarkedCount,
          total: job.total_responses,
          errors: newErrorCount,
          batchProcessed: markedCount
        },
        hasMore: !isComplete
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Batch marking error:', error);
    
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

async function markResponseWithAI(
  apiKey: string,
  questionText: string,
  studentAnswer: string,
  correctAnswer: string,
  maxMarks: number,
  markingScheme: any
): Promise<MarkingResult> {
  
  const systemPrompt = `You are an expert exam marker for GCSE and A-Level assessments. Your task is to evaluate student answers fairly and accurately.

You must use the mark_answer function to return your assessment.

Guidelines:
- Award marks based on the marking scheme and correct answer provided
- Be fair but rigorous in your assessment
- Look for key concepts, terminology, and understanding
- Partial credit should be given for partial understanding
- Provide constructive feedback that helps the student improve`;

  const userPrompt = `Please mark this exam response:

Question: ${questionText}

Model Answer: ${correctAnswer}

${markingScheme ? `Marking Scheme: ${JSON.stringify(markingScheme)}` : ''}

Maximum Marks: ${maxMarks}

Student's Answer: ${studentAnswer || '(No answer provided)'}

Evaluate the student's answer and provide marks, feedback, strengths, and areas for improvement.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'mark_answer',
            description: 'Submit the marking result for a student answer',
            parameters: {
              type: 'object',
              properties: {
                marksAwarded: {
                  type: 'number',
                  description: 'The number of marks to award (0 to maxMarks)'
                },
                feedback: {
                  type: 'string',
                  description: 'Brief overall feedback on the answer (1-2 sentences)'
                },
                strengths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of strengths in the answer (1-3 items)'
                },
                improvements: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of areas for improvement (1-3 items)'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence in the marking (0.0 to 1.0)'
                }
              },
              required: ['marksAwarded', 'feedback', 'strengths', 'improvements', 'confidence'],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'mark_answer' } }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'mark_answer') {
    // Fallback if tool call fails
    return {
      marksAwarded: 0,
      maxMarks,
      feedback: 'Unable to assess this answer automatically.',
      strengths: [],
      improvements: ['Manual review recommended'],
      confidence: 0
    };
  }

  const result = JSON.parse(toolCall.function.arguments);
  
  // Ensure marks are within valid range and rounded to integer (database column is INTEGER)
  const validMarks = Math.round(Math.max(0, Math.min(result.marksAwarded, maxMarks)));
  
  return {
    marksAwarded: validMarks,
    maxMarks,
    feedback: result.feedback || '',
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
  };
}