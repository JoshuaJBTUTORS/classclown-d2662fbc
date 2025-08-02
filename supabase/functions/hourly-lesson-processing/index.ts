import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingStats {
  lessons_found: number;
  sessions_discovered: number;
  recordings_stored: number;
  transcriptions_retrieved: number;
  summaries_generated: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting hourly lesson processing...');
    
    const stats: ProcessingStats = {
      lessons_found: 0,
      sessions_discovered: 0,
      recordings_stored: 0,
      transcriptions_retrieved: 0,
      summaries_generated: 0,
    };

    // Get today's date in UTC
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`Processing lessons for date: ${todayStr}`);

    // Get all lessons from today that might need processing
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        lesson_space_room_id,
        lesson_space_session_id,
        lesson_space_recording_url,
        tutor_id,
        lesson_students (
          student_id
        )
      `)
      .gte('start_time', `${todayStr}T00:00:00.000Z`)
      .lt('start_time', `${new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}T00:00:00.000Z`)
      .eq('status', 'completed');

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    if (!lessons || lessons.length === 0) {
      console.log('No lessons found for today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No lessons found for processing',
          stats 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    stats.lessons_found = lessons.length;
    console.log(`Found ${lessons.length} lessons to process`);

    // Process each lesson
    for (const lesson of lessons) {
      console.log(`Processing lesson: ${lesson.title} (${lesson.id})`);
      
      // Step 1: Find LessonSpace session if not exists
      if (!lesson.lesson_space_session_id && lesson.lesson_space_room_id) {
        console.log(`Finding session for lesson ${lesson.id}`);
        const sessionId = await findLessonSpaceSession(lesson);
        if (sessionId) {
          await supabaseClient
            .from('lessons')
            .update({ lesson_space_session_id: sessionId })
            .eq('id', lesson.id);
          
          lesson.lesson_space_session_id = sessionId;
          stats.sessions_discovered++;
          console.log(`Found and stored session ID: ${sessionId}`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Get and store recording URL if session exists but no recording URL
      if (lesson.lesson_space_session_id && !lesson.lesson_space_recording_url) {
        console.log(`Getting recording for lesson ${lesson.id}`);
        const recordingUrl = await getRecordingUrl(lesson.lesson_space_session_id);
        if (recordingUrl) {
          await supabaseClient
            .from('lessons')
            .update({ lesson_space_recording_url: recordingUrl })
            .eq('id', lesson.id);
          
          stats.recordings_stored++;
          console.log(`Stored recording URL for lesson ${lesson.id}`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 3: Get transcription if session exists but no transcription
      if (lesson.lesson_space_session_id) {
        const transcriptionResult = await ensureTranscription(supabaseClient, lesson.id, lesson.lesson_space_session_id);
        if (transcriptionResult) {
          stats.transcriptions_retrieved++;
        }
      }

      // Step 4: Generate summaries if transcription exists but no summaries
      if (lesson.lesson_space_session_id && lesson.lesson_students?.length > 0) {
        const summaryResult = await ensureSummaries(supabaseClient, lesson.id);
        if (summaryResult) {
          stats.summaries_generated++;
        }
      }

      // Add delay between lessons to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('Hourly processing completed successfully:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Hourly lesson processing completed',
        stats,
        processed_date: todayStr
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hourly-lesson-processing function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function findLessonSpaceSession(lesson: any): Promise<string | null> {
  try {
    const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY');
    if (!lessonSpaceApiKey) {
      console.error('LessonSpace API key not configured');
      return null;
    }

    const startTime = new Date(lesson.start_time);
    const endTime = new Date(lesson.end_time);
    
    // Search for sessions in a wider time window (30 minutes before to 30 minutes after)
    const searchStart = new Date(startTime.getTime() - 30 * 60 * 1000);
    const searchEnd = new Date(endTime.getTime() + 30 * 60 * 1000);

    const response = await fetch(`https://api.thelessonspace.com/v2/spaces/${lesson.lesson_space_room_id}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Organisation ${lessonSpaceApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`LessonSpace API error: ${response.status}`);
      return null;
    }

    const sessions = await response.json();
    
    if (!sessions || sessions.length === 0) {
      return null;
    }

    // Find the session that best matches our lesson time
    let bestMatch = null;
    let smallestTimeDiff = Infinity;

    for (const session of sessions) {
      const sessionStart = new Date(session.started_at || session.created_at);
      const timeDiff = Math.abs(sessionStart.getTime() - startTime.getTime());
      
      if (timeDiff < smallestTimeDiff && sessionStart >= searchStart && sessionStart <= searchEnd) {
        smallestTimeDiff = timeDiff;
        bestMatch = session;
      }
    }

    return bestMatch ? bestMatch.uuid : null;
  } catch (error) {
    console.error('Error finding LessonSpace session:', error);
    return null;
  }
}

async function getRecordingUrl(sessionId: string): Promise<string | null> {
  try {
    const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY');
    if (!lessonSpaceApiKey) {
      console.error('LessonSpace API key not configured');
      return null;
    }

    const response = await fetch(`https://api.thelessonspace.com/v2/sessions/${sessionId}/recording`, {
      method: 'GET',
      headers: {
        'Authorization': `Organisation ${lessonSpaceApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`LessonSpace recording API error: ${response.status}`);
      return null;
    }

    const recordingData = await response.json();
    return recordingData.url || recordingData.recording_url || null;
  } catch (error) {
    console.error('Error getting recording URL:', error);
    return null;
  }
}

async function ensureTranscription(supabaseClient: any, lessonId: string, sessionId: string): Promise<boolean> {
  try {
    // Check if transcription already exists
    const { data: existingTranscription } = await supabaseClient
      .from('lesson_transcriptions')
      .select('id, transcription_status')
      .eq('lesson_id', lessonId)
      .single();

    if (existingTranscription && existingTranscription.transcription_status === 'completed') {
      return false; // Already exists
    }

    // Call the generate-lesson-summaries function to get transcription
    const { data, error } = await supabaseClient.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'get-transcription',
        lessonId: lessonId
      }
    });

    if (error) {
      console.error('Error getting transcription:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error ensuring transcription:', error);
    return false;
  }
}

async function ensureSummaries(supabaseClient: any, lessonId: string): Promise<boolean> {
  try {
    // Check if transcription exists and is completed
    const { data: transcription } = await supabaseClient
      .from('lesson_transcriptions')
      .select('id, transcription_status')
      .eq('lesson_id', lessonId)
      .eq('transcription_status', 'completed')
      .single();

    if (!transcription) {
      return false; // No completed transcription
    }

    // Check if summaries already exist
    const { data: existingSummaries } = await supabaseClient
      .from('lesson_student_summaries')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('transcription_id', transcription.id);

    if (existingSummaries && existingSummaries.length > 0) {
      return false; // Summaries already exist
    }

    // Call the generate-lesson-summaries function to generate summaries
    const { data, error } = await supabaseClient.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'generate-summaries',
        lessonId: lessonId,
        transcriptionId: transcription.id
      }
    });

    if (error) {
      console.error('Error generating summaries:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error ensuring summaries:', error);
    return false;
  }
}