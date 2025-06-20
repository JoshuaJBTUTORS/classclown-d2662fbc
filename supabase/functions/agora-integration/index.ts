
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAgoraCredentials } from "./validation.ts";
import { createNetlessRoom, generateNetlessRoomToken, parseNetlessSDKToken } from "./netless-service.ts";
import { CreateVideoRoomRequest, GetTokensRequest, RegenerateTokensRequest } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agora role constants
const ROLE_PUBLISHER = 1;
const ROLE_SUBSCRIBER = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[AGORA-INTEGRATION] Processing request with Vercel token service');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestBody = await req.json();
    console.log('[AGORA-INTEGRATION] Request:', JSON.stringify(requestBody, null, 2));
    
    const { action, ...requestData } = requestBody;

    // Validate required environment variables
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
    const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");
    const vercelTokenServiceUrl = Deno.env.get("VERCEL_TOKEN_SERVICE_URL");

    if (!vercelTokenServiceUrl) {
      throw new Error("VERCEL_TOKEN_SERVICE_URL environment variable not configured");
    }

    validateAgoraCredentials(appId || "", appCertificate || "");

    switch (action) {
      case "create-room":
        return await createVideoRoom(requestData as CreateVideoRoomRequest, supabase, appId!, appCertificate!, netlessSDKToken, vercelTokenServiceUrl);
      case "get-tokens":
      case "get_tokens":
        return await getTokens(requestData as GetTokensRequest, supabase, appId!, appCertificate!, netlessSDKToken, vercelTokenServiceUrl);
      case "regenerate-tokens":
        return await regenerateTokens(requestData as RegenerateTokensRequest, supabase, appId!, appCertificate!, netlessSDKToken, vercelTokenServiceUrl);
      default:
        console.error('[AGORA-INTEGRATION] Invalid action:', action);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action", received: action }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[AGORA-INTEGRATION] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateTokensViaVercel(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  userRole: string,
  vercelServiceUrl: string
) {
  try {
    console.log('[AGORA-INTEGRATION] Calling Vercel token service:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      userRole,
      serviceUrl: vercelServiceUrl
    });

    const response = await fetch(`${vercelServiceUrl}/api/generate-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appId,
        appCertificate,
        channelName,
        uid,
        userRole
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel service error: ${response.status} - ${errorText}`);
    }

    const tokens = await response.json();
    
    console.log('[AGORA-INTEGRATION] Received tokens from Vercel service:', {
      rtcTokenLength: tokens.rtcToken?.length,
      rtmTokenLength: tokens.rtmToken?.length,
      hasRtcToken: !!tokens.rtcToken,
      hasRtmToken: !!tokens.rtmToken
    });

    if (!tokens.rtcToken || !tokens.rtmToken) {
      throw new Error('Invalid token response from Vercel service');
    }

    return tokens;
  } catch (error) {
    console.error('[AGORA-INTEGRATION] Vercel token service error:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

async function createVideoRoom(
  data: CreateVideoRoomRequest, 
  supabase: any, 
  appId: string, 
  appCertificate: string, 
  netlessSDKToken?: string,
  vercelServiceUrl?: string
) {
  try {
    console.log("[AGORA-INTEGRATION] Creating video room for lesson:", data.lessonId);

    // Generate unique channel name (Agora allows alphanumeric and underscores, max 64 chars)
    const channelName = `lesson_${data.lessonId.replace(/-/g, '_')}`;
    const uid = Math.floor(Math.random() * 1000000) + 1000; // Ensure 4+ digit UID

    console.log("[AGORA-INTEGRATION] Channel details:", {
      channelName,
      uid,
      userRole: data.userRole,
      appId: appId.substring(0, 8) + '...'
    });

    // Generate tokens using Vercel service
    const tokens = await generateTokensViaVercel(
      appId,
      appCertificate,
      channelName,
      uid,
      data.userRole,
      vercelServiceUrl!
    );

    console.log("[AGORA-INTEGRATION] Generated tokens via Vercel service:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      userRole: data.userRole
    });

    // Create Netless whiteboard room if token is available
    let netlessRoomUuid = null;
    let netlessRoomToken = null;
    let appIdentifier = null;

    if (netlessSDKToken) {
      try {
        netlessRoomUuid = await createNetlessRoom(netlessSDKToken);
        const { appIdentifier: parsedAppId } = parseNetlessSDKToken(netlessSDKToken);
        appIdentifier = parsedAppId;

        const netlessRole = data.userRole === 'tutor' ? 'admin' : 'writer';
        netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, netlessRoomUuid, netlessRole);
        
        console.log("[AGORA-INTEGRATION] Netless setup completed:", {
          roomUuid: netlessRoomUuid,
          appIdentifier,
          role: netlessRole
        });
      } catch (netlessError) {
        console.warn('[AGORA-INTEGRATION] Netless setup failed, continuing without whiteboard:', netlessError.message);
      }
    }

    // Update lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_channel_name: channelName,
        agora_uid: uid,
        agora_token: tokens.rtcToken,
        agora_rtm_token: tokens.rtmToken,
        video_conference_provider: "agora",
        netless_room_uuid: netlessRoomUuid,
        netless_room_token: netlessRoomToken,
        netless_app_identifier: appIdentifier
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[AGORA-INTEGRATION] Error updating lesson:", updateError);
      throw updateError;
    }

    console.log("[AGORA-INTEGRATION] Video room created successfully with Vercel token service");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName,
        uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid,
        netlessRoomToken,
        netlessAppIdentifier: appIdentifier,
        message: "Agora video room created successfully",
        debug: {
          tokenLength: tokens.rtcToken.length,
          vercelService: true,
          role: data.userRole,
          validated: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AGORA-INTEGRATION] Error creating video room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function getTokens(
  data: GetTokensRequest, 
  supabase: any, 
  appId: string, 
  appCertificate: string, 
  netlessSDKToken?: string,
  vercelServiceUrl?: string
) {
  try {
    console.log("[AGORA-INTEGRATION] Getting tokens for lesson:", data.lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("agora_channel_name, agora_uid, netless_room_uuid, netless_app_identifier")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error("[AGORA-INTEGRATION] Lesson not found:", lessonError);
      throw new Error("Lesson not found or has no Agora room");
    }

    // If lesson doesn't have Agora room, create one
    if (!lesson.agora_channel_name) {
      console.log("[AGORA-INTEGRATION] No existing room found, creating new room");
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken, vercelServiceUrl);
    }

    console.log("[AGORA-INTEGRATION] Found existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Generate fresh tokens using Vercel service
    const tokens = await generateTokensViaVercel(
      appId,
      appCertificate,
      lesson.agora_channel_name,
      lesson.agora_uid,
      data.userRole,
      vercelServiceUrl!
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens via Vercel service:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      role: data.userRole
    });

    // Generate fresh Netless room token if room exists
    let netlessRoomToken = null;
    if (lesson.netless_room_uuid && netlessSDKToken) {
      try {
        const netlessRole = data.userRole === 'tutor' ? 'admin' : 'writer';
        netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, lesson.netless_room_uuid, netlessRole);
        console.log("[AGORA-INTEGRATION] Generated fresh Netless token");
      } catch (netlessError) {
        console.warn("[AGORA-INTEGRATION] Failed to generate Netless token:", netlessError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: lesson.agora_uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        debug: {
          tokenLength: tokens.rtcToken.length,
          vercelService: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          validated: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AGORA-INTEGRATION] Error getting tokens:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function regenerateTokens(
  data: RegenerateTokensRequest, 
  supabase: any, 
  appId: string, 
  appCertificate: string, 
  netlessSDKToken?: string,
  vercelServiceUrl?: string
) {
  try {
    console.log("[AGORA-INTEGRATION] Regenerating tokens for lesson:", data.lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("agora_channel_name, agora_uid, netless_room_uuid, netless_app_identifier")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error("[AGORA-INTEGRATION] Lesson not found:", lessonError);
      throw new Error("Lesson not found or has no Agora room");
    }

    // If lesson doesn't have Agora room, create one
    if (!lesson.agora_channel_name) {
      console.log("[AGORA-INTEGRATION] No existing room found, creating new room");
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken, vercelServiceUrl);
    }

    console.log("[AGORA-INTEGRATION] Regenerating tokens for existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Generate fresh tokens using Vercel service
    const tokens = await generateTokensViaVercel(
      appId,
      appCertificate,
      lesson.agora_channel_name,
      lesson.agora_uid,
      data.userRole,
      vercelServiceUrl!
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens via Vercel service:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      role: data.userRole
    });

    // Update lesson with fresh tokens
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_token: tokens.rtcToken,
        agora_rtm_token: tokens.rtmToken,
        video_conference_provider: "agora"
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[AGORA-INTEGRATION] Error updating lesson with fresh tokens:", updateError);
      throw updateError;
    }

    // Generate fresh Netless room token if room exists
    let netlessRoomToken = null;
    if (lesson.netless_room_uuid && netlessSDKToken) {
      try {
        const netlessRole = data.userRole === 'tutor' ? 'admin' : 'writer';
        netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, lesson.netless_room_uuid, netlessRole);
        
        // Update lesson with fresh Netless token
        await supabase
          .from("lessons")
          .update({
            netless_room_token: netlessRoomToken
          })
          .eq("id", data.lessonId);
          
        console.log("[AGORA-INTEGRATION] Generated and updated fresh Netless token");
      } catch (netlessError) {
        console.warn("[AGORA-INTEGRATION] Failed to regenerate Netless token:", netlessError.message);
      }
    }

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson via Vercel service");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: lesson.agora_uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        regenerated: true,
        debug: {
          tokenLength: tokens.rtcToken.length,
          vercelService: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          validated: true
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AGORA-INTEGRATION] Error regenerating tokens:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
