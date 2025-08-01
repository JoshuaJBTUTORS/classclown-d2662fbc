import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscriptProcessingResult {
  lesson_id: string;
  session_id: string | null;
  transcription_retrieved: boolean;
  summary_generated: boolean;
  error?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting transcript processing...');
    
    const { action, lesson_ids, processing_date } = await req.json();
    
    if (action !== 'process_transcripts') {
      throw new Error('Invalid action. Expected: process_transcripts');
    }

    let lessons;
    
    if (lesson_ids) {
      // Process specific lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_space_session_id
        `)
        .in('id', lesson_ids)
        .not('lesson_space_session_id', 'is', null);

      if (lessonsError) {
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }
      lessons = lessonsData;
    } else if (processing_date) {
      // Process lessons from a specific date
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_space_session_id
        `)
        .gte('start_time', `${processing_date}T00:00:00.000Z`)
        .lt('start_time', `${processing_date}T23:59:59.999Z`)
        .not('lesson_space_session_id', 'is', null);

      if (lessonsError) {
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }
      lessons = lessonsData;
    } else {
      throw new Error('Either lesson_ids or processing_date must be provided');
    }

    console.log(`Found ${lessons?.length || 0} lessons with session IDs to process`);

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No lessons with session IDs found', 
          results: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: TranscriptProcessingResult[] = [];

    // Process each lesson for transcripts and summaries
    for (const lesson of lessons) {
      console.log(`Processing transcripts for lesson: ${lesson.title} (${lesson.id})`);

      const result: TranscriptProcessingResult = {
        lesson_id: lesson.id,
        session_id: lesson.lesson_space_session_id,
        transcription_retrieved: false,
        summary_generated: false
      };

      try {
        // Check if transcription already exists
        const { data: existingTranscription } = await supabase
          .from('lesson_transcriptions')
          .select('id, transcription_status')
          .eq('lesson_id', lesson.id)
          .eq('session_id', lesson.lesson_space_session_id)
          .single();

        let transcriptionId = null;

        if (existingTranscription) {
          console.log(`Transcription already exists for lesson ${lesson.id}: ${existingTranscription.id}`);
          transcriptionId = existingTranscription.id;
          result.transcription_retrieved = existingTranscription.transcription_status === 'completed';
        } else {
          // Get transcription for this session
          const transcriptionResult = await getTranscription(lesson.id);
          if (transcriptionResult && transcriptionResult.id) {
            console.log(`Retrieved transcription for lesson ${lesson.id}: ${transcriptionResult.id}`);
            transcriptionId = transcriptionResult.id;
            result.transcription_retrieved = true;
          } else {
            console.log(`No transcription available for lesson ${lesson.id}`);
          }
        }

        // Generate AI summaries if we have a transcription
        if (transcriptionId) {
          // Check if summaries already exist
          const { data: existingSummaries } = await supabase
            .from('lesson_student_summaries')
            .select('id')
            .eq('lesson_id', lesson.id)
            .eq('transcription_id', transcriptionId)
            .limit(1);

          if (existingSummaries && existingSummaries.length > 0) {
            console.log(`Summaries already exist for lesson ${lesson.id}`);
            result.summary_generated = true;
          } else {
            const summariesResult = await generateSummaries(lesson.id, transcriptionId);
            if (summariesResult) {
              console.log(`Generated summaries for lesson ${lesson.id}`);
              result.summary_generated = true;
            } else {
              console.log(`Failed to generate summaries for lesson ${lesson.id}`);
            }
          }
        }

      } catch (error) {
        console.error(`Error processing transcripts for lesson ${lesson.id}:`, error);
        result.error = error.message;
      }

      results.push(result);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Transcript processing completed');

    const transcriptionsRetrieved = results.filter(r => r.transcription_retrieved).length;
    const summariesGenerated = results.filter(r => r.summary_generated).length;

    return new Response(
      JSON.stringify({ 
        message: 'Transcript processing completed', 
        results,
        summary: {
          total_lessons: lessons.length,
          transcriptions_retrieved: transcriptionsRetrieved,
          summaries_generated: summariesGenerated
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-lesson-transcripts:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getTranscription(lessonId: string): Promise<any> {
  try {
    console.log(`Getting transcription for lesson ${lessonId}`);
    
    // Call the existing transcription function
    const response = await supabase.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'get-transcription',
        lessonId: lessonId
      }
    });

    if (response.error) {
      console.error('Transcription error:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error getting transcription:', error);
    return null;
  }
}

async function generateSummaries(lessonId: string, transcriptionId: string): Promise<any> {
  try {
    console.log(`Generating summaries for lesson ${lessonId}`);
    
    // Call the existing summary generation function
    const response = await supabase.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'generate-summaries',
        lessonId: lessonId,
        transcriptionId: transcriptionId
      }
    });

    if (response.error) {
      console.error('Summary generation error:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('Error generating summaries:', error);
    return null;
  }
}