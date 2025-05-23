
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
    
    // Create room in Lesson Space
    const roomResponse = await fetch("https://api.thelessonspace.com/v2/spaces/", {
      method: "POST",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.title,
        privacy: "organisation",
        // Add scheduled start time if provided
        ...(data.startTime && {
          scheduled_start: new Date(data.startTime).toISOString()
        }),
        // Add duration if provided (in minutes)
        ...(data.duration && {
          scheduled_duration: data.duration
        })
      }),
    });

    if (!roomResponse.ok) {
      const errorText = await roomResponse.text();
      console.error("Lesson Space API error:", errorText);
      throw new Error(`Failed to create room: ${roomResponse.status} ${errorText}`);
    }

    const roomData = await roomResponse.json();
    console.log("Created Lesson Space room:", roomData);

    // Update the lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: roomData.id,
        lesson_space_room_url: roomData.guest_url,
        video_conference_provider: "lesson_space",
        video_conference_link: roomData.guest_url
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("Error updating lesson with room data:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        roomId: roomData.id,
        roomUrl: roomData.guest_url,
        ownerUrl: roomData.owner_url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating Lesson Space room:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function deleteLessonSpaceRoom(roomId: string, supabase: any) {
  const lessonSpaceApiKey = "832a4e97-e402-4757-8ba3-a8afb14941b2";
  
  try {
    console.log("Deleting Lesson Space room:", roomId);
    
    // Delete room from Lesson Space
    const deleteResponse = await fetch(`https://api.thelessonspace.com/v2/spaces/${roomId}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Organisation ${lessonSpaceApiKey}`,
      },
    });

    if (!deleteResponse.ok) {
      console.error("Failed to delete room from Lesson Space:", deleteResponse.status);
    }

    // Update lesson to remove room details
    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_space_room_id: null,
        lesson_space_room_url: null,
        video_conference_provider: null,
        video_conference_link: null
      })
      .eq("lesson_space_room_id", roomId);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting room:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
