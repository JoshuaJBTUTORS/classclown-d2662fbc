import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
          lesson_space_room_id,
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
        .not('lesson_space_room_id', 'is', null);

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
  if (!lesson.lesson_space_room_id) {
    return null;
  }

  try {
    console.log(`Searching sessions for room: ${lesson.lesson_space_room_id} at time: ${lesson.start_time}`);
    
    // Format lesson times for API query
    const lessonStart = new Date(lesson.start_time);
    const lessonEnd = new Date(lesson.end_time);
    
    // Add some buffer time (30 minutes before and after) to account for slight timing differences
    const searchStart = new Date(lessonStart.getTime() - 30 * 60 * 1000);
    const searchEnd = new Date(lessonEnd.getTime() + 30 * 60 * 1000);
    
    const apiUrl = `https://api.thelessonspace.com/v2/organisations/20704/sessions/?space_uuid=${lesson.lesson_space_room_id}&start_time_gte=${searchStart.toISOString()}&start_time_lte=${searchEnd.toISOString()}`;
    console.log(`Calling LessonSpace API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Organisation ${lessonSpaceApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`LessonSpace API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`LessonSpace API response status: ${response.status}`);
    console.log(`Found ${data.results?.length || 0} sessions in time range`);
    
    if (data.results && data.results.length > 0) {
      // Find the session with the closest start time to the lesson
      let closestSession = data.results[0];
      let closestTimeDiff = Math.abs(new Date(closestSession.start_time).getTime() - lessonStart.getTime());
      
      for (const session of data.results) {
        const sessionStart = new Date(session.start_time);
        const timeDiff = Math.abs(sessionStart.getTime() - lessonStart.getTime());
        if (timeDiff < closestTimeDiff) {
          closestTimeDiff = timeDiff;
          closestSession = session;
        }
      }
      
      console.log(`Best match session: ${closestSession.id}, time diff: ${Math.round(closestTimeDiff / 60000)} minutes`);
      return closestSession.id;
    }
    
    console.log('No sessions found in the specified time range');
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