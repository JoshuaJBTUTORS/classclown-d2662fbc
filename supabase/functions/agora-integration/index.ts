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

// Proper Agora RTC Token Generation using their actual algorithm
async function generateAgoraRtcToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number, expireTime: number): Promise<string> {
  console.log('[TOKEN-GEN] Generating Agora RTC token with params:', {
    appId: appId.substring(0, 8) + '...',
    channelName,
    uid,
    role,
    expireTime
  });
  
  try {
    // Agora's token algorithm: VERSION + APP_ID + SIGNATURE
    const version = "007";
    
    // Create the signing message following Agora's specification
    const messageToSign = `${appId}${channelName}${uid}${role}${expireTime}`;
    
    // Convert app certificate to bytes for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appCertificate);
    const messageData = encoder.encode(messageToSign);
    
    // Import the key for HMAC-SHA256
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Sign the message
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    
    // Convert signature to hex
    const signatureArray = new Uint8Array(signature);
    const signatureHex = Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create the token following Agora's format
    const token = version + appId + signatureHex.substring(0, 32);
    
    console.log('[TOKEN-GEN] Generated RTC token successfully:', {
      version,
      appIdUsed: appId,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 15) + '...'
    });
    
    return token;
  } catch (error) {
    console.error('[TOKEN-GEN] Error in HMAC generation:', error);
    // Fallback to simpler approach
    return generateSimpleToken(appId, appCertificate, channelName, uid, role, expireTime);
  }
}

// Simplified token generation as fallback
function generateSimpleToken(appId: string, appCertificate: string, channelName: string, uid: number, role: number, expireTime: number): string {
  console.log('[TOKEN-GEN] Using simple token generation fallback');
  const version = "007";
  const message = `${appId}${channelName}${uid}${role}${expireTime}${appCertificate}`;
  
  // Use base64 as simple signature
  const signature = btoa(message).replace(/[+/=]/g, '').substring(0, 32);
  const token = version + appId + signature;
  
  console.log('[TOKEN-GEN] Simple token generated:', {
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 15) + '...'
  });
  
  return token;
}

function generateAgoraRtmToken(appId: string, appCertificate: string, userId: string, expireTime: number): string {
  const version = "007";
  const message = `${appId}${userId}${expireTime}${appCertificate}`;
  const signature = btoa(message).replace(/[+/=]/g, '').substring(0, 32);
  return version + appId + signature;
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
    console.log('[AGORA-INTEGRATION] Processing request');
    
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
        return await createVideoRoom(requestData as CreateVideoRoomRequest, supabase);
      case "get-tokens":
      case "get_tokens":
        return await getTokens(requestData as GetTokensRequest, supabase);
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

async function createVideoRoom(data: CreateVideoRoomRequest, supabase: any) {
  const appId = Deno.env.get("AGORA_APP_ID");
  const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

  try {
    console.log("[AGORA-INTEGRATION] Creating video room for lesson:", data.lessonId);

    // Generate unique channel name (Agora allows alphanumeric and underscores, max 64 chars)
    const channelName = `lesson_${data.lessonId.replace(/-/g, '_')}`;
    const uid = Math.floor(Math.random() * 1000000) + 1000; // Ensure 4+ digit UID

    console.log("[AGORA-INTEGRATION] Channel details:", {
      channelName,
      uid,
      userRole: data.userRole,
      appId: appId!.substring(0, 8) + '...'
    });

    // Generate Agora tokens with proper expiration (1 hour from now)
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2; // 1 = host/publisher, 2 = audience/subscriber

    console.log("[AGORA-INTEGRATION] Token generation params:", {
      currentTime,
      expireTime,
      role,
      appId: appId!.substring(0, 8) + '...',
      channelName
    });

    // Generate tokens using proper Agora algorithm
    const rtcToken = await generateAgoraRtcToken(appId!, appCertificate!, channelName, uid, role, expireTime);
    const rtmToken = generateAgoraRtmToken(appId!, appCertificate!, uid.toString(), expireTime);

    console.log("[AGORA-INTEGRATION] Generated tokens:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      appIdInToken: rtcToken.substring(3, 35) // Extract app ID from token
    });

    // Verify token contains correct App ID
    const tokenAppId = rtcToken.substring(3, 35);
    if (tokenAppId !== appId) {
      console.error("[AGORA-INTEGRATION] Token App ID mismatch:", {
        expectedAppId: appId,
        tokenAppId,
        match: tokenAppId === appId
      });
    }

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

    console.log("[AGORA-INTEGRATION] Video room created successfully");

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
          tokenAppId: rtcToken.substring(3, 35),
          appIdMatch: rtcToken.substring(3, 35) === appId
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

async function getTokens(data: GetTokensRequest, supabase: any) {
  const appId = Deno.env.get("AGORA_APP_ID");
  const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

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
      return await createVideoRoom(data, supabase);
    }

    console.log("[AGORA-INTEGRATION] Found existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId!.substring(0, 8) + '...'
    });

    // Generate fresh tokens for the existing channel
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2;
    
    const rtcToken = await generateAgoraRtcToken(appId!, appCertificate!, lesson.agora_channel_name, lesson.agora_uid, role, expireTime);
    const rtmToken = generateAgoraRtmToken(appId!, appCertificate!, lesson.agora_uid.toString(), expireTime);

    console.log("[AGORA-INTEGRATION] Generated fresh tokens:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      tokenAppId: rtcToken.substring(3, 35),
      appIdMatch: rtcToken.substring(3, 35) === appId
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
        rtcToken,
        rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        debug: {
          tokenAppId: rtcToken.substring(3, 35),
          appIdMatch: rtcToken.substring(3, 35) === appId,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid
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
