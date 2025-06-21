import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import { createNetlessRoom, generateNetlessRoomToken, parseNetlessSDKToken } from "./netless-service.ts";
import { AccessToken2, ServiceRtc, ServiceRtm } from "./agora-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log('[AGORA-INTEGRATION] Function starting up...');

// Inline validation function
function validateAgoraCredentials(appId: string, appCertificate: string) {
  console.log('[AGORA-INTEGRATION] Environment check:', {
    hasAppId: !!appId,
    appIdValue: appId ? appId.substring(0, 8) + '...' : 'NOT SET',
    appIdLength: appId?.length || 0,
    hasAppCertificate: !!appCertificate,
    certificateLength: appCertificate?.length || 0,
    hasNetlessToken: !!Deno.env.get("NETLESS_SDK_TOKEN")
  });

  if (!appId || !appCertificate) {
    console.error('[AGORA-INTEGRATION] Missing Agora credentials');
    throw new Error("Agora credentials not configured. Please set AGORA_APP_ID and AGORA_APP_CERTIFICATE in Supabase secrets");
  }

  // Enhanced App ID validation
  if (appId.length !== 32) {
    console.error('[AGORA-INTEGRATION] Invalid App ID length:', appId.length, 'Expected: 32');
    throw new Error(`Invalid Agora App ID format. Current length: ${appId.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appId)) {
    console.error('[AGORA-INTEGRATION] Invalid App ID format - not hex:', appId);
    throw new Error("Invalid Agora App ID format. Should be 32 character hex string");
  }

  // Enhanced App Certificate validation
  if (appCertificate.length !== 32) {
    console.error('[AGORA-INTEGRATION] Invalid App Certificate length:', appCertificate.length);
    throw new Error(`Invalid Agora App Certificate format. Current length: ${appCertificate.length}, Expected: 32 characters`);
  }

  if (!/^[a-f0-9]{32}$/i.test(appCertificate)) {
    console.error('[AGORA-INTEGRATION] Invalid App Certificate format - not hex');
    throw new Error("Invalid Agora App Certificate format. Should be 32 character hex string");
  }

  console.log('[AGORA-INTEGRATION] Credentials validated successfully');
}

// Simplified token generation using official classes
function generateRtcToken(appId, appCertificate, channelName, uid, role, expireTime) {
  try {
    console.log('[AGORA-INTEGRATION] Generating RTC token with official implementation');
    
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtc = new ServiceRtc(channelName, uid)
    
    // Add privileges based on role
    if (role === 'publisher' || role === 'tutor') {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, expireTime)
        serviceRtc.add_privilege(ServiceRtc.kPrivilegePublishDataStream, expireTime)
    } else {
        serviceRtc.add_privilege(ServiceRtc.kPrivilegeJoinChannel, expireTime)
    }
    
    token.add_service(serviceRtc)
    return token.build()
  } catch (error) {
    console.error('[AGORA-INTEGRATION] RTC token generation error:', error);
    throw error;
  }
}

function generateRtmToken(appId, appCertificate, userId, expireTime) {
  try {
    console.log('[AGORA-INTEGRATION] Generating RTM token with official implementation');
    
    const token = new AccessToken2(appId, appCertificate, Math.floor(Date.now() / 1000), expireTime)
    const serviceRtm = new ServiceRtm(userId)
    serviceRtm.add_privilege(ServiceRtm.kPrivilegeLogin, expireTime)
    token.add_service(serviceRtm)
    return token.build()
  } catch (error) {
    console.error('[AGORA-INTEGRATION] RTM token generation error:', error);
    throw error;
  }
}

// Generate tokens using official implementation
async function generateTokensOfficial(
  appId,
  appCertificate,
  channelName,
  uid,
  userRole
) {
  try {
    console.log('[AGORA-INTEGRATION] Generating tokens with official implementation:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid: uid,
      userRole
    });

    // Handle null UID by generating a random one
    let actualUid = uid;
    if (actualUid === null || actualUid === undefined) {
      actualUid = Math.floor(Math.random() * 1000000) + 1000;
      console.log('[AGORA-INTEGRATION] Generated new UID:', actualUid);
    }

    // Set token expiration (24 hours by default)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const expireTime = currentTimestamp + 86400 // 24 hours

    // Generate RTC token
    const rtcToken = generateRtcToken(appId, appCertificate, channelName, actualUid, userRole, expireTime)
    
    // Generate RTM token
    const rtmToken = generateRtmToken(appId, appCertificate, actualUid.toString(), expireTime)

    if (!rtcToken || !rtmToken) {
      throw new Error('Failed to generate tokens');
    }

    console.log('[AGORA-INTEGRATION] Generated tokens successfully:', {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: userRole,
      finalUid: actualUid
    });

    return {
      rtcToken,
      rtmToken,
      uid: actualUid
    };
  } catch (error) {
    console.error('[AGORA-INTEGRATION] Official token generation error:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

serve(async (req) => {
  console.log('[AGORA-INTEGRATION] Request received:', req.method);
  
  if (req.method === "OPTIONS") {
    console.log('[AGORA-INTEGRATION] Handling OPTIONS request');
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[AGORA-INTEGRATION] Processing request with official Agora implementation');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('[AGORA-INTEGRATION] Request body parsed:', JSON.stringify(requestBody, null, 2));
    } catch (error) {
      console.error('[AGORA-INTEGRATION] JSON parsing error:', error);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { action, ...requestData } = requestBody;

    // Validate required environment variables
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
    // const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

    console.log('[AGORA-INTEGRATION] Environment check:', {
      hasAppId: !!appId,
      hasAppCertificate: !!appCertificate,
      // hasNetlessToken: !!netlessSDKToken
    });

    if (!appId || !appCertificate) {
      console.error('[AGORA-INTEGRATION] Missing required credentials');
      return new Response(
        JSON.stringify({ success: false, error: "Missing Agora credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    validateAgoraCredentials(appId, appCertificate);

    switch (action) {
      case "create-room":
        return await createVideoRoom(requestData, supabase, appId, appCertificate);
      case "get-tokens":
      case "get_tokens":
        return await getTokens(requestData, supabase, appId, appCertificate);
      case "regenerate-tokens":
        return await regenerateTokens(requestData, supabase, appId, appCertificate);
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
  data,
  supabase,
  appId,
  appCertificate
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

    // Generate tokens using official implementation
    const tokens = await generateTokensOfficial(
      appId,
      appCertificate,
      channelName,
      uid,
      data.userRole
    );

    console.log("[AGORA-INTEGRATION] Generated tokens with official implementation:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      userRole: data.userRole
    });

    // Netless functionality temporarily disabled
    /*
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
    */

    // Update lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_channel_name: channelName,
        agora_uid: tokens.uid,
        agora_token: tokens.rtcToken,
        agora_rtm_token: tokens.rtmToken,
        video_conference_provider: "agora",
        // netless_room_uuid: netlessRoomUuid,
        // netless_room_token: netlessRoomToken,
        // netless_app_identifier: appIdentifier
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[AGORA-INTEGRATION] Error updating lesson:", updateError);
      throw updateError;
    }

    console.log("[AGORA-INTEGRATION] Video room created successfully with official implementation");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        // netlessRoomUuid,
        // netlessRoomToken,
        // netlessAppIdentifier: appIdentifier,
        message: "Agora video room created successfully",
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
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
  data,
  supabase,
  appId,
  appCertificate
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
      return await createVideoRoom(data, supabase, appId, appCertificate);
    }

    console.log("[AGORA-INTEGRATION] Found existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Generate fresh tokens using official implementation
    const tokens = await generateTokensOfficial(
      appId,
      appCertificate,
      lesson.agora_channel_name,
      lesson.agora_uid,
      data.userRole
    );

    // Update lesson with new UID if it was null
    if (lesson.agora_uid !== tokens.uid) {
      await supabase
        .from("lessons")
        .update({ agora_uid: tokens.uid })
        .eq("id", data.lessonId);
    }

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with official implementation:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      role: data.userRole
    });

    // Generate fresh Netless room token if room exists
    /*
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
    */

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken: null,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
          channelName: lesson.agora_channel_name,
          uid: tokens.uid,
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
  data,
  supabase,
  appId,
  appCertificate
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
      return await createVideoRoom(data, supabase, appId, appCertificate);
    }

    console.log("[AGORA-INTEGRATION] Regenerating tokens for existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId.substring(0, 8) + '...'
    });

    // Generate fresh tokens using official implementation
    const tokens = await generateTokensOfficial(
      appId,
      appCertificate,
      lesson.agora_channel_name,
      lesson.agora_uid,
      data.userRole
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with official implementation:", {
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
        agora_uid: tokens.uid,
        video_conference_provider: "agora"
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[AGORA-INTEGRATION] Error updating lesson with fresh tokens:", updateError);
      throw updateError;
    }

    // Generate fresh Netless room token if room exists
    /*
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
    */

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson with official implementation");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken: null,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        regenerated: true,
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
          channelName: lesson.agora_channel_name,
          uid: tokens.uid,
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

console.log('[AGORA-INTEGRATION] Function initialization complete');
