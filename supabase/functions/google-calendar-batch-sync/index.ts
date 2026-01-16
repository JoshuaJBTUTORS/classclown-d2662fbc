import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getValidAccessToken(organizationId: string) {
  const { data: credentials, error } = await supabase
    .from('google_calendar_credentials')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error || !credentials) {
    throw new Error("No Google Calendar credentials found");
  }

  // Check if token is expired
  if (credentials.expiry_date < Math.floor(Date.now() / 1000)) {
    console.log("Token expired, refreshing...");
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: credentials.refresh_token,
        grant_type: "refresh_token"
      }).toString()
    });

    const refreshData = await refreshResponse.json();
    if (refreshData.error) {
      throw new Error(`Token refresh error: ${refreshData.error}`);
    }

    await supabase
      .from('google_calendar_credentials')
      .update({
        access_token: refreshData.access_token,
        expiry_date: Math.floor(Date.now() / 1000) + refreshData.expires_in
      })
      .eq('organization_id', organizationId);

    return refreshData.access_token;
  }

  return credentials.access_token;
}

async function ensureCalendarId(organizationId: string, accessToken: string) {
  const { data: org } = await supabase
    .from('organizations')
    .select('google_calendar_id')
    .eq('id', organizationId)
    .single();

  if (org?.google_calendar_id) {
    return org.google_calendar_id;
  }

  // Fetch primary calendar from Google
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = await response.json();
  let calendarId = "primary";

  if (data.items?.length > 0) {
    const primary = data.items.find((c: any) => c.primary);
    calendarId = primary?.id || data.items[0].id;
  }

  // Save to organization
  await supabase
    .from('organizations')
    .update({ google_calendar_id: calendarId })
    .eq('id', organizationId);

  // Also save to credentials
  await supabase
    .from('google_calendar_credentials')
    .update({ calendar_id: calendarId })
    .eq('organization_id', organizationId);

  return calendarId;
}

async function createCalendarEvent(lesson: any, calendarId: string, accessToken: string) {
  const event = {
    summary: lesson.title,
    description: lesson.description || `Lesson: ${lesson.title}`,
    start: { dateTime: lesson.start_time, timeZone: "UTC" },
    end: { dateTime: lesson.end_time, timeZone: "UTC" },
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create event: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, date, lessonIds } = await req.json();

    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    const accessToken = await getValidAccessToken(organizationId);
    const calendarId = await ensureCalendarId(organizationId, accessToken);

    // Build query for lessons
    let query = supabase
      .from('lessons')
      .select('id, title, description, start_time, end_time, google_event_id, video_conference_link')
      .is('video_conference_link', null);

    if (lessonIds?.length > 0) {
      query = query.in('id', lessonIds);
    } else if (date) {
      query = query.gte('start_time', `${date}T00:00:00Z`).lt('start_time', `${date}T23:59:59Z`);
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('start_time', `${today}T00:00:00Z`).lt('start_time', `${today}T23:59:59Z`);
    }

    const { data: lessons, error: lessonsError } = await query;

    if (lessonsError) {
      throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
    }

    console.log(`Found ${lessons?.length || 0} lessons to sync`);

    const results = [];
    const errors = [];

    for (const lesson of lessons || []) {
      try {
        // Skip if already has a Google event
        if (lesson.google_event_id) {
          results.push({ lessonId: lesson.id, status: 'skipped', reason: 'already has event' });
          continue;
        }

        const eventData = await createCalendarEvent(lesson, calendarId, accessToken);

        // Update lesson with Meet link
        await supabase
          .from('lessons')
          .update({
            google_event_id: eventData.id,
            video_conference_link: eventData.hangoutLink || null,
            video_conference_provider: eventData.hangoutLink ? 'google_meet' : null
          })
          .eq('id', lesson.id);

        results.push({
          lessonId: lesson.id,
          title: lesson.title,
          status: 'created',
          meetLink: eventData.hangoutLink
        });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing lesson ${lesson.id}:`, err);
        errors.push({ lessonId: lesson.id, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      calendarId,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
