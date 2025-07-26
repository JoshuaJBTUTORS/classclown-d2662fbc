
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateRoomRequest {
  lessonId: string;
  title: string;
  startTime: string;
  duration?: number;
}

interface UpdateLessonRequest {
  lessonId: string;
  roomId?: string;
  roomUrl?: string;
  provider?: string;
}

interface JoinSpaceRequest {
  lessonId: string;
  studentId: number;
  studentName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, ...requestData } = await req.json();

    switch (action) {
      case "create-room":
        return await createLessonSpaceRoom(requestData as CreateRoomRequest, supabase);
      case "join-space":
        return await joinLessonSpace(requestData as JoinSpaceRequest, supabase);
      case "update-lesson":
        return await updateLessonWithRoom(requestData as UpdateLessonRequest, supabase);
      case "delete-room":
        return await deleteLessonSpaceRoom(requestData.roomId, supabase);
      case "get-transcription":
        return await getTranscription(requestData.lessonId, supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in lesson-space-integration function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateSpaceId(lesson: any): string {
  if (lesson.is_group) {
    // For group lessons: group_{lesson_id}_t{tutor_id}
    const lessonIdShort = lesson.id.substring(0, 8);
    const tutorIdShort = lesson.tutor_id.substring(0, 8);
    return `group_${lessonIdShort}_t${tutorIdShort}`;
  } else {
    // For individual lessons: t{tutor_id}_s{student_id}
    const tutorIdShort = lesson.tutor_id.substring(0, 8);
    const studentId = lesson.lesson_students?.[0]?.student?.id;
    if (!studentId) {
      throw new Error("No student found for individual lesson");
    }
    return `t${tutorIdShort}_s${studentId}`;
  }
}

async function createLessonSpaceRoom(data: CreateRoomRequest, supabase: any) {
  const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY') || "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
  try {
    console.log("Creating Lesson Space room for lesson:", data.lessonId);
    
    // Get lesson details to determine if it's a group lesson and get tutor info
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        *,
        tutor:tutors(id, first_name, last_name, email),
        lesson_students(
          id,
          student:students(id, first_name, last_name, email)
        )
      `)
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Failed to fetch lesson details: ${lessonError?.message}`);
    }

    if (!lesson.lesson_students || lesson.lesson_students.length === 0) {
      throw new Error("No students found for this lesson");
    }

    // Generate space ID based on new logic
    const spaceId = generateSpaceId(lesson);
    console.log("Generated space ID:", spaceId);

    // Create request body for LessonSpace API
    const requestBody = {
      id: spaceId,
      transcribe: true,
      record_av: true,
      user: {
        id: `tutor_${lesson.tutor.id}`,
        name: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`,
        role: "teacher",
        leader: true, // TUTOR IS LEADER
        custom_jwt_parameters: {
          meta: {
            displayName: `${lesson.tutor.first_name} ${lesson.tutor.last_name}`
          }
        }
      },
      features: {
        invite: true
      },
      invite_url: `https://www.thelessonspace.com/space/${spaceId}`
    };

    console.log("=== LESSONSPACE API REQUEST ===");
    console.log("URL: https://api.thelessonspace.com/v2/spaces/launch/");
    console.log("API Key:", lessonSpaceApiKey);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    console.log("================================");

    // Create space with teacher as leader using the Launch endpoint
    const spaceResponse = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("=== LESSONSPACE API RESPONSE ===");
    console.log("Response Status:", spaceResponse.status);
    console.log("Response Status Text:", spaceResponse.statusText);
    console.log("Response Headers:", Object.fromEntries(spaceResponse.headers));
    console.log("==================================");

    if (!spaceResponse.ok) {
      const errorText = await spaceResponse.text();
      console.error("=== API ERROR RESPONSE ===");
      console.error("Status:", spaceResponse.status);
      console.error("Error Text:", errorText);
      console.error("========================");
      throw new Error(`Failed to create space for teacher: ${spaceResponse.status} ${errorText}`);
    }

    const spaceData = await spaceResponse.json();
    console.log("=== SUCCESSFUL API RESPONSE DATA ===");
    console.log("Full Response:", JSON.stringify(spaceData, null, 2));
    console.log("Room Settings:", spaceData.room_settings ? JSON.stringify(spaceData.room_settings, null, 2) : "Not present");
    console.log("Transcribe Setting:", spaceData.room_settings?.transcribe || "Not found");
    console.log("Record AV Setting:", spaceData.room_settings?.record_av || "Not found");
    console.log("Client URL Features:", spaceData.client_url ? "URL contains features" : "No client URL");
    console.log("===================================");

    // Update the lesson with room details including session_id
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: spaceData.room_id,
        lesson_space_room_url: spaceData.client_url, // Teacher's authenticated URL
        lesson_space_space_id: spaceId, // Store the space ID for student joins
        lesson_space_session_id: spaceData.session_id, // Store session ID for transcription
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("Error updating lesson with room data:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        roomId: spaceData.room_id,
        roomUrl: spaceData.client_url, // Teacher's authenticated URL
        teacherUrl: spaceData.client_url,
        spaceId: spaceId,
        sessionId: spaceData.session_id,
        studentInviteUrl: `https://www.thelessonspace.com/space/${spaceId}`, // Simple invite URL for students
        message: "Teacher space created successfully. Students can join via simple invite URL."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Lesson Space room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function joinLessonSpace(data: JoinSpaceRequest, supabase: any) {
  try {
    console.log("Student joining lesson space:", data);
    
    // Get lesson details including the space ID
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("lesson_space_space_id, title")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error(`Failed to fetch lesson details: ${lessonError?.message}`);
    }

    if (!lesson.lesson_space_space_id) {
      throw new Error("No lesson space found for this lesson");
    }

    // Return the simple invite URL for students
    const studentUrl = `https://www.thelessonspace.com/space/${lesson.lesson_space_space_id}`;
    console.log(`Generated simple invite URL for student ${data.studentId}:`, studentUrl);

    return new Response(
      JSON.stringify({
        success: true,
        studentUrl: studentUrl,
        spaceId: lesson.lesson_space_space_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error joining lesson space:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function updateLessonWithRoom(data: UpdateLessonRequest, supabase: any) {
  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: data.roomId,
        lesson_space_room_url: data.roomUrl,
        lesson_space_space_id: data.provider
      })
      .eq("id", data.lessonId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating lesson:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function deleteLessonSpaceRoom(roomId: string, supabase: any) {
  try {
    console.log("Deleting Lesson Space room:", roomId);
    
    console.log("Lesson Space spaces are persistent - clearing lesson references only");

    const { data: lessonData, error: lessonFetchError } = await supabase
      .from("lessons")
      .select("id")
      .eq("lesson_space_room_id", roomId)
      .single();

    if (lessonFetchError) {
      console.warn("Could not fetch lesson for room deletion:", lessonFetchError);
    }

    const { error: lessonError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: null,
        lesson_space_room_url: null,
        lesson_space_space_id: null
      })
      .eq("lesson_space_room_id", roomId);

    if (lessonError) throw lessonError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function getTranscription(lessonId: string, supabase: any) {
  try {
    // Redirect to the dedicated transcription function
    const response = await supabase.functions.invoke('generate-lesson-summaries', {
      body: {
        action: 'get-transcription',
        lessonId: lessonId
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return new Response(
      JSON.stringify(response.data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting transcription:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
