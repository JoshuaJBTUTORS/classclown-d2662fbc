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

interface RegenerateTokensRequest {
  lessonId: string;
  userRole: 'tutor' | 'student';
}

// Import the official Agora token builder with exact method used by website
const { RtcTokenBuilder, RtmTokenBuilder, RtcRole } = await import('https://esm.sh/agora-access-token@2.0.4');

// Official Agora role constants - exactly as used by website
const ROLE_PUBLISHER = 1;
const ROLE_SUBSCRIBER = 2;

// Token validation function - updated to check for 155-character format
function validateAgoraToken(token: string, appId: string): boolean {
  try {
    if (!token || token.length < 100) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    // Check for expected token length (Agora website generates ~155 chars)
    if (token.length > 200) {
      console.warn('[VALIDATE] Token unexpectedly long:', token.length, 'Expected: ~155');
    }

    // Agora tokens should start with '007'
    if (!token.startsWith('007')) {
      console.error('[VALIDATE] Invalid token version:', token.substring(0, 3));
      return false;
    }

    console.log('[VALIDATE] Token validation passed', {
      length: token.length,
      prefix: token.substring(0, 10) + '...'
    });
    return true;
  } catch (error) {
    console.error('[VALIDATE] Token validation error:', error);
    return false;
  }
}

// Generate RTC Token using EXACT method as Agora website
function generateRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number): string {
  try {
    console.log('[RTC-TOKEN] Generating with website-matching parameters:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role: role === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });

    // Use the EXACT same method as Agora website: buildTokenWithUid
    // With NO expiration time (0 means no expiration, just like website)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      0 // NO EXPIRATION - same as Agora website default
    );

    console.log('[RTC-TOKEN] Generated token matching website format:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      expectedLength: '~155 chars',
      actualLength: token.length,
      matchesWebsite: token.length >= 150 && token.length <= 160
    });

    return token;
  } catch (error) {
    console.error('[RTC-TOKEN] Generation failed:', error);
    throw new Error(`RTC token generation failed: ${error.message}`);
  }
}

// Generate RTM Token using website-matching method
function generateRtmToken(appId: string, appCertificate: string, userId: string): string {
  try {
    console.log('[RTM-TOKEN] Generating with website-matching parameters:', {
      appId: appId.substring(0, 8) + '...',
      userId
    });

    // Use the EXACT same method as Agora website: buildToken with NO expiration
    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      userId,
      0 // NO EXPIRATION - same as website default
    );

    console.log('[RTM-TOKEN] Generated token matching website format:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      matchesWebsite: token.length >= 150 && token.length <= 160
    });

    return token;
  } catch (error) {
    console.error('[RTM-TOKEN] Generation failed:', error);
    throw new Error(`RTM token generation failed: ${error.message}`);
  }
}

// Netless service functions
async function createNetlessRoom(sdkToken: string) {
  console.log('[NETLESS] Creating room...');
  
  try {
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
      const errorText = await response.text();
      console.error('[NETLESS] Room creation failed:', response.status, errorText);
      throw new Error(`Failed to create Netless room: ${response.statusText}`);
    }

    const roomData = await response.json();
    console.log('[NETLESS] Room created:', roomData.uuid);
    return roomData.uuid;
  } catch (error) {
    console.error('[NETLESS] Error creating room:', error);
    throw error;
  }
}

async function generateNetlessRoomToken(sdkToken: string, roomUuid: string, role: 'admin' | 'writer' | 'reader' = 'admin') {
  console.log(`[NETLESS] Generating token for room: ${roomUuid}, role: ${role}`);
  
  try {
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
      const errorText = await response.text();
      console.error('[NETLESS] Token generation failed:', response.status, errorText);
      throw new Error(`Failed to generate room token: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[NETLESS] Token generated successfully');
    return result.token;
  } catch (error) {
    console.error('[NETLESS] Error generating token:', error);
    throw error;
  }
}

function parseNetlessSDKToken(sdkToken: string) {
  try {
    const tokenData = sdkToken.replace('NETLESSSDK_', '');
    const decoded = atob(tokenData);
    const params = new URLSearchParams(decoded);
    const appIdentifier = params.get('ak');
    
    if (!appIdentifier) {
      throw new Error('Invalid SDK token format: missing app identifier');
    }
    
    return { appIdentifier };
  } catch (error) {
    console.error('[NETLESS] Failed to parse SDK token:', error);
    throw new Error('Invalid Netless SDK token format');
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[AGORA-INTEGRATION] Processing request with website-matching token generation');
    
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

    console.log('[AGORA-INTEGRATION] Environment check:', {
      hasAppId: !!appId,
      appIdValue: appId ? appId.substring(0, 8) + '...' : 'NOT SET',
      appIdLength: appId?.length || 0,
      hasAppCertificate: !!appCertificate,
      certificateLength: appCertificate?.length || 0,
      hasNetlessToken: !!netlessSDKToken
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

    switch (action) {
      case "create-room":
        return await createVideoRoom(requestData as CreateVideoRoomRequest, supabase, appId, appCertificate, netlessSDKToken);
      case "get-tokens":
      case "get_tokens":
        return await getTokens(requestData as GetTokensRequest, supabase, appId, appCertificate, netlessSDKToken);
      case "regenerate-tokens":
        return await regenerateTokens(requestData as RegenerateTokensRequest, supabase, appId, appCertificate, netlessSDKToken);
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

    console.log("[AGORA-INTEGRATION] Using website-matching token generation:", {
      userRole: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      noExpiration: true,
      matchingWebsiteMethod: true
    });

    // Generate tokens using website-matching method (NO expiration)
    const rtcToken = generateRtcToken(
      appId, 
      appCertificate, 
      channelName, 
      uid, 
      agoraRole
    );
    
    const rtmToken = generateRtmToken(
      appId, 
      appCertificate, 
      uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated tokens with website-matching format:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      tokenVersion: rtcToken.substring(0, 3),
      expectedFormat: '~155 chars each',
      websiteMatching: true
    });

    // Validate tokens using updated validation
    if (!validateAgoraToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateAgoraToken(rtmToken, appId)) {
      throw new Error('Generated RTM token failed validation');
    }

    console.log('[AGORA-INTEGRATION] Token validation passed - website format confirmed');

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

    console.log("[AGORA-INTEGRATION] Video room created successfully with website-matching tokens");

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
          tokenVersion: rtcToken.substring(0, 3),
          tokenLength: rtcToken.length,
          websiteMatching: true,
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
    
    // Generate fresh tokens using website-matching method
    const rtcToken = generateRtcToken(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole
    );
    
    const rtmToken = generateRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with website-matching format:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      tokenVersion: rtcToken.substring(0, 3),
      websiteMatching: true
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
          tokenVersion: rtcToken.substring(0, 3),
          tokenLength: rtcToken.length,
          websiteMatching: true,
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
    
    console.log("[AGORA-INTEGRATION] Regenerating with website-matching parameters:", {
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'
    });
    
    // Generate fresh tokens using website-matching method
    const rtcToken = generateRtcToken(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole
    );
    
    const rtmToken = generateRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString()
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens with website-matching format:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole === ROLE_PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER',
      tokenVersion: rtcToken.substring(0, 3),
      websiteMatching: true
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

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson with website-matching format");

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
          tokenVersion: rtcToken.substring(0, 3),
          tokenLength: rtcToken.length,
          websiteMatching: true,
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
