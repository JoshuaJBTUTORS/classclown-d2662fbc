import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORGANIZATION_ID = "a0000000-0000-0000-0000-000000000001"; // JB Tutors

interface GoogleCalendarEventRequest {
  lessonId: string;
  organizationId?: string;
}

// Get a valid access token, refreshing if necessary
async function getValidAccessToken(
  supabase: any,
  organizationId: string
): Promise<string> {
  const { data: credentials, error } = await supabase
    .from("google_calendar_credentials")
    .select("*")
    .eq("organization_id", organizationId)
    .single();

  if (error || !credentials) {
    throw new Error(`No Google Calendar credentials found for organization: ${error?.message}`);
  }

  const now = Date.now();
  const expiryTime = credentials.expiry_date || 0;

  // If token expires in less than 5 minutes, refresh it
  if (expiryTime - now < 5 * 60 * 1000) {
    console.log("Access token expired or expiring soon, refreshing...");

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: credentials.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const tokens = await refreshResponse.json();

    // Update stored credentials
    await supabase
      .from("google_calendar_credentials")
      .update({
        access_token: tokens.access_token,
        expiry_date: Date.now() + tokens.expires_in * 1000,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId);

    return tokens.access_token;
  }

  return credentials.access_token;
}

// Get or create the calendar ID
async function ensureCalendarId(
  supabase: any,
  organizationId: string,
  accessToken: string
): Promise<string> {
  const { data: credentials } = await supabase
    .from("google_calendar_credentials")
    .select("calendar_id")
    .eq("organization_id", organizationId)
    .single();

  if (credentials?.calendar_id) {
    return credentials.calendar_id;
  }

  // Create a new calendar for lessons
  const createResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "JB Tutors Lessons",
        description: "Tutoring lesson calendar managed by JB Tutors platform",
        timeZone: "Europe/London",
      }),
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create calendar: ${errorText}`);
  }

  const newCalendar = await createResponse.json();
  const calendarId = newCalendar.id;

  // Save the calendar ID
  await supabase
    .from("google_calendar_credentials")
    .update({ calendar_id: calendarId })
    .eq("organization_id", organizationId);

  console.log(`Created new calendar with ID: ${calendarId}`);
  return calendarId;
}

// Create a Google Calendar event with Meet link
async function createCalendarEvent(
  lesson: any,
  calendarId: string,
  accessToken: string,
  tutorEmail: string | null,
  studentEmails: string[]
): Promise<{ eventId: string; meetLink: string }> {
  // Build attendees list
  const attendees: { email: string; responseStatus?: string }[] = [];
  
  if (tutorEmail) {
    attendees.push({ email: tutorEmail, responseStatus: "accepted" });
  }
  
  for (const email of studentEmails) {
    if (email) {
      attendees.push({ email, responseStatus: "needsAction" });
    }
  }

  const eventBody = {
    summary: lesson.title || "Tutoring Session",
    description: lesson.description || `Tutoring lesson - ${lesson.subject || "General"}`,
    start: {
      dateTime: lesson.start_time,
      timeZone: "Europe/London",
    },
    end: {
      dateTime: lesson.end_time,
      timeZone: "Europe/London",
    },
    conferenceData: {
      createRequest: {
        requestId: `lesson-${lesson.id}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    attendees: attendees.length > 0 ? attendees : undefined,
    guestsCanModify: false,
    guestsCanInviteOthers: false,
  };

  console.log(`Creating calendar event for lesson ${lesson.id} with ${attendees.length} attendees`);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create calendar event: ${errorText}`);
  }

  const event = await response.json();
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === "video"
  )?.uri;

  if (!meetLink) {
    throw new Error("Calendar event created but no Meet link was generated");
  }

  console.log(`Created event ${event.id} with Meet link: ${meetLink}`);

  return {
    eventId: event.id,
    meetLink,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body: GoogleCalendarEventRequest = await req.json();
    const { lessonId, organizationId = ORGANIZATION_ID } = body;

    if (!lessonId) {
      return new Response(
        JSON.stringify({ success: false, error: "lessonId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Creating Google Calendar event for lesson: ${lessonId}`);

    // Fetch lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        id,
        title,
        description,
        subject,
        start_time,
        end_time,
        tutor_id,
        google_event_id,
        video_conference_link
      `)
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Lesson not found: ${lessonError?.message}`);
    }

    // Skip if already has a Google Meet link
    if (lesson.video_conference_link && lesson.google_event_id) {
      console.log(`Lesson ${lessonId} already has a Google Meet link, skipping`);
      return new Response(
        JSON.stringify({
          success: true,
          meetLink: lesson.video_conference_link,
          eventId: lesson.google_event_id,
          skipped: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tutor email
    let tutorEmail: string | null = null;
    if (lesson.tutor_id) {
      const { data: tutor } = await supabase
        .from("tutors")
        .select("email")
        .eq("id", lesson.tutor_id)
        .single();
      tutorEmail = tutor?.email || null;
    }

    // Get student emails
    const studentEmails: string[] = [];
    const { data: lessonStudents } = await supabase
      .from("lesson_students")
      .select(`
        student:students(email)
      `)
      .eq("lesson_id", lessonId);

    if (lessonStudents) {
      for (const ls of lessonStudents) {
        if (ls.student?.email) {
          studentEmails.push(ls.student.email);
        }
      }
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, organizationId);

    // Ensure we have a calendar ID
    const calendarId = await ensureCalendarId(supabase, organizationId, accessToken);

    // Create the calendar event with Meet link
    const { eventId, meetLink } = await createCalendarEvent(
      lesson,
      calendarId,
      accessToken,
      tutorEmail,
      studentEmails
    );

    // Update the lesson with the Meet link and event ID
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        google_event_id: eventId,
        video_conference_link: meetLink,
        video_conference_provider: "google_meet",
      })
      .eq("id", lessonId);

    if (updateError) {
      console.error(`Failed to update lesson with Meet link: ${updateError.message}`);
      // Don't throw - the event was created successfully
    }

    console.log(`✅ Successfully created Google Meet for lesson ${lessonId}: ${meetLink}`);

    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        eventId,
        tutorEmail,
        studentEmails,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
