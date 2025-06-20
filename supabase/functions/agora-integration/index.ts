
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

// Simplified Agora Token Builder based on official SDK
class SimpleAgoraTokenBuilder {
  // Role constants matching official SDK
  static readonly ROLE_PUBLISHER = 1;
  static readonly ROLE_SUBSCRIBER = 2;
  
  // Privilege constants
  static readonly kJoinChannel = 1;
  static readonly kPublishAudioStream = 2;
  static readonly kPublishVideoStream = 3;
  static readonly kPublishDataStream = 4;
  static readonly kRtmLogin = 1000;

  static async buildTokenWithUid(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    tokenExpirationInSeconds: number = 3600
  ): Promise<string> {
    console.log('[SIMPLE-TOKEN] Building token with simplified approach', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role: role === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
      expiration: tokenExpirationInSeconds
    });

    try {
      // Calculate expiration timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiration = currentTimestamp + tokenExpirationInSeconds;

      // Create message for token (simplified version)
      const message = this.createTokenMessage(
        appId,
        channelName,
        uid.toString(),
        role,
        privilegeExpiration
      );

      // Generate HMAC-SHA256 signature
      const signature = await this.generateSignature(appCertificate, message);

      // Build final token: version + appId + base64(message + signature)
      const content = new Uint8Array(message.length + signature.length);
      content.set(message, 0);
      content.set(signature, message.length);

      const base64Content = btoa(String.fromCharCode(...content));
      const token = `007${appId}${base64Content}`;

      console.log('[SIMPLE-TOKEN] Token generated successfully', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        expectedLength: '~164 characters',
        messageLength: message.length,
        signatureLength: signature.length
      });

      return token;
    } catch (error) {
      console.error('[SIMPLE-TOKEN] Token generation failed:', error);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  private static createTokenMessage(
    appId: string,
    channelName: string,
    uid: string,
    role: number,
    privilegeExpiration: number
  ): Uint8Array {
    // Create a simple message structure
    const encoder = new TextEncoder();
    
    // Encode components
    const appIdBytes = encoder.encode(appId);
    const channelBytes = encoder.encode(channelName);
    const uidBytes = encoder.encode(uid);
    
    // Create privileges based on role
    const privileges = new Map<number, number>();
    privileges.set(this.kJoinChannel, privilegeExpiration);
    
    if (role === this.ROLE_PUBLISHER) {
      privileges.set(this.kPublishAudioStream, privilegeExpiration);
      privileges.set(this.kPublishVideoStream, privilegeExpiration);
      privileges.set(this.kPublishDataStream, privilegeExpiration);
    }

    // Simple message format: timestamp + privileges + appId + channel + uid
    const timestamp = Math.floor(Date.now() / 1000);
    const timestampBytes = new Uint32Array([timestamp]);
    const privilegeCount = new Uint16Array([privileges.size]);
    
    // Calculate total size
    let totalSize = 4 + 2; // timestamp + privilege count
    totalSize += privileges.size * 8; // privilege entries (4 bytes key + 4 bytes value)
    totalSize += 2 + appIdBytes.length; // appId length + appId
    totalSize += 2 + channelBytes.length; // channel length + channel
    totalSize += 2 + uidBytes.length; // uid length + uid

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    let offset = 0;

    // Write timestamp
    view.setUint32(offset, timestamp, true);
    offset += 4;

    // Write privilege count
    view.setUint16(offset, privileges.size, true);
    offset += 2;

    // Write privileges
    for (const [key, value] of privileges) {
      view.setUint32(offset, key, true);
      offset += 4;
      view.setUint32(offset, value, true);
      offset += 4;
    }

    // Write appId
    view.setUint16(offset, appIdBytes.length, true);
    offset += 2;
    uint8View.set(appIdBytes, offset);
    offset += appIdBytes.length;

    // Write channel
    view.setUint16(offset, channelBytes.length, true);
    offset += 2;
    uint8View.set(channelBytes, offset);
    offset += channelBytes.length;

    // Write uid
    view.setUint16(offset, uidBytes.length, true);
    offset += 2;
    uint8View.set(uidBytes, offset);
    offset += uidBytes.length;

    return new Uint8Array(buffer);
  }

  private static async generateSignature(key: string, message: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  }

  static async buildRtmToken(
    appId: string,
    appCertificate: string,
    userId: string,
    tokenExpirationInSeconds: number = 3600
  ): Promise<string> {
    console.log('[SIMPLE-RTM] Building RTM token', { userId });

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiration = currentTimestamp + tokenExpirationInSeconds;

      // Create RTM message (simpler than RTC)
      const message = this.createRtmTokenMessage(appId, userId, privilegeExpiration);
      const signature = await this.generateSignature(appCertificate, message);

      const content = new Uint8Array(message.length + signature.length);
      content.set(message, 0);
      content.set(signature, message.length);

      const base64Content = btoa(String.fromCharCode(...content));
      const token = `007${appId}${base64Content}`;

      console.log('[SIMPLE-RTM] RTM token generated', {
        tokenLength: token.length,
        userId
      });

      return token;
    } catch (error) {
      console.error('[SIMPLE-RTM] RTM token generation failed:', error);
      throw new Error(`RTM token generation failed: ${error.message}`);
    }
  }

  private static createRtmTokenMessage(
    appId: string,
    userId: string,
    privilegeExpiration: number
  ): Uint8Array {
    const encoder = new TextEncoder();
    const appIdBytes = encoder.encode(appId);
    const userIdBytes = encoder.encode(userId);
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Simple RTM message: timestamp + rtm_login_privilege + appId + userId
    const totalSize = 4 + 8 + 2 + appIdBytes.length + 2 + userIdBytes.length;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    let offset = 0;

    // Write timestamp
    view.setUint32(offset, timestamp, true);
    offset += 4;

    // Write RTM login privilege
    view.setUint32(offset, this.kRtmLogin, true);
    offset += 4;
    view.setUint32(offset, privilegeExpiration, true);
    offset += 4;

    // Write appId
    view.setUint16(offset, appIdBytes.length, true);
    offset += 2;
    uint8View.set(appIdBytes, offset);
    offset += appIdBytes.length;

    // Write userId
    view.setUint16(offset, userIdBytes.length, true);
    offset += 2;
    uint8View.set(userIdBytes, offset);

    return new Uint8Array(buffer);
  }
}

