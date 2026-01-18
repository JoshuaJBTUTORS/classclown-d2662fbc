import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ORGANIZATION_ID = "a0000000-0000-0000-0000-000000000001"; // JB Tutors
const DELAY_BETWEEN_REQUESTS_MS = 200; // 200ms delay to respect rate limits

// Utility function to add delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface MigrationRequest {
  batchSize?: number;
  dryRun?: boolean;
  phase?: 'parents' | 'standalone' | 'all';
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

// Propagate Meet link from parent to all recurring instances
async function propagateMeetLinkToInstances(
  supabase: any,
  parentLessonId: string,
  meetLink: string,
  eventId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("lessons")
    .update({
      video_conference_link: meetLink,
      video_conference_provider: "google_meet",
      google_event_id: eventId,
    })
    .eq("parent_lesson_id", parentLessonId)
    .eq("status", "scheduled")
    .is("video_conference_link", null)
    .select("id");

  if (error) {
    console.error(`Failed to propagate Meet link to instances of ${parentLessonId}: ${error.message}`);
    return 0;
  }

  return data?.length || 0;
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
    const batchSize = Math.min(body.batchSize || 50, 100);
    const dryRun = body.dryRun || false;
    const phase = body.phase || 'all';

    console.log(`Starting OPTIMIZED Google Meet migration (batchSize: ${batchSize}, dryRun: ${dryRun}, phase: ${phase})`);

    const now = new Date().toISOString();
    
    const results = {
      parentsProcessed: 0,
      instancesPropagated: 0,
      standaloneProcessed: 0,
      failed: 0,
      errors: [] as { lessonId: string; error: string }[],
    };

    // Get access token and calendar ID upfront
    const accessToken = await getValidAccessToken(supabase, ORGANIZATION_ID);
    const calendarId = await ensureCalendarId(supabase, ORGANIZATION_ID, accessToken);

    // ============ PHASE 1: Process PARENT recurring lessons ============
    if (phase === 'all' || phase === 'parents') {
      console.log("\n📍 PHASE 1: Processing parent recurring lessons that have future instances...");
      
      // Find parent lessons that have future instances without Meet links
      // This catches parents even if their start_time is in the past
      const { data: parentsWithOrphanedInstances, error: orphanParentsError } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          description,
          subject,
          start_time,
          end_time,
          tutor_id,
          video_conference_link
        `)
        .eq("is_recurring", true)
        .eq("status", "scheduled")
        .is("video_conference_link", null)
        .order("start_time", { ascending: true })
        .limit(batchSize);

      // Also find parents by checking instances directly
      const { data: instanceParentIds, error: instanceError } = await supabase
        .from("lessons")
        .select("parent_lesson_id")
        .eq("is_recurring_instance", true)
        .eq("status", "scheduled")
        .gte("start_time", now)
        .is("video_conference_link", null)
        .not("parent_lesson_id", "is", null);

      // Get unique parent IDs that need Meet links
      const parentIdsFromInstances = [...new Set(instanceParentIds?.map(i => i.parent_lesson_id) || [])];
      
      // Fetch those parents that don't have Meet links
      let parentLessons: any[] = parentsWithOrphanedInstances || [];
      
      if (parentIdsFromInstances.length > 0) {
        const { data: additionalParents } = await supabase
          .from("lessons")
          .select(`
            id,
            title,
            description,
            subject,
            start_time,
            end_time,
            tutor_id,
            video_conference_link
          `)
          .in("id", parentIdsFromInstances.slice(0, batchSize))
          .is("video_conference_link", null);
        
        // Merge and deduplicate
        const existingIds = new Set(parentLessons.map(p => p.id));
        for (const parent of additionalParents || []) {
          if (!existingIds.has(parent.id)) {
            parentLessons.push(parent);
          }
        }
      }

      // Limit to batch size
      parentLessons = parentLessons.slice(0, batchSize);

      if (orphanParentsError || instanceError) {
        console.error("Error fetching parent lessons:", orphanParentsError || instanceError);
      }

      console.log(`Found ${parentLessons?.length || 0} parent recurring lessons needing Meet links`);

      if (parentLessons && parentLessons.length > 0 && !dryRun) {
        // Pre-fetch tutor emails
        const tutorIds = [...new Set(parentLessons.map((l) => l.tutor_id).filter(Boolean))];
        const { data: tutors } = await supabase
          .from("tutors")
          .select("id, email")
          .in("id", tutorIds);
        const tutorEmailMap = new Map(tutors?.map((t: any) => [t.id, t.email]) || []);

        // Pre-fetch student emails for parent lessons
        const parentIds = parentLessons.map((l) => l.id);
        const { data: lessonStudents } = await supabase
          .from("lesson_students")
          .select(`lesson_id, student:students(email)`)
          .in("lesson_id", parentIds);

        const studentEmailsMap = new Map<string, string[]>();
        for (const ls of lessonStudents || []) {
          const emails = studentEmailsMap.get(ls.lesson_id) || [];
          if (ls.student?.email) {
            emails.push(ls.student.email);
          }
          studentEmailsMap.set(ls.lesson_id, emails);
        }

        for (const lesson of parentLessons) {
          try {
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
              // Update parent with Meet link
              const { error: updateError } = await supabase
                .from("lessons")
                .update({
                  google_event_id: result.eventId,
                  video_conference_link: result.meetLink,
                  video_conference_provider: "google_meet",
                })
                .eq("id", lesson.id);

              if (updateError) {
                results.errors.push({ lessonId: lesson.id, error: updateError.message });
                results.failed++;
              } else {
                console.log(`✅ Parent ${lesson.id}: Meet link created`);
                results.parentsProcessed++;

                // Propagate to all child instances
                const propagatedCount = await propagateMeetLinkToInstances(
                  supabase,
                  lesson.id,
                  result.meetLink,
                  result.eventId
                );
                console.log(`   ↳ Propagated to ${propagatedCount} instances`);
                results.instancesPropagated += propagatedCount;
              }
            } else {
              results.failed++;
              results.errors.push({ lessonId: lesson.id, error: "Failed to create calendar event" });
            }

            await sleep(DELAY_BETWEEN_REQUESTS_MS);
          } catch (error) {
            console.error(`Error processing parent ${lesson.id}:`, error);
            results.failed++;
            results.errors.push({ lessonId: lesson.id, error: error.message });
          }
        }
      }
    }

    // ============ PHASE 2: Process orphaned instances (parent already has link) ============
    console.log("\n📍 PHASE 2: Propagating links to orphaned instances...");
    
    // Find instances where parent has a link but instance doesn't
    const { data: orphanedInstances, error: orphanedError } = await supabase
      .from("lessons")
      .select(`
        id,
        parent_lesson_id,
        parent:lessons!parent_lesson_id(
          video_conference_link,
          google_event_id,
          video_conference_provider
        )
      `)
      .eq("is_recurring_instance", true)
      .eq("status", "scheduled")
      .gte("start_time", now)
      .is("video_conference_link", null)
      .not("parent_lesson_id", "is", null)
      .limit(500);

    if (!orphanedError && orphanedInstances && orphanedInstances.length > 0 && !dryRun) {
      console.log(`Found ${orphanedInstances.length} orphaned instances to update`);
      
      for (const instance of orphanedInstances) {
        const parent = instance.parent as any;
        if (parent?.video_conference_link) {
          const { error: updateError } = await supabase
            .from("lessons")
            .update({
              video_conference_link: parent.video_conference_link,
              google_event_id: parent.google_event_id,
              video_conference_provider: parent.video_conference_provider || "google_meet",
            })
            .eq("id", instance.id);

          if (!updateError) {
            results.instancesPropagated++;
          }
        }
      }
      console.log(`Propagated ${results.instancesPropagated} orphaned instances`);
    }

    // ============ PHASE 3: Process STANDALONE lessons ============
    if (phase === 'all' || phase === 'standalone') {
      console.log("\n📍 PHASE 3: Processing standalone lessons...");
      
      // Find standalone lessons (not recurring parent, not instance) needing Meet links
      const { data: standaloneLessons, error: standaloneError } = await supabase
        .from("lessons")
        .select(`
          id,
          title,
          description,
          subject,
          start_time,
          end_time,
          tutor_id
        `)
        .eq("is_recurring", false)
        .is("parent_lesson_id", null)
        .eq("is_recurring_instance", false)
        .eq("status", "scheduled")
        .gte("start_time", now)
        .is("video_conference_link", null)
        .order("start_time", { ascending: true })
        .limit(batchSize);

      if (standaloneError) {
        throw new Error(`Failed to fetch standalone lessons: ${standaloneError.message}`);
      }

      console.log(`Found ${standaloneLessons?.length || 0} standalone lessons needing Meet links`);

      if (standaloneLessons && standaloneLessons.length > 0 && !dryRun) {
        // Pre-fetch tutor emails
        const tutorIds = [...new Set(standaloneLessons.map((l) => l.tutor_id).filter(Boolean))];
        const { data: tutors } = await supabase
          .from("tutors")
          .select("id, email")
          .in("id", tutorIds);
        const tutorEmailMap = new Map(tutors?.map((t: any) => [t.id, t.email]) || []);

        // Pre-fetch student emails
        const lessonIds = standaloneLessons.map((l) => l.id);
        const { data: lessonStudents } = await supabase
          .from("lesson_students")
          .select(`lesson_id, student:students(email)`)
          .in("lesson_id", lessonIds);

        const studentEmailsMap = new Map<string, string[]>();
        for (const ls of lessonStudents || []) {
          const emails = studentEmailsMap.get(ls.lesson_id) || [];
          if (ls.student?.email) {
            emails.push(ls.student.email);
          }
          studentEmailsMap.set(ls.lesson_id, emails);
        }

        for (const lesson of standaloneLessons) {
          try {
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
              const { error: updateError } = await supabase
                .from("lessons")
                .update({
                  google_event_id: result.eventId,
                  video_conference_link: result.meetLink,
                  video_conference_provider: "google_meet",
                })
                .eq("id", lesson.id);

              if (updateError) {
                results.errors.push({ lessonId: lesson.id, error: updateError.message });
                results.failed++;
              } else {
                console.log(`✅ Standalone ${lesson.id}: Meet link created`);
                results.standaloneProcessed++;
              }
            } else {
              results.failed++;
              results.errors.push({ lessonId: lesson.id, error: "Failed to create calendar event" });
            }

            await sleep(DELAY_BETWEEN_REQUESTS_MS);
          } catch (error) {
            console.error(`Error processing standalone ${lesson.id}:`, error);
            results.failed++;
            results.errors.push({ lessonId: lesson.id, error: error.message });
          }
        }
      }
    }

    // ============ Summary ============
    // Count remaining lessons needing migration
    const { count: remainingParents } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("is_recurring", true)
      .eq("status", "scheduled")
      .gte("start_time", now)
      .is("video_conference_link", null);

    const { count: remainingInstances } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("is_recurring_instance", true)
      .eq("status", "scheduled")
      .gte("start_time", now)
      .is("video_conference_link", null);

    const { count: remainingStandalone } = await supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("is_recurring", false)
      .is("parent_lesson_id", null)
      .eq("is_recurring_instance", false)
      .eq("status", "scheduled")
      .gte("start_time", now)
      .is("video_conference_link", null);

    console.log("\n📊 Migration Summary:");
    console.log(`   Parents processed: ${results.parentsProcessed}`);
    console.log(`   Instances propagated: ${results.instancesPropagated}`);
    console.log(`   Standalone processed: ${results.standaloneProcessed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Remaining parents: ${remainingParents || 0}`);
    console.log(`   Remaining instances: ${remainingInstances || 0}`);
    console.log(`   Remaining standalone: ${remainingStandalone || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        results,
        remaining: {
          parents: remainingParents || 0,
          instances: remainingInstances || 0,
          standalone: remainingStandalone || 0,
          total: (remainingParents || 0) + (remainingInstances || 0) + (remainingStandalone || 0),
        },
        googleApiCalls: results.parentsProcessed + results.standaloneProcessed,
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
