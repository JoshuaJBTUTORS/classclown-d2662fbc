
import { generateTokensOfficial } from "./token-generator.ts";
import { createNetlessRoomWithToken } from "./room-manager.ts";
import { validateNetlessSDKToken } from "./credentials-validator.ts";
import { generateNetlessRoomToken } from "./netless-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function createVideoRoom(
  data: any,
  supabase: any,
  appId: string,
  appCertificate: string,
  netlessSDKToken: string
) {
  try {
    console.log("[ACTION] Creating video room for lesson:", data.lessonId);

    // Generate unique channel name (Agora allows alphanumeric and underscores, max 64 chars)
    const channelName = `lesson_${data.lessonId.replace(/-/g, '_')}`;
    const uid = Math.floor(Math.random() * 1000000) + 1000; // Ensure 4+ digit UID

    console.log("[ACTION] Channel details:", {
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

    console.log("[ACTION] Generated tokens with official implementation:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      userRole: data.userRole
    });

    // Create Netless whiteboard room and token if SDK token is available
    let netlessRoomUuid = null;
    let netlessRoomToken = null;
    let netlessAppIdentifier = null;
    
    if (netlessSDKToken && validateNetlessSDKToken(netlessSDKToken)) {
      try {
        console.log("[ACTION] Creating Netless whiteboard room with token...");
        const netlessResult = await createNetlessRoomWithToken(netlessSDKToken, data.userRole);
        
        netlessRoomUuid = netlessResult.roomUuid;
        netlessRoomToken = netlessResult.roomToken;
        netlessAppIdentifier = netlessResult.appIdentifier;
        
        console.log("[ACTION] Netless room and token created successfully:", {
          roomUuid: netlessRoomUuid,
          hasToken: !!netlessRoomToken,
          appIdentifier: netlessAppIdentifier
        });
      } catch (error) {
        console.error("[ACTION] Failed to create Netless room/token:", error);
        // Continue without whiteboard - don't fail the entire room creation
      }
    } else {
      console.warn("[ACTION] Netless SDK token not available or invalid - skipping whiteboard setup");
    }

    // Update lesson with room details
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_channel_name: channelName,
        agora_uid: tokens.uid,
        agora_token: tokens.rtcToken,
        agora_rtm_token: tokens.rtmToken,
        video_conference_provider: "agora",
        netless_room_uuid: netlessRoomUuid,
        netless_room_token: netlessRoomToken,
        netless_app_identifier: netlessAppIdentifier
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[ACTION] Error updating lesson:", updateError);
      throw updateError;
    }

    console.log("[ACTION] Video room created successfully with official implementation");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid,
        netlessRoomToken,
        netlessAppIdentifier,
        message: "Agora video room created successfully",
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
          role: data.userRole,
          validated: true,
          hasWhiteboard: !!netlessRoomUuid,
          whiteboardConfigured: !!(netlessRoomUuid && netlessRoomToken && netlessAppIdentifier)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ACTION] Error creating video room:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

export async function getTokens(
  data: any,
  supabase: any,
  appId: string,
  appCertificate: string,
  netlessSDKToken: string
) {
  try {
    console.log("[ACTION] Getting tokens for lesson:", data.lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("agora_channel_name, agora_uid, netless_room_uuid, netless_room_token, netless_app_identifier")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error("[ACTION] Lesson not found:", lessonError);
      throw new Error("Lesson not found or has no Agora room");
    }

    // If lesson doesn't have Agora room, create one
    if (!lesson.agora_channel_name) {
      console.log("[ACTION] No existing room found, creating new room");
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken);
    }

    console.log("[ACTION] Found existing room:", {
      channelName: lesson.agora_channel_name,
      uid: lesson.agora_uid,
      hasNetless: !!lesson.netless_room_uuid,
      hasNetlessToken: !!lesson.netless_room_token,
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

    // Handle Netless room token - regenerate if missing
    let netlessRoomToken = lesson.netless_room_token;
    
    if (lesson.netless_room_uuid && !netlessRoomToken && netlessSDKToken && validateNetlessSDKToken(netlessSDKToken)) {
      try {
        console.log("[ACTION] Regenerating missing Netless room token...");
        const role = data.userRole === 'tutor' ? 'admin' : 'reader';
        netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, lesson.netless_room_uuid, role);
        
        if (netlessRoomToken) {
          console.log("[ACTION] Netless room token regenerated successfully");
          
          // Update lesson with the new token
          await supabase
            .from("lessons")
            .update({ netless_room_token: netlessRoomToken })
            .eq("id", data.lessonId);
        } else {
          console.error("[ACTION] Failed to regenerate Netless room token - null returned");
        }
      } catch (error) {
        console.error("[ACTION] Failed to regenerate Netless room token:", error);
        // Continue without whiteboard token - don't fail the entire request
      }
    } else if (lesson.netless_room_uuid && netlessRoomToken) {
      console.log("[ACTION] Using existing Netless room token");
    }

    console.log("[ACTION] Generated fresh tokens with official implementation:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      role: data.userRole,
      hasWhiteboardToken: !!netlessRoomToken
    });

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
          channelName: lesson.agora_channel_name,
          uid: tokens.uid,
          validated: true,
          hasWhiteboard: !!lesson.netless_room_uuid,
          whiteboardConfigured: !!(lesson.netless_room_uuid && netlessRoomToken && lesson.netless_app_identifier)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ACTION] Error getting tokens:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

export async function regenerateTokens(
  data: any,
  supabase: any,
  appId: string,
  appCertificate: string,
  netlessSDKToken: string
) {
  try {
    console.log("[ACTION] Regenerating tokens for lesson:", data.lessonId);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("agora_channel_name, agora_uid, netless_room_uuid, netless_app_identifier")
      .eq("id", data.lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error("[ACTION] Lesson not found:", lessonError);
      throw new Error("Lesson not found or has no Agora room");
    }

    // If lesson doesn't have Agora room, create one
    if (!lesson.agora_channel_name) {
      console.log("[ACTION] No existing room found, creating new room");
      return await createVideoRoom(data, supabase, appId, appCertificate, netlessSDKToken);
    }

    console.log("[ACTION] Regenerating tokens for existing room:", {
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

    // Generate fresh Netless room token if room exists
    let netlessRoomToken = null;
    if (lesson.netless_room_uuid && netlessSDKToken && validateNetlessSDKToken(netlessSDKToken)) {
      try {
        console.log("[ACTION] Regenerating Netless room token...");
        const role = data.userRole === 'tutor' ? 'admin' : 'reader';
        netlessRoomToken = await generateNetlessRoomToken(netlessSDKToken, lesson.netless_room_uuid, role);
        
        if (netlessRoomToken) {
          console.log("[ACTION] Netless room token regenerated successfully");
        } else {
          console.error("[ACTION] Failed to regenerate Netless room token - null returned");
        }
      } catch (error) {
        console.error("[ACTION] Failed to regenerate Netless room token:", error);
        // Continue without whiteboard token - don't fail the entire request
      }
    }

    console.log("[ACTION] Generated fresh tokens with official implementation:", {
      rtcTokenLength: tokens.rtcToken.length,
      rtmTokenLength: tokens.rtmToken.length,
      role: data.userRole,
      hasWhiteboardToken: !!netlessRoomToken
    });

    // Update lesson with fresh tokens
    const { error: updateError } = await supabase
      .from("lessons")
      .update({
        agora_token: tokens.rtcToken,
        agora_rtm_token: tokens.rtmToken,
        agora_uid: tokens.uid,
        netless_room_token: netlessRoomToken,
        video_conference_provider: "agora"
      })
      .eq("id", data.lessonId);

    if (updateError) {
      console.error("[ACTION] Error updating lesson with fresh tokens:", updateError);
      throw updateError;
    }

    console.log("[ACTION] Successfully regenerated all tokens for lesson with official implementation");

    return new Response(
      JSON.stringify({
        success: true,
        appId,
        channelName: lesson.agora_channel_name,
        uid: tokens.uid,
        rtcToken: tokens.rtcToken,
        rtmToken: tokens.rtmToken,
        netlessRoomUuid: lesson.netless_room_uuid,
        netlessRoomToken,
        netlessAppIdentifier: lesson.netless_app_identifier,
        role: data.userRole === 'tutor' ? 'publisher' : 'subscriber',
        regenerated: true,
        debug: {
          tokenLength: tokens.rtcToken.length,
          officialImplementation: true,
          channelName: lesson.agora_channel_name,
          uid: tokens.uid,
          validated: true,
          hasWhiteboard: !!lesson.netless_room_uuid,
          whiteboardConfigured: !!(lesson.netless_room_uuid && netlessRoomToken && lesson.netless_app_identifier)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ACTION] Error regenerating tokens:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