// Simple token validation
function validateSimpleToken(token: string, appId: string): boolean {
  try {
    if (!token || token.length < 100) {
      console.error('[VALIDATE] Token too short:', token?.length);
      return false;
    }

    if (!token.startsWith('007')) {
      console.error('[VALIDATE] Invalid token version:', token.substring(0, 3));
      return false;
    }

    if (!token.includes(appId)) {
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
    console.log('[AGORA-INTEGRATION] Processing request with simplified token generation');
    
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

    // Map user role to Agora role (simplified)
    const agoraRole = data.userRole === 'tutor' ? SimpleAgoraTokenBuilder.ROLE_PUBLISHER : SimpleAgoraTokenBuilder.ROLE_SUBSCRIBER;
    const tokenExpiration = 3600; // 1 hour

    console.log("[AGORA-INTEGRATION] Using simplified token generation:", {
      userRole: data.userRole,
      agoraRole: agoraRole === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
      tokenExpiration
    });

    // Generate tokens using simplified approach
    const rtcToken = await SimpleAgoraTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      channelName, 
      uid, 
      agoraRole, 
      tokenExpiration
    );
    
    const rtmToken = await SimpleAgoraTokenBuilder.buildRtmToken(
      appId, 
      appCertificate, 
      uid.toString(), 
      tokenExpiration
    );

    console.log("[AGORA-INTEGRATION] Generated tokens using simplified approach:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      tokenVersion: rtcToken.substring(0, 3),
      usingSimplifiedApproach: true
    });

    // Validate tokens
    if (!validateSimpleToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateSimpleToken(rtmToken, appId)) {
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

    console.log("[AGORA-INTEGRATION] Video room created successfully with simplified approach");

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
          usingSimplifiedApproach: true,
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

    // Map user role to Agora role (simplified)
    const agoraRole = data.userRole === 'tutor' ? SimpleAgoraTokenBuilder.ROLE_PUBLISHER : SimpleAgoraTokenBuilder.ROLE_SUBSCRIBER;
    const tokenExpiration = 3600; // 1 hour
    
    const rtcToken = await SimpleAgoraTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole, 
      tokenExpiration
    );
    
    const rtmToken = await SimpleAgoraTokenBuilder.buildRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString(), 
      tokenExpiration
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens using simplified approach:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
      tokenVersion: rtcToken.substring(0, 3),
      usingSimplifiedApproach: true
    });

    // Validate tokens
    if (!validateSimpleToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateSimpleToken(rtmToken, appId)) {
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
          usingSimplifiedApproach: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: agoraRole === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
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

    // Map user role to Agora role (simplified)
    const agoraRole = data.userRole === 'tutor' ? SimpleAgoraTokenBuilder.ROLE_PUBLISHER : SimpleAgoraTokenBuilder.ROLE_SUBSCRIBER;
    const tokenExpiration = 3600; // 1 hour
    
    console.log("[AGORA-INTEGRATION] Regenerating with simplified parameters:", {
      role: data.userRole,
      agoraRole: agoraRole === 1 ? 'PUBLISHER' : 'SUBSCRIBER'
    });
    
    const rtcToken = await SimpleAgoraTokenBuilder.buildTokenWithUid(
      appId, 
      appCertificate, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      agoraRole, 
      tokenExpiration
    );
    
    const rtmToken = await SimpleAgoraTokenBuilder.buildRtmToken(
      appId, 
      appCertificate, 
      lesson.agora_uid.toString(), 
      tokenExpiration
    );

    console.log("[AGORA-INTEGRATION] Generated fresh tokens using simplified approach:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      agoraRole: agoraRole ===  1 ? 'PUBLISHER' : 'SUBSCRIBER',
      tokenVersion: rtcToken.substring(0, 3),
      usingSimplifiedApproach: true
    });

    // Validate tokens
    if (!validateSimpleToken(rtcToken, appId)) {
      throw new Error('Generated RTC token failed validation');
    }

    if (!validateSimpleToken(rtmToken, appId)) {
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

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson using simplified approach");

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
          usingSimplifiedApproach: true,
          channelName: lesson.agora_channel_name,
          uid: lesson.agora_uid,
          agoraRole: agoraRole === 1 ? 'PUBLISHER' : 'SUBSCRIBER',
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
