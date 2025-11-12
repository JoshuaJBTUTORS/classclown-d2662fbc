
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize the Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, 
  { 
    auth: {
      autoRefreshToken: false,
      persistSession: false
    } 
  }
);

// Helper function to refresh token if expired
async function getValidAccessToken(organizationId) {
  // Get credentials from database
  const { data: credentialsData, error: credentialsError } = await supabase
    .from('google_calendar_credentials')
    .select('*')
    .eq('organization_id', organizationId)
    .single();
    
  if (credentialsError || !credentialsData) {
    throw new Error("No Google Calendar credentials found");
  }
  
  const credentials = credentialsData;
  
  // Check if token is expired
  if (credentials.expiry_date < Math.floor(Date.now() / 1000)) {
    console.log("Token expired, refreshing...");
    const refreshTokenRequestBody = new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
      refresh_token: credentials.refresh_token,
      grant_type: "refresh_token"
    });
    
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: refreshTokenRequestBody.toString()
    });
    
    const refreshData = await refreshResponse.json();
    
    if (refreshData.error) {
      throw new Error(`Token refresh error: ${refreshData.error}`);
    }
    
    // Update credentials in database
    const updatedCredentials = {
      access_token: refreshData.access_token,
      token_type: refreshData.token_type || credentials.token_type,
      scope: refreshData.scope || credentials.scope,
      expiry_date: Math.floor(Date.now() / 1000) + refreshData.expires_in
    };
    
    await supabase
      .from('google_calendar_credentials')
      .update(updatedCredentials)
      .eq('organization_id', organizationId);
    
    return refreshData.access_token;
  }
  
  return credentials.access_token;
}

// Helper to get organization calendar ID
async function getCalendarId(organizationId) {
  const { data, error } = await supabase
    .from('organizations')
    .select('google_calendar_id')
    .eq('id', organizationId)
    .single();
    
  if (error || !data || !data.google_calendar_id) {
    throw new Error("No Google Calendar ID found for organization");
  }
  
  return data.google_calendar_id;
}

// Helper to convert a lesson to Google Calendar event format
function lessonToCalendarEvent(lesson) {
  // Get student names for description
  let studentNames = "";
  if (lesson.students && lesson.students.length > 0) {
    studentNames = "Students: " + lesson.students
      .map(s => `${s.first_name} ${s.last_name}`)
      .join(", ");
  }
  
  // Build description with lesson details and student info
  const description = `
${lesson.description || ""}

${studentNames}

Tutor: ${lesson.tutor?.first_name || ""} ${lesson.tutor?.last_name || ""}
Status: ${lesson.status}
  `.trim();
  
  // Determine color based on lesson status
  // Google Calendar uses numbers 1-11 for event colors
  let colorId = "1"; // Blue by default
  
  if (lesson.status === "completed") {
    colorId = "2"; // Green
  } else if (lesson.status === "cancelled") {
    colorId = "4"; // Red
  }
  
  const event = {
    summary: lesson.title,
    description,
    start: {
      dateTime: lesson.start_time,
      timeZone: "UTC"
    },
    end: {
      dateTime: lesson.end_time,
      timeZone: "UTC"
    },
    colorId,
    // Add video conferencing if it's a Google Meet integration
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    }
  };
  
  return event;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    
    // Validate the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    
    // Parse the request
    const { operation, lessonId, organizationId } = await req.json();
    
    if (!operation || !organizationId) {
      throw new Error("Missing required parameters");
    }
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(organizationId);
    const calendarId = await getCalendarId(organizationId);
    
    let response;
    
    switch (operation) {
      case "create": {
        // Get the lesson data
        if (!lessonId) {
          throw new Error("Lesson ID is required for create operation");
        }
        
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            tutor:tutors(id, first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name)
            )
          `)
          .eq('id', lessonId)
          .single();
          
        if (lessonError || !lesson) {
          throw new Error(`Error fetching lesson: ${lessonError?.message || "Lesson not found"}`);
        }
        
        // Process lesson_students to get proper student array format
        const students = lesson.lesson_students?.map(ls => ls.student) || [];
        const processedLesson = {
          ...lesson,
          students,
          lesson_students: undefined
        };
        
        // Convert lesson to calendar event
        const event = lessonToCalendarEvent(processedLesson);
        
        // Create the event in Google Calendar
        const createResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(`Failed to create Google Calendar event: ${JSON.stringify(errorData)}`);
        }
        
        const eventData = await createResponse.json();
        
        // Update lesson with Google event ID and conference link
        await supabase
          .from('lessons')
          .update({
            google_event_id: eventData.id,
            video_conference_link: eventData.hangoutLink || null,
            video_conference_provider: eventData.hangoutLink ? 'google_meet' : null
          })
          .eq('id', lessonId);
        
        response = { success: true, eventData };
        break;
      }
      
      case "update": {
        // Get the lesson data
        if (!lessonId) {
          throw new Error("Lesson ID is required for update operation");
        }
        
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            tutor:tutors(id, first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name)
            )
          `)
          .eq('id', lessonId)
          .single();
          
        if (lessonError || !lesson) {
          throw new Error(`Error fetching lesson: ${lessonError?.message || "Lesson not found"}`);
        }
        
        // If there's no Google event ID yet, create a new event
        if (!lesson.google_event_id) {
          const createRequest = {
            operation: "create",
            lessonId,
            organizationId
          };
          
          const createResponse = await fetch(req.url, {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(createRequest)
          });
          
          response = await createResponse.json();
          break;
        }
        
        // Process lesson_students to get proper student array format
        const students = lesson.lesson_students?.map(ls => ls.student) || [];
        const processedLesson = {
          ...lesson,
          students,
          lesson_students: undefined
        };
        
        // Convert lesson to calendar event
        const event = lessonToCalendarEvent(processedLesson);
        
        // Update the event in Google Calendar
        const updateResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(lesson.google_event_id)}?conferenceDataVersion=1`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to update Google Calendar event: ${JSON.stringify(errorData)}`);
        }
        
        const eventData = await updateResponse.json();
        
        // Update lesson with conference link (in case it changed)
        await supabase
          .from('lessons')
          .update({
            video_conference_link: eventData.hangoutLink || null,
            video_conference_provider: eventData.hangoutLink ? 'google_meet' : null
          })
          .eq('id', lessonId);
        
        response = { success: true, eventData };
        break;
      }
      
      case "delete": {
        // Get the lesson data for its Google event ID
        if (!lessonId) {
          throw new Error("Lesson ID is required for delete operation");
        }
        
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('google_event_id')
          .eq('id', lessonId)
          .single();
          
        if (lessonError || !lesson) {
          throw new Error(`Error fetching lesson: ${lessonError?.message || "Lesson not found"}`);
        }
        
        // If there's no Google event ID, nothing to delete
        if (!lesson.google_event_id) {
          response = { success: true, message: "No Google Calendar event to delete" };
          break;
        }
        
        // Delete the event from Google Calendar
        const deleteResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(lesson.google_event_id)}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });
        
        if (!deleteResponse.ok && deleteResponse.status !== 410) {
          // 410 means the resource is already gone, which is fine
          const errorText = await deleteResponse.text();
          throw new Error(`Failed to delete Google Calendar event: ${errorText}`);
        }
        
        // Clear Google event ID and video conference link from lesson
        await supabase
          .from('lessons')
          .update({
            google_event_id: null,
            video_conference_link: null,
            video_conference_provider: null
          })
          .eq('id', lessonId);
        
        response = { success: true };
        break;
      }
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
