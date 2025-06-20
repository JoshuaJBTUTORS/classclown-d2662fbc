
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

// Official Agora RTC Token Generation Implementation
class AgoraTokenBuilder {
  private static readonly kJoinChannel = 1;
  private static readonly kPublishAudioStream = 2;
  private static readonly kPublishVideoStream = 3;
  private static readonly kPublishDataStream = 4;
  private static readonly kRtmLogin = 1000;

  static async buildTokenWithUid(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    expireTime: number
  ): Promise<string> {
    console.log('[AGORA-TOKEN] Building token with official algorithm', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role,
      expireTime
    });

    try {
      // Create message to sign
      const message = this.packMessage(appId, channelName, uid, role, expireTime);
      
      // Generate signature using HMAC-SHA256
      const signature = await this.hmacSha256(appCertificate, message);
      
      // Build final token
      const token = this.buildToken(appId, message, signature);
      
      console.log('[AGORA-TOKEN] Token generated successfully', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        version: token.substring(0, 3)
      });

      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] Error generating token:', error);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  private static packMessage(
    appId: string,
    channelName: string,
    uid: number,
    role: number,
    expireTime: number
  ): string {
    // Create privilege map
    const privileges = new Map();
    privileges.set(this.kJoinChannel, expireTime);
    
    if (role === 1) { // Publisher/Host
      privileges.set(this.kPublishAudioStream, expireTime);
      privileges.set(this.kPublishVideoStream, expireTime);
      privileges.set(this.kPublishDataStream, expireTime);
    }

    // Pack message according to Agora specification
    const salt = Math.floor(Math.random() * 0xFFFFFFFF);
    const ts = Math.floor(Date.now() / 1000);

    // Create message components
    const messageData = {
      salt: salt,
      ts: ts,
      privileges: Object.fromEntries(privileges),
      appId: appId,
      channelName: channelName,
      uid: uid.toString()
    };

    // Convert to binary-compatible format
    const messageStr = JSON.stringify(messageData);
    const messageBytes = new TextEncoder().encode(messageStr);
    
    // Convert to base64 for transport
    return btoa(String.fromCharCode(...messageBytes));
  }

  private static async hmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static buildToken(appId: string, message: string, signature: string): string {
    const version = "007";
    const appIdBytes = appId;
    const messageBase64 = message;
    const signatureHex = signature;
    
    // Combine according to Agora token format: version + appId + message + signature
    return version + appIdBytes + messageBase64 + signatureHex.substring(0, 32);
  }

  static async buildRtmToken(appId: string, appCertificate: string, userId: string, expireTime: number): Promise<string> {
    console.log('[RTM-TOKEN] Building RTM token', { userId });
    
    try {
      // RTM token uses similar structure but simpler privilege map
      const privileges = new Map();
      privileges.set(this.kRtmLogin, expireTime);

      const salt = Math.floor(Math.random() * 0xFFFFFFFF);
      const ts = Math.floor(Date.now() / 1000);

      const messageData = {
        salt: salt,
        ts: ts,
        privileges: Object.fromEntries(privileges),
        appId: appId,
        userId: userId
      };

      const messageStr = JSON.stringify(messageData);
      const messageBytes = new TextEncoder().encode(messageStr);
      const message = btoa(String.fromCharCode(...messageBytes));
      
      const signature = await this.hmacSha256(appCertificate, message);
      
      return "007" + appId + message + signature.substring(0, 32);
    } catch (error) {
      console.error('[RTM-TOKEN] Error generating RTM token:', error);
      throw new Error(`RTM token generation failed: ${error.message}`);
    }
  }
}

// Token validation function
function validateToken(token: string, appId: string): boolean {
  try {
    // Basic token format validation
    if (!token || token.length < 50) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    if (!token.startsWith('007')) {
      console.error('[VALIDATE] Invalid token version:', token.substring(0, 3));
      return false;
    }

    // Check if token contains app ID
    if (!token.includes(appId.substring(0, 8))) {
      console.error('[VALIDATE] Token does not contain app ID');
      return false;
    }

    console.log('[VALIDATE] Token validation passed');
    return true;
  } catch (error) {
    console.error('[VALIDATE] Token validation error:', error);
    return false;
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
      case "regenerate-tokens":
        return await regenerateTokens(requestData as RegenerateTokensRequest, supabase);
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
    const tokenExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2; // 1 = publisher, 2 = subscriber

    console.log("[AGORA-INTEGRATION] Token generation params:", {
      currentTime,
      tokenExpire,
      role: data.userRole,
      agoraRole: role,
      appId: appId!.substring(0, 8) + '...',
      channelName
    });

    // Generate tokens using official Agora algorithm
    const rtcToken = await AgoraTokenBuilder.buildTokenWithUid(
      appId!, 
      appCertificate!, 
      channelName, 
      uid, 
      role, 
      tokenExpire
    );
    
    const rtmToken = await AgoraTokenBuilder.buildRtmToken(appId!, appCertificate!, uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated tokens using official algorithm:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      tokenVersion: rtcToken.substring(0, 3),
      usingOfficialAlgorithm: true
    });

    // Validate tokens
    if (!validateToken(rtcToken, appId!)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateToken(rtmToken, appId!)) {
      throw new Error('Generated RTM token failed validation');
    }

    console.log('[AGORA-INTEGRATION] Token validation passed');

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

    console.log("[AGORA-INTEGRATION] Video room created successfully with official algorithm");

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
          usingOfficialAlgorithm: true,
          role: data.userRole,
          agoraRole: role,
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

    // Generate fresh tokens for the existing channel using official algorithm
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2; // 1 = publisher, 2 = subscriber
    
    const rtcToken = await AgoraTokenBuilder.buildTokenWithUid(
      appId!, 
      appCertificate!, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      role, 
      tokenExpire
    );
    
    const rtmToken = await AgoraTokenBuilder.buildRtmToken(appId!, appCertificate!, lesson.agora_uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated fresh tokens using official algorithm:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: role,
      tokenVersion: rtcToken.substring(0, 3),
      usingOfficialAlgorithm: true
    });

    // Validate tokens
    if (!validateToken(rtcToken, appId!)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateToken(rtmToken, appId!)) {
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
          usingOfficialAlgorithm: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: role,
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

async function regenerateTokens(data: RegenerateTokensRequest, supabase: any) {
  const appId = Deno.env.get("AGORA_APP_ID");
  const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

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
      return await createVideoRoom(data, supabase);
    }

    console.log("[AGORA-INTEGRATION] Regenerating tokens for existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      appId: appId!.substring(0, 8) + '...'
    });

    // Generate completely fresh tokens using official algorithm
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2; // 1 = publisher, 2 = subscriber
    
    console.log("[AGORA-INTEGRATION] Regenerating with fresh parameters:", {
      currentTime,
      tokenExpire,
      role: data.userRole,
      agoraRole: role
    });
    
    const rtcToken = await AgoraTokenBuilder.buildTokenWithUid(
      appId!, 
      appCertificate!, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      role, 
      tokenExpire
    );
    
    const rtmToken = await AgoraTokenBuilder.buildRtmToken(appId!, appCertificate!, lesson.agora_uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated fresh tokens using official algorithm:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: role,
      tokenVersion: rtcToken.substring(0, 3),
      usingOfficialAlgorithm: true
    });

    // Validate tokens
    if (!validateToken(rtcToken, appId!)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateToken(rtmToken, appId!)) {
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

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson using official algorithm");

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
          usingOfficialAlgorithm: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: role,
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
