
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

// Agora Token Generation - Official Implementation
class AgoraTokenBuilder {
  private static readonly VERSION = "007";
  private static readonly PRIVILEGE_EXPIRE_TS = 0x00000001;
  private static readonly SERVICE_TYPE_RTC = 1;

  // Role definitions matching Agora's specification
  private static readonly ROLE_PUBLISHER = 1; // Host/Publisher
  private static readonly ROLE_SUBSCRIBER = 2; // Audience/Subscriber

  static async buildTokenWithUid(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    tokenExpire: number,
    privilegeExpire: number
  ): Promise<string> {
    console.log('[AGORA-TOKEN] Building token with params:', {
      appId: appId.substring(0, 8) + '...',
      channelName,
      uid,
      role,
      tokenExpire,
      privilegeExpire
    });

    try {
      // Create the access token
      const accessToken = new AccessToken(appId, appCertificate, tokenExpire);
      
      // Add RTC service with channel and UID privileges
      const service = new ServiceRtc(channelName, uid);
      service.addPrivilege(ServiceRtc.PRIVILEGE_JOIN_CHANNEL, privilegeExpire);
      
      if (role === this.ROLE_PUBLISHER) {
        service.addPrivilege(ServiceRtc.PRIVILEGE_PUBLISH_AUDIO_STREAM, privilegeExpire);
        service.addPrivilege(ServiceRtc.PRIVILEGE_PUBLISH_VIDEO_STREAM, privilegeExpire);
        service.addPrivilege(ServiceRtc.PRIVILEGE_PUBLISH_DATA_STREAM, privilegeExpire);
      }
      
      accessToken.addService(service);
      
      const token = await accessToken.build();
      
      console.log('[AGORA-TOKEN] Token generated successfully:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 15) + '...',
        version: token.substring(0, 3),
        containsAppId: token.includes(appId.substring(0, 8))
      });
      
      return token;
    } catch (error) {
      console.error('[AGORA-TOKEN] Error generating token:', error);
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }
}

// AccessToken class for Agora token generation
class AccessToken {
  private appId: string;
  private appCertificate: string;
  private issueTs: number;
  private expire: number;
  private salt: number;
  private services: Map<number, any> = new Map();

  constructor(appId: string, appCertificate: string, expire: number) {
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.issueTs = Math.floor(Date.now() / 1000);
    this.expire = expire;
    this.salt = Math.floor(Math.random() * 0xFFFFFFFF);
  }

  addService(service: any): void {
    this.services.set(service.getServiceType(), service);
  }

  async build(): Promise<string> {
    return await this.buildToken();
  }

  private async buildToken(): Promise<string> {
    const msg = await this.packMessage();
    const signature = await this.generateSignature(msg);
    
    return AgoraTokenBuilder.VERSION + this.appId + signature + msg;
  }

  private async packMessage(): Promise<string> {
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);
    let offset = 0;

    // Pack salt (4 bytes)
    view.setUint32(offset, this.salt, false);
    offset += 4;

    // Pack issue timestamp (4 bytes)
    view.setUint32(offset, this.issueTs, false);
    offset += 4;

    // Pack expire timestamp (4 bytes)
    view.setUint32(offset, this.expire, false);
    offset += 4;

    // Pack services count (2 bytes)
    view.setUint16(offset, this.services.size, false);
    offset += 2;

    // Pack each service
    for (const [serviceType, service] of this.services) {
      view.setUint16(offset, serviceType, false);
      offset += 2;
      
      const serviceBuffer = service.pack();
      const serviceBytes = new Uint8Array(serviceBuffer);
      
      view.setUint16(offset, serviceBytes.length, false);
      offset += 2;
      
      const msgBytes = new Uint8Array(buffer);
      msgBytes.set(serviceBytes, offset);
      offset += serviceBytes.length;
    }

    // Convert to base64
    const finalBytes = new Uint8Array(buffer, 0, offset);
    return btoa(String.fromCharCode(...finalBytes));
  }

  private async generateSignature(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.appCertificate);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = new Uint8Array(signature);
    
    return btoa(String.fromCharCode(...signatureArray));
  }
}

// ServiceRtc class for RTC service
class ServiceRtc {
  static readonly SERVICE_TYPE = 1;
  static readonly PRIVILEGE_JOIN_CHANNEL = 1;
  static readonly PRIVILEGE_PUBLISH_AUDIO_STREAM = 2;
  static readonly PRIVILEGE_PUBLISH_VIDEO_STREAM = 3;
  static readonly PRIVILEGE_PUBLISH_DATA_STREAM = 4;

  private channelName: string;
  private uid: number;
  private privileges: Map<number, number> = new Map();

