import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAgoraCredentials } from "./validation.ts";
import { generateRtcToken, generateRtmToken, validateAgoraToken, ROLE_PUBLISHER, ROLE_SUBSCRIBER } from "./token-generator.ts";
import { createNetlessRoom, generateNetlessRoomToken, parseNetlessSDKToken } from "./netless-service.ts";
import { CreateVideoRoomRequest, GetTokensRequest, RegenerateTokensRequest } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[AGORA-INTEGRATION] Processing request with official Agora token library');
    
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

    validateAgoraCredentials(appId || "", appCertificate || "");

    switch (action) {
      case "create-room":
        return await createVideoRoom(requestData as CreateVideoRoomRequest, supabase, appId!, appCertificate!, netlessSDKToken);
      case "get-tokens":
      case "get_tokens":
        return await getTokens(requestData as GetTokensRequest, supabase, appId!, appCertificate!, netlessSDKToken);
      case "regenerate-tokens":
        return await regenerateTokens(requestData as RegenerateTokensRequest, supabase, appId!, appCertificate!, netlessSDKToken);
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

async function createVideoRoom(
  data: CreateVideoRoomRequest, 
  supabase: any, 
  appId: string, 
  appCertificate: string, 
  netlessSDKToken?: string
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

    // Map user role to Agora role using official constants
    const agoraRole = data.userRole === 'tutor' ? ROLE_PUBLISHER : ROLE_SUBSCRIBER;

    console.log("[AGORA-INTEGRATION] Using official Agora token library:", {
      userRole: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      noExpiration: true,
      officialLibrary: true
    });

    // Generate tokens using official library (NO expiration)
    const rtcToken = await generateRtcToken(
      appId, 
      appCertificate, 
      channelName, 
      uid, 
      agoraRole
    );
    
    const rtmToken = await generateRtmToken(
      appId, 
      appCertificate, 
      uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated tokens with official library:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      expectedFormat: '~155 chars',
      officialLibrary: true
    });

    // Validate tokens using updated validation
    if (!validateAgoraToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateAgoraToken(rtmToken, appId)) {
      throw new Error('Generated RTM token failed validation');
    }

    console.log('[AGORA-INTEGRATION] Token validation passed - official library implementation confirmed');

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
        agora_token: rtcToken,
        agora_rtm_token: rtmToken,
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

    console.log("[AGORA-INTEGRATION] Video room created successfully with official Agora library");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName,
        uid,
        rtcToken,
        rtmToken,
        netlessRoomUuid,
        netlessRoomToken,
        netlessAppIdentifier: appIdentifier,
        message: "Agora video room created successfully",
        debug: {
          tokenLength: rtcToken.length,
          officialLibrary: true,
          noExpiration: true,
          role: data.userRole,
          agoraRole,
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
  netlessSDKToken?: string
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
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken);
    }

    console.log("[AGORA-INTEGRATION] Found existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Map user role to Agora role using official constants
    const agoraRole = data.userRole === 'tutor' ? ROLE_PUBLISHER : ROLE_SUBSCRIBER;
    
    // Generate fresh tokens using official library
    const rtcToken = await generateRtcToken(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole
    );
    
    const rtmToken = await generateRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with official library:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      officialLibrary: true
    });

    // Validate tokens
    if (!validateAgoraToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateAgoraToken(rtmToken, appId)) {
      throw new Error('Generated RTM token failed validation');
    }

    console.log('[AGORA-INTEGRATION] Token validation passed');

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
        rtcToken,
        rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        debug: {
          tokenLength: rtcToken.length,
          officialLibrary: true,
          noExpiration: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
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
  netlessSDKToken?: string
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
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken);
    }

    console.log("[AGORA-INTEGRATION] Regenerating tokens for existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Map user role to Agora role using official constants
    const agoraRole = data.userRole === 'tutor' ? ROLE_PUBLISHER : ROLE_SUBSCRIBER;
    
    console.log("[AGORA-INTEGRATION] Regenerating with official library:", {
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });
    
    // Generate fresh tokens using official library
    const rtcToken = await generateRtcToken(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole
    );
    
    const rtmToken = await generateRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with official library:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      officialLibrary: true
    });

    // Validate tokens
    if (!validateAgoraToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateAgoraToken(rtmToken, appId)) {
      throw new Error('Generated RTM token failed validation');
    }

    console.log('[AGORA-INTEGRATION] Token validation passed');

    // Update lesson with fresh tokens
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_token: rtcToken,
        agora_rtm_token: rtmToken,
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

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson with official library");

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
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        regenerated: true,
        debug: {
          tokenLength: rtcToken.length,
          officialLibrary: true,
          noExpiration: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
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
