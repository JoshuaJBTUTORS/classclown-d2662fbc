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

    // Only process lessons that ended at least 3 hours ago (buffer to ensure
    // the session has truly finished on LessonSpace's side). We slice a 1-hour
    // window so each hourly run only picks up lessons that just crossed the
    // 3h mark — a lesson ending at 8pm is handled by the 11pm run and nothing
    // else. Idempotency checks below still make retries safe.
    const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const windowStart = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

    console.log(`Processing lessons that ended between ${windowStart} and ${cutoff}`);

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
      .lte('end_time', cutoff)
      .gte('end_time', windowStart)
      .neq('status', 'cancelled')
      .order('end_time', { ascending: false });

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
        
        // Use the dedicated find-lesson-sessions edge function
        const { data: sessionResult, error: sessionError } = await supabaseClient.functions.invoke('find-lesson-sessions', {
          body: {
            action: 'find_session_ids',
            lesson_ids: [lesson.id]
          }
        });
        
        if (sessionError) {
          console.error(`Error calling find-lesson-sessions for lesson ${lesson.id}:`, sessionError);
        } else if (sessionResult?.results && sessionResult.results.length > 0) {
          const result = sessionResult.results[0];
          if (result.session_id) {
            lesson.lesson_space_session_id = result.session_id;
            stats.sessions_discovered++;
            console.log(`Found and stored session ID: ${result.session_id}`);
          } else if (result.error) {
            console.log(`No session found for lesson ${lesson.id}: ${result.error}`);
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Fallback recording fetch — normally the recording.finish webhook
      // populates lesson_space_recording_url within minutes of the session ending.
      // Every lesson reaching this loop has already ended >=3h ago (query filter),
      // so if the URL is still missing, the webhook didn't deliver and we poll now.
      if (lesson.lesson_space_session_id && !lesson.lesson_space_recording_url) {
        console.log(`Fallback: getting recording for lesson ${lesson.id}`);

        const { data: recordingResult, error: recordingError } = await supabaseClient.functions.invoke('get-lessonspace-recording', {
          body: { sessionId: lesson.lesson_space_session_id }
        });

        if (recordingError) {
          console.error(`Error calling get-lessonspace-recording for lesson ${lesson.id}:`, recordingError);
        } else if (recordingResult?.url) {
          stats.recordings_stored++;
          console.log(`Recording URL stored for lesson ${lesson.id}`);
        }

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



async function ensureTranscription(supabaseClient: any, lessonId: string, sessionId: string): Promise<boolean> {
  try {
    // Check if transcription already exists and has text
    const { data: existingTranscription } = await supabaseClient
      .from('lesson_transcriptions')
      .select('id, transcription_status, transcription_text, transcription_url')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If we have a completed transcription with text, we're done
    if (existingTranscription && existingTranscription.transcription_status === 'completed' && existingTranscription.transcription_text) {
      return false; // Already exists
    }

    // If we have an available transcription with URL but no text, fetch the text
    if (existingTranscription && existingTranscription.transcription_status === 'available' && existingTranscription.transcription_url && !existingTranscription.transcription_text) {
      console.log(`Fetching transcription text from URL for lesson ${lessonId}`);
      
      try {
        const textResponse = await fetch(existingTranscription.transcription_url);
        if (textResponse.ok) {
          const transcriptionText = await textResponse.text();
          
          // Update the transcription with the text and mark as completed
          await supabaseClient
            .from('lesson_transcriptions')
            .update({ 
              transcription_text: transcriptionText,
              transcription_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTranscription.id);
          
          console.log(`Successfully fetched and stored transcription text for lesson ${lessonId}`);
          return true;
        } else {
          console.error(`Failed to fetch transcription text: ${textResponse.status}`);
        }
      } catch (fetchError) {
        console.error('Error fetching transcription text:', fetchError);
      }
    }

    // If no transcription exists or it's in processing state, call get-transcription
    if (!existingTranscription || existingTranscription.transcription_status === 'processing') {
      console.log(`Getting transcription for lesson ${lessonId}`);
      
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

      // Check if the result indicates success and transcription is now available
      if (data?.success || data?.transcription_status === 'available') {
        // Try to fetch the text if we got a URL
        const { data: updatedTranscription } = await supabaseClient
          .from('lesson_transcriptions')
          .select('id, transcription_url, transcription_text')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (updatedTranscription?.transcription_url && !updatedTranscription.transcription_text) {
          try {
            const textResponse = await fetch(updatedTranscription.transcription_url);
            if (textResponse.ok) {
              const transcriptionText = await textResponse.text();
              
              await supabaseClient
                .from('lesson_transcriptions')
                .update({ 
                  transcription_text: transcriptionText,
                  transcription_status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('id', updatedTranscription.id);
              
              console.log(`Successfully fetched and stored transcription text for lesson ${lessonId}`);
              return true;
            }
          } catch (fetchError) {
            console.error('Error fetching transcription text:', fetchError);
          }
        }
        
        return true;
      }
    }

    return false;
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