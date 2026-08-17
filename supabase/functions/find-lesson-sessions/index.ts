import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    
    const { action, lesson_ids, processing_date, force } = await req.json();
    
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
        // Skip if session ID already exists (unless the caller forces re-selection)
        if (lesson.lesson_space_session_id && !force) {
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
        result.error = (error as Error).message;
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
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function sessionUuid(session: any): string | null {
  return session?.uuid ?? session?.session_id ?? (typeof session?.id === "string" ? session.id : null);
}

function sessionStart(session: any): number {
  const raw =
    session?.start ??
    session?.started_at ??
    session?.start_time ??
    session?.created_at ??
    session?.summary?.start;
  const ts = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(ts) ? 0 : ts;
}

/** Number of distinct participants the API reports for a session (0 when unknown). */
function sessionParticipantCount(session: any): number {
  const candidates = [
    session?.participants,
    session?.users,
    session?.attendees,
    session?.summary?.participants,
    session?.summary?.users,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      const ids = new Set(
        c.map((u: any) => u?.id ?? u?.user_id ?? u?.external_id ?? u?.name ?? JSON.stringify(u)),
      );
      return ids.size;
    }
    if (typeof c === "number") return c;
  }
  for (const key of ["participant_count", "num_participants", "user_count"]) {
    if (typeof session?.[key] === "number") return session[key];
  }
  return 0;
}

/** Fallback: count distinct participants we logged ourselves via the webhook. */
async function participantsFromEvents(sessionId: string): Promise<number> {
  const { data } = await supabase
    .from("lesson_participant_events")
    .select("participant_external_id, participant_name, participant_role")
    .eq("session_id", sessionId)
    .limit(200);
  if (!data?.length) return 0;
  const ids = new Set(
    data.map((e: any) => e.participant_external_id ?? e.participant_name ?? e.participant_role ?? "unknown"),
  );
  return ids.size;
}

/**
 * Pick the right LessonSpace session for a lesson.
 *
 * Rooms are reused per tutor+student pair across every week, so the room's
 * session list spans months. Selection rules:
 *   1. drop solo sessions (only one participant never yields a transcript)
 *   2. drop sessions that started after this lesson ended
 *   3. sort by start date, newest first, and take the most recent
 */
async function findLessonSpaceSession(lesson: any): Promise<string | null> {
  if (!lesson.lesson_space_room_id) {
    return null;
  }

  try {
    console.log(`Searching sessions for room: ${lesson.lesson_space_room_id} at time: ${lesson.start_time}`);

    const apiUrl = `https://api.thelessonspace.com/v2/organisations/20704/sessions/?space=${lesson.lesson_space_room_id}`;

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
    const sessions: any[] = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
    console.log(`Room ${lesson.lesson_space_room_id} returned ${sessions.length} sessions`);
    if (sessions.length === 0) return null;

    // Never inherit a session that started after this lesson finished.
    const endCutoff = lesson.end_time ? Date.parse(lesson.end_time) : NaN;
    const cutoff = Number.isNaN(endCutoff) ? Infinity : endCutoff + 60 * 60 * 1000; // 1h grace for overruns

    const candidates = sessions
      .map((s) => ({ s, uuid: sessionUuid(s), start: sessionStart(s) }))
      .filter((c) => !!c.uuid)
      .filter((c) => c.start === 0 || c.start <= cutoff)
      .sort((a, b) => b.start - a.start); // most recent first

    for (const c of candidates) {
      let people = sessionParticipantCount(c.s);
      if (people === 0) people = await participantsFromEvents(c.uuid as string);
      if (people > 1) {
        console.log(
          `Selected session ${c.uuid} (start=${c.start ? new Date(c.start).toISOString() : "unknown"}, participants=${people}) for lesson ${lesson.id}`,
        );
        return c.uuid as string;
      }
      console.log(`Skipping solo/unknown-attendance session ${c.uuid} (participants=${people})`);
    }

    console.log(`No multi-participant session found for lesson ${lesson.id}`);
    return null;
  } catch (error) {
    console.error('Error finding LessonSpace session:', error);
    return null;
  }

}