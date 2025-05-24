
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

async function createLessonSpaceRoom(data: CreateRoomRequest, supabase: any) {
  const lessonSpaceApiKey = "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
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

    // Generate space ID based on lesson type (ensuring it's under 64 characters)
    let spaceId: string;
    if (lesson.is_group) {
      spaceId = `group_${data.lessonId.substring(0, 30)}`;
    } else {
      const studentId = lesson.lesson_students[0]?.student?.id;
      if (!studentId) {
        throw new Error("No student found for individual lesson");
      }
      spaceId = `t${lesson.tutor_id.substring(0, 8)}_s${studentId}`;
    }

    console.log("Generated space ID:", spaceId);

    // Create space with teacher as leader using the Launch endpoint
    console.log("Creating teacher space with API key:", lessonSpaceApiKey);
    const spaceResponse = await fetch("https://api.thelessonspace.com/v2/spaces/launch/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: spaceId,
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
      }),
    });

    if (!spaceResponse.ok) {
      const errorText = await spaceResponse.text();
      console.error("Lesson Space API error for teacher:", spaceResponse.status, errorText);
      throw new Error(`Failed to create space for teacher: ${spaceResponse.status} ${errorText}`);
    }

    const spaceData = await spaceResponse.json();
    console.log("Created/Retrieved Lesson Space for teacher:", spaceData);

    // Update the lesson with room details (teacher URL only)
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: spaceData.room_id,
        lesson_space_room_url: spaceData.client_url, // Teacher's authenticated URL
        lesson_space_space_id: spaceId, // Store the space ID for student joins
        video_conference_provider: "lesson_space",
        video_conference_link: spaceData.client_url
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
        video_conference_provider: data.provider || "lesson_space",
        video_conference_link: data.roomUrl
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
        lesson_space_space_id: null,
        video_conference_provider: null,
        video_conference_link: null
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