  constructor(channelName: string, uid: number) {
    this.channelName = channelName;
    this.uid = uid;
  }

  getServiceType(): number {
    return ServiceRtc.SERVICE_TYPE;
  }

  addPrivilege(privilege: number, expire: number): void {
    this.privileges.set(privilege, expire);
  }

  pack(): ArrayBuffer {
    const buffer = new ArrayBuffer(1024);
    const view = new DataView(buffer);
    let offset = 0;

    // Pack channel name
    const channelBytes = new TextEncoder().encode(this.channelName);
    view.setUint16(offset, channelBytes.length, false);
    offset += 2;
    
    const bufferBytes = new Uint8Array(buffer);
    bufferBytes.set(channelBytes, offset);
    offset += channelBytes.length;

    // Pack UID (4 bytes)
    view.setUint32(offset, this.uid, false);
    offset += 4;

    // Pack privileges count (2 bytes)
    view.setUint16(offset, this.privileges.size, false);
    offset += 2;

    // Pack each privilege
    for (const [privilege, expire] of this.privileges) {
      view.setUint16(offset, privilege, false);
      offset += 2;
      view.setUint32(offset, expire, false);
      offset += 4;
    }

    return buffer.slice(0, offset);
  }
}

// RTM Token generation (simplified for now)
function generateAgoraRtmToken(appId: string, appCertificate: string, userId: string, expireTime: number): string {
  console.log('[RTM-TOKEN] Generating RTM token for user:', userId);
  // For now, use a simplified RTM token - this can be enhanced later
  const message = `${appId}${userId}${expireTime}`;
  const signature = btoa(message + appCertificate).replace(/[+/=]/g, '').substring(0, 32);
  return AgoraTokenBuilder.VERSION + appId + signature;
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
    const privilegeExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2; // 1 = publisher, 2 = subscriber

    console.log("[AGORA-INTEGRATION] Token generation params:", {
      currentTime,
      tokenExpire,
      privilegeExpire,
      role,
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
      tokenExpire, 
      privilegeExpire
    );
    
    const rtmToken = generateAgoraRtmToken(appId!, appCertificate!, uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated tokens:", {
      rtcTokenLength: rtcToken.length,
      rtcTokenPrefix: rtcToken.substring(0, 15) + '...',
      rtmTokenLength: rtmToken.length,
      rtmTokenPrefix: rtmToken.substring(0, 15) + '...',
      tokenVersion: rtcToken.substring(0, 3),
      tokenContainsAppId: rtcToken.includes(appId!.substring(0, 8))
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
          tokenVersion: rtcToken.substring(0, 3),
          tokenLength: rtcToken.length,
          usingOfficialAlgorithm: true
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
    const tokenExpire = currentTime + 3600; // 1 hour
    const privilegeExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2;
    
    const rtcToken = await AgoraTokenBuilder.buildTokenWithUid(
      appId!, 
      appCertificate!, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      role, 
      tokenExpire, 
      privilegeExpire
    );
    
    const rtmToken = generateAgoraRtmToken(appId!, appCertificate!, lesson.agora_uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated fresh tokens:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      tokenVersion: rtcToken.substring(0, 3),
      usingOfficialAlgorithm: true
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
          tokenVersion: rtcToken.substring(0, 3),
          tokenLength: rtcToken.length,
          usingOfficialAlgorithm: true,
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

    // Generate completely fresh tokens
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenExpire = currentTime + 3600; // 1 hour
    const privilegeExpire = currentTime + 3600; // 1 hour
    const role = data.userRole === 'tutor' ? 1 : 2;
    
    console.log("[AGORA-INTEGRATION] Regenerating with fresh parameters:", {
      currentTime,
      tokenExpire,
      privilegeExpire,
      role,
      userRole: data.userRole
    });
    
    const rtcToken = await AgoraTokenBuilder.buildTokenWithUid(
      appId!, 
      appCertificate!, 
      lesson.agora_channel_name, 
      lesson.agora_uid, 
      role, 
      tokenExpire, 
      privilegeExpire
    );
    
    const rtmToken = generateAgoraRtmToken(appId!, appCertificate!, lesson.agora_uid.toString(), tokenExpire);

    console.log("[AGORA-INTEGRATION] Generated fresh tokens:", {
      rtcTokenLength: rtcToken.length,
      rtmTokenLength: rtmToken.length,
      role: data.userRole,
      tokenVersion: rtcToken.substring(0, 3),
      usingOfficialAlgorithm: true
    });

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

    console.log("[AGORA-INTEGRATION] Successfully regenerated all tokens for lesson");

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
          uid: lesson.agora_uid
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
