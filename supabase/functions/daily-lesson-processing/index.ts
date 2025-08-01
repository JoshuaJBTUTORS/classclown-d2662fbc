import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";
import { toZonedTime, fromZonedTime } from 'https://esm.sh/date-fns-tz@3.2.0';

const UK_TIMEZONE = 'Europe/London';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingStats {
  lessons_found: number;
  sessions_discovered: number;
  transcriptions_retrieved: number;
  summaries_generated: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily lesson processing...');
    
    const { action } = await req.json();
    
    if (action !== 'process_daily_lessons') {
      throw new Error('Invalid action');
    }

    // Calculate previous day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const processingDate = yesterday.toISOString().split('T')[0];

    console.log(`Processing lessons for date: ${processingDate}`);

    // Check if we've already processed this date
    const { data: existingLog } = await supabase
      .from('daily_processing_logs')
      .select('*')
      .eq('processing_date', processingDate)
      .eq('status', 'completed')
      .single();

    if (existingLog) {
      console.log(`Already processed lessons for ${processingDate}`);
      return new Response(
        JSON.stringify({ message: 'Already processed', date: processingDate }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create processing log entry
    const { data: logEntry } = await supabase
      .from('daily_processing_logs')
      .insert({
        processing_date: processingDate,
        status: 'processing'
      })
      .select()
      .single();

    if (!logEntry) {
      throw new Error('Failed to create processing log');
    }

    const stats: ProcessingStats = {
      lessons_found: 0,
      sessions_discovered: 0,
      transcriptions_retrieved: 0,
      summaries_generated: 0
    };

    try {
      // Step 1: Get all lessons from previous day
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          end_time,
          lesson_space_space_id,
          lesson_space_session_id,
          lesson_type,
          tutor_id,
          lesson_students (
            student_id,
            student:students (
              id,
              first_name,
              last_name
            )
          )
        `)
        .gte('start_time', `${processingDate}T00:00:00.000Z`)
        .lt('start_time', `${processingDate}T23:59:59.999Z`)
        .not('lesson_space_space_id', 'is', null);

      if (lessonsError) {
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }

      stats.lessons_found = lessons?.length || 0;
      console.log(`Found ${stats.lessons_found} lessons for processing`);

      if (!lessons || lessons.length === 0) {
        await updateProcessingLog(logEntry.id, stats, 'completed');
        return new Response(
          JSON.stringify({ message: 'No lessons found', stats }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 2: Process each lesson to find session IDs
      for (const lesson of lessons) {
        console.log(`Processing lesson: ${lesson.title} (${lesson.id})`);

        try {
          // Skip if session ID already exists
          if (lesson.lesson_space_session_id) {
            console.log(`Session ID already exists for lesson ${lesson.id}`);
            continue;
          }

          // Find session using LessonSpace API with precise filters
          const sessionId = await findLessonSpaceSession(lesson);
          
          if (sessionId) {
            console.log(`Found session ID: ${sessionId} for lesson ${lesson.id}`);
            
            // Update lesson with session ID
            await supabase
              .from('lessons')
              .update({ lesson_space_session_id: sessionId })
              .eq('id', lesson.id);

            stats.sessions_discovered++;

            // Step 3: Get transcription for this session
            const transcriptionResult = await getTranscription(lesson.id);
            if (transcriptionResult) {
              stats.transcriptions_retrieved++;

              // Step 4: Generate AI summaries
              const summariesResult = await generateSummaries(lesson.id, transcriptionResult.id);
              if (summariesResult) {
                stats.summaries_generated++;
              }
            }
          } else {
            console.log(`No session found for lesson ${lesson.id}`);
          }
        } catch (error) {
          console.error(`Error processing lesson ${lesson.id}:`, error);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Update processing log with completion
      await updateProcessingLog(logEntry.id, stats, 'completed');

      console.log('Daily processing completed successfully', stats);

      return new Response(
        JSON.stringify({ 
          message: 'Processing completed successfully', 
          date: processingDate,
          stats 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('Processing error:', processingError);
      
      await updateProcessingLog(logEntry.id, stats, 'failed', {
        error: processingError.message,
        timestamp: new Date().toISOString()
      });

      throw processingError;
    }

  } catch (error) {
    console.error('Error in daily lesson processing:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function findLessonSpaceSession(lesson: any): Promise<string | null> {
  if (!lesson.lesson_space_space_id) {
    return null;
  }

  try {
    // The stored times are now properly in UTC after the migration
    // Use them directly with a search buffer window
    const startTime = new Date(lesson.start_time);
    const endTime = new Date(lesson.end_time);
    
    // Add 15-minute buffer before and after for search window
    const searchStart = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    const searchEnd = new Date(endTime.getTime() + 15 * 60 * 1000); // 15 minutes after

    // Convert to UK time for logging
    const ukStartTime = toZonedTime(startTime, UK_TIMEZONE);
    const ukEndTime = toZonedTime(endTime, UK_TIMEZONE);

    console.log(`Lesson stored UTC times: ${lesson.start_time} - ${lesson.end_time}`);
    console.log(`UK time equivalent: ${ukStartTime.toISOString()} - ${ukEndTime.toISOString()}`);
    console.log(`Searching sessions for space ${lesson.lesson_space_space_id} between ${searchStart.toISOString()} and ${searchEnd.toISOString()}`);

    // Call LessonSpace Sessions API with filters
    const response = await fetch(`https://api.thelessonspace.com/v2/sessions?space=${lesson.lesson_space_space_id}&start_after=${searchStart.toISOString()}&start_before=${searchEnd.toISOString()}&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lessonSpaceApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`LessonSpace API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Found ${data.sessions?.length || 0} sessions in time window`);

    // Return the first session ID found (should be the most relevant)
    if (data.sessions && data.sessions.length > 0) {
      return data.sessions[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error finding LessonSpace session:', error);
    return null;
  }
}

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

async function updateProcessingLog(
  logId: string, 
  stats: ProcessingStats, 
  status: string, 
  errorDetails: any = {}
) {
  await supabase
    .from('daily_processing_logs')
    .update({
      ...stats,
      status,
      error_details: errorDetails,
      updated_at: new Date().toISOString()
    })
    .eq('id', logId);
}