import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";
import { toZonedTime } from 'https://esm.sh/date-fns-tz@3.2.0';

const UK_TIMEZONE = 'Europe/London';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionSearchResult {
  lesson_id: string;
  session_id: string | null;
  search_attempted: boolean;
  error?: string;
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
    console.log('Starting lesson session search...');
    
    const { action, lesson_ids, processing_date } = await req.json();
    
    if (action !== 'find_session_ids') {
      throw new Error('Invalid action. Expected: find_session_ids');
    }

    let lessons;
    
    if (lesson_ids) {
      // Search for specific lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          end_time,
          lesson_space_room_id,
          lesson_space_session_id
        `)
        .in('id', lesson_ids)
        .not('lesson_space_room_id', 'is', null);

      if (lessonsError) {
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }
      lessons = lessonsData;
    } else if (processing_date) {
      // Search for lessons from a specific date
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          end_time,
          lesson_space_room_id,
          lesson_space_session_id
        `)
        .gte('start_time', `${processing_date}T00:00:00.000Z`)
        .lt('start_time', `${processing_date}T23:59:59.999Z`)
        .not('lesson_space_room_id', 'is', null);

      if (lessonsError) {
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }
      lessons = lessonsData;
    } else {
      throw new Error('Either lesson_ids or processing_date must be provided');
    }

    console.log(`Found ${lessons?.length || 0} lessons to process`);

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No lessons found', 
          results: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SessionSearchResult[] = [];

    // Process each lesson to find session IDs
    for (const lesson of lessons) {
      console.log(`Processing lesson: ${lesson.title} (${lesson.id})`);

      const result: SessionSearchResult = {
        lesson_id: lesson.id,
        session_id: null,
        search_attempted: false
      };

      try {
        // Skip if session ID already exists
        if (lesson.lesson_space_session_id) {
          console.log(`Session ID already exists for lesson ${lesson.id}: ${lesson.lesson_space_session_id}`);
          result.session_id = lesson.lesson_space_session_id;
          result.search_attempted = false;
          results.push(result);
          continue;
        }

        // Find session using LessonSpace API
        const sessionId = await findLessonSpaceSession(lesson);
        result.search_attempted = true;
        
        if (sessionId) {
          console.log(`Found session ID: ${sessionId} for lesson ${lesson.id}`);
          
          // Update lesson with session ID
          const { error: updateError } = await supabase
            .from('lessons')
            .update({ lesson_space_session_id: sessionId })
            .eq('id', lesson.id);

          if (updateError) {
            console.error(`Failed to update lesson ${lesson.id}:`, updateError);
            result.error = `Failed to update lesson: ${updateError.message}`;
          } else {
            result.session_id = sessionId;
          }
        } else {
          console.log(`No session found for lesson ${lesson.id}`);
        }
      } catch (error) {
        console.error(`Error processing lesson ${lesson.id}:`, error);
        result.error = error.message;
        result.search_attempted = true;
      }

      results.push(result);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Session search completed');

    const successful = results.filter(r => r.session_id).length;
    const attempted = results.filter(r => r.search_attempted).length;

    return new Response(
      JSON.stringify({ 
        message: 'Session search completed', 
        results,
        summary: {
          total_lessons: lessons.length,
          searches_attempted: attempted,
          sessions_found: successful
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-lesson-sessions:', error);
    
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
    
    const apiUrl = `https://api.thelessonspace.com/v2/organisations/20704/sessions/?space=${lesson.lesson_space_room_id}`;
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
      // Just return the first session found
      const session = data.results[0];
      console.log(`Found session - ID: ${session.id}, UUID: ${session.uuid}`);
      return session.uuid;
    }
    
    console.log('No sessions found in the specified time range');
    return null;
  } catch (error) {
    console.error('Error finding LessonSpace session:', error);
    return null;
  }
}