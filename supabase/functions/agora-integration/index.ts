
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateVideoRoomRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}

interface GetTokensRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}

// Netless service functions
async function createNetlessRoom(sdkToken: string) {
  console.log('Creating Netless room with SDK token');
  
  const response = await fetch('https://api.netless.link/v5/rooms', {
    method: 'POST',
    headers: {
      'token': sdkToken,
      'Content-Type': 'application/json',
      'region': 'us-sv'
    },
    body: JSON.stringify({
      isRecord: false
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create Netless room: ${response.statusText}`);
  }

  const roomData = await response.json();
  console.log('Netless room created:', roomData);
  
  return roomData.uuid;
}

async function generateNetlessRoomToken(sdkToken: string, roomUuid: string, role: 'admin' | 'writer' | 'reader' = 'admin') {
  console.log(`Generating Netless room token for room: ${roomUuid}, role: ${role}`);
  
  const response = await fetch(`https://api.netless.link/v5/tokens/rooms/${roomUuid}`, {
    method: 'POST',
    headers: {
      'token': sdkToken,
      'Content-Type': 'application/json',
      'region': 'us-sv'
    },
    body: JSON.stringify({
      lifespan: 3600000, // 1 hour
      role: role
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate room token: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Netless room token generated successfully');
  
  return result;
}

function parseNetlessSDKToken(sdkToken: string) {
  try {
    // The SDK token format: NETLESSSDK_<base64_encoded_data>
    const tokenData = sdkToken.replace('NETLESSSDK_', '');
    const decoded = atob(tokenData);
    
    // Parse the decoded token to extract app identifier
    const params = new URLSearchParams(decoded);
    const appIdentifier = params.get('ak');
    
    if (!appIdentifier) {
      throw new Error('Invalid SDK token format: missing app identifier');
    }
    
    return { appIdentifier };
  } catch (error) {
    console.error('Failed to parse Netless SDK token:', error);
    throw new Error('Invalid Netless SDK token format');
  }
}

serve(async (req) => {
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
        return await createVideoRoom(requestData as CreateVideoRoomRequest, supabase);
      case "get-tokens":
        return await getTokens(requestData as GetTokensRequest, supabase);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in agora-integration function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createVideoRoom(data: CreateVideoRoomRequest, supabase: any) {
  const appId = Deno.env.get("AGORA_APP_ID");
  const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  const netlessSDKToken = "NETLESSSDK_YWs9Uk5ZamRBRm9iWWhOS3U4eCZub25jZT0zNGRjOTUxMC00ZGViLTExZjAtYjdjZi1iMTBjNTEwODc0NTImcm9sZT0wJnNpZz1mMTAwNjM2ZWU4YmI0NTJkZTRkYTY2MDE5YWZhMDY4YThkNmE0M2YyMmQ2MDA5OTVmZDU4NTk0ZTY1YjNhOGM3";

  if (!appId || !appCertificate) {
    throw new Error("Agora credentials not configured");
  }

  try {
    console.log("Creating video room for lesson:", data.lessonId);

    // Generate unique channel name and UID
    const channelName = `lesson_${data.lessonId}`;
    const uid = Math.floor(Math.random() * 1000000);

    // Create Netless whiteboard room
    console.log("Creating Netless whiteboard room");
    const netlessRoomUuid = await createNetlessRoom(netlessSDKToken);
    const { appIdentifier } = parseNetlessSDKToken(netlessSDKToken);

    // Generate Netless room token (admin for tutors, writer for students)
    const netlessRole = data.userRole === 'tutor' ? 'admin' : 'writer';
    const netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, netlessRoomUuid, netlessRole);

    // Update lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_channel_name: channelName,
        agora_uid: uid,
        video_conference_provider: "agora",
        netless_room_uuid: netlessRoomUuid,
        netless_room_token: netlessRoomToken,
        netless_app_identifier: appIdentifier
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("Error updating lesson:", updateError);
      throw updateError;
    }

    console.log("Video room created successfully with Netless whiteboard");

    return new Response(
      JSON.stringify({
        success: true,
        channelName,
        uid,
        netlessRoomUuid,
        netlessAppIdentifier: appIdentifier,
        message: "Video room with whiteboard created successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating video room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function getTokens(data: GetTokensRequest, supabase: any) {
  const appId = Deno.env.get("AGORA_APP_ID");
  const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  const netlessSDKToken = "NETLESSSDK_YWs9Uk5ZamRBRm9iWWhOS3U4eCZub25jZT0zNGRjOTUxMC00ZGViLTExZjAtYjczZi1iMTBjNTEwODc0NTImcm9sZT0wJnNpZz1mMTAwNjM2ZWU4YmI0NTJkZTRkYTY2MDE5YWZhMDY4YThkNmE0M2YyMmQ2MDA5OTVmZDU4NTk0ZTY1YjNhOGM3";

  if (!appId || !appCertificate) {
    throw new Error("Agora credentials not configured");
  }

  try {
    console.log("Getting tokens for lesson:", data.lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("agora_channel_name, agora_uid, netless_room_uuid, netless_app_identifier")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new Error("Lesson not found");
    }

    if (!lesson.agora_channel_name || !lesson.netless_room_uuid) {
      throw new Error("Video room not created for this lesson");
    }

    // Generate fresh Agora tokens (simplified token generation for demo)
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600; // 1 hour
    
    // For demo purposes, using basic token structure
    const rtcToken = `agora_rtc_token_${lesson.agora_channel_name}_${data.userRole}_${expireTime}`;
    const rtmToken = `agora_rtm_token_${lesson.agora_uid}_${expireTime}`;

    // Generate fresh Netless room token
    const netlessRole = data.userRole === 'tutor' ? 'admin' : 'writer';
    const netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, lesson.netless_room_uuid, netlessRole);

    console.log("Tokens generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: lesson.agora_uid,
        rtcToken,
        rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error getting tokens:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
