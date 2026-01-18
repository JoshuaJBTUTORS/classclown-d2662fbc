import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORGANIZATION_ID = "a0000000-0000-0000-0000-000000000001"; // JB Tutors
const BATCH_SIZE = 50; // Process 50 lessons per batch
const DELAY_BETWEEN_REQUESTS_MS = 200; // 200ms delay to respect rate limits

// Utility function to add delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MigrationRequest {
  batchSize?: number;
  dryRun?: boolean;
  startFromId?: string;
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
    throw new Error(`No Google Calendar credentials found: ${error?.message}`);
  }

  const now = Date.now();
  const expiryTime = credentials.expiry_date || 0;

  if (expiryTime - now < 5 * 60 * 1000) {
    console.log("Refreshing access token...");

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

// Get or ensure calendar ID exists
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

  await supabase
    .from("google_calendar_credentials")
    .update({ calendar_id: calendarId })
    .eq("organization_id", organizationId);

  return calendarId;
}

// Create a single calendar event
async function createCalendarEvent(
  lesson: any,
  calendarId: string,
  accessToken: string,
  tutorEmail: string | null,
  studentEmails: string[]
): Promise<{ eventId: string; meetLink: string } | null> {
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
        requestId: `migrate-${lesson.id}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    attendees: attendees.length > 0 ? attendees : undefined,
    guestsCanModify: false,
    guestsCanInviteOthers: false,
  };

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
    console.error(`Failed to create event for lesson ${lesson.id}: ${errorText}`);
    return null;
  }

  const event = await response.json();
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === "video"
  )?.uri;

  if (!meetLink) {
    console.error(`No Meet link generated for lesson ${lesson.id}`);
    return null;
  }

  return { eventId: event.id, meetLink };
}

serve(async (req) => {
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

    const body: MigrationRequest = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || BATCH_SIZE, 100);
    const dryRun = body.dryRun || false;

    console.log(`Starting Google Meet migration (batchSize: ${batchSize}, dryRun: ${dryRun})`);

    // Find lessons that need migration:
    // - Status is 'scheduled'
    // - Start time is in the future
    // - No video_conference_link OR no google_event_id
    const now = new Date().toISOString();
    
    let query = supabase
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
      .eq("status", "scheduled")
      .gte("start_time", now)
      .or("video_conference_link.is.null,google_event_id.is.null")
      .order("start_time", { ascending: true })
      .limit(batchSize);

    if (body.startFromId) {
      query = query.gt("id", body.startFromId);
    }

    const { data: lessons, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch lessons: ${fetchError.message}`);
    }

    if (!lessons || lessons.length === 0) {
      console.log("No lessons found needing migration");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No lessons need migration",
          processed: 0,
          remaining: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${lessons.length} lessons to migrate`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          lessonsToMigrate: lessons.length,
          sampleLessons: lessons.slice(0, 5).map((l) => ({
            id: l.id,
            title: l.title,
            start_time: l.start_time,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token and calendar ID
    const accessToken = await getValidAccessToken(supabase, ORGANIZATION_ID);
    const calendarId = await ensureCalendarId(supabase, ORGANIZATION_ID, accessToken);

    // Pre-fetch all tutor and student emails for this batch
    const tutorIds = [...new Set(lessons.map((l) => l.tutor_id).filter(Boolean))];
    const lessonIds = lessons.map((l) => l.id);

    const { data: tutors } = await supabase
      .from("tutors")
      .select("id, email")
      .in("id", tutorIds);

    const tutorEmailMap = new Map(tutors?.map((t: any) => [t.id, t.email]) || []);

    const { data: lessonStudents } = await supabase
      .from("lesson_students")
      .select(`
        lesson_id,
        student:students(email)
      `)
      .in("lesson_id", lessonIds);

    const studentEmailsMap = new Map<string, string[]>();
    for (const ls of lessonStudents || []) {
      const emails = studentEmailsMap.get(ls.lesson_id) || [];
      if (ls.student?.email) {
        emails.push(ls.student.email);
      }
      studentEmailsMap.set(ls.lesson_id, emails);
    }

    // Process lessons
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as { lessonId: string; error: string }[],
    };

    for (const lesson of lessons) {
      try {
        // Skip if already has valid Meet link
        if (lesson.video_conference_link && lesson.google_event_id) {
          results.skipped++;
          continue;
        }

        const tutorEmail = tutorEmailMap.get(lesson.tutor_id) || null;
        const studentEmails = studentEmailsMap.get(lesson.id) || [];

        const result = await createCalendarEvent(
          lesson,
          calendarId,
          accessToken,
          tutorEmail,
          studentEmails
        );

        if (result) {
          // Update lesson with Meet link
          const { error: updateError } = await supabase
            .from("lessons")
            .update({
              google_event_id: result.eventId,
              video_conference_link: result.meetLink,
              video_conference_provider: "google_meet",
            })
            .eq("id", lesson.id);

          if (updateError) {
            console.error(`Failed to update lesson ${lesson.id}: ${updateError.message}`);
            results.errors.push({ lessonId: lesson.id, error: updateError.message });
            results.failed++;
          } else {
            console.log(`✅ Migrated lesson ${lesson.id}: ${result.meetLink}`);
            results.success++;
          }
        } else {
          results.failed++;
          results.errors.push({ lessonId: lesson.id, error: "Failed to create calendar event" });
        }

        // Rate limiting
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
      } catch (error) {
        console.error(`Error processing lesson ${lesson.id}:`, error);
        results.failed++;
        results.errors.push({ lessonId: lesson.id, error: error.message });
      }
    }

    // Check remaining lessons
    const { count: remainingCount } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("start_time", now)
      .or("video_conference_link.is.null,google_event_id.is.null");

    console.log(`Migration batch complete: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);
    console.log(`Remaining lessons to migrate: ${remainingCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: lessons.length,
        results,
        remaining: remainingCount || 0,
        lastProcessedId: lessons[lessons.length - 1]?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
