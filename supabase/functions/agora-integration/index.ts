
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash, createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AGORA-INTEGRATION] ${step}${detailsStr}`);
};

// Generate RTC Token for video/audio
function generateRTCToken(appId: string, appCertificate: string, channelName: string, uid: number, role: 'publisher' | 'subscriber', expirationTimeInSeconds: number = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + expirationTimeInSeconds;
  
  // Role mapping: publisher = 1, subscriber = 2
  const roleNum = role === 'publisher' ? 1 : 2;
  
  // Create message
  const message = appId + channelName + uid.toString() + expireTime.toString();
  
  // Generate signature
  const signature = createHmac('sha256', appCertificate)
    .update(message)
    .digest('hex');
  
  // Create token
  const tokenData = {
    signature,
    cname: channelName,
    uid,
    expire: expireTime,
    role: roleNum
  };
  
  const token = btoa(JSON.stringify(tokenData));
  return `007${token}`;
}

// Generate RTM Token for messaging
function generateRTMToken(appId: string, appCertificate: string, userId: string, expirationTimeInSeconds: number = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const expireTime = now + expirationTimeInSeconds;
  
  const message = appId + userId + expireTime.toString();
  const signature = createHmac('sha256', appCertificate)
    .update(message)
    .digest('hex');
  
  const tokenData = {
    signature,
    userId,
    expire: expireTime
  };
  
  const token = btoa(JSON.stringify(tokenData));
  return `006${token}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Starting Agora integration request");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        } 
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lessonId, action, userRole } = await req.json();

    if (!lessonId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing lessonId or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Processing request", { lessonId, action, userRole });

    // Get Agora credentials from environment
    const agoraAppId = Deno.env.get("AGORA_APP_ID");
    const agoraAppCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!agoraAppId || !agoraAppCertificate) {
      return new Response(
        JSON.stringify({ error: "Agora credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case 'create_room': {
        // Generate unique channel name and UID
        const channelName = `lesson_${lessonId}_${Date.now()}`;
        const uid = Math.floor(Math.random() * 1000000) + 1;
        
        // Generate tokens
        const rtcToken = generateRTCToken(agoraAppId, agoraAppCertificate, channelName, uid, 'publisher');
        const rtmToken = generateRTMToken(agoraAppId, agoraAppCertificate, user.id);
        
        // Update lesson with Agora details
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            agora_channel_name: channelName,
            agora_token: rtcToken,
            agora_uid: uid,
            agora_rtm_token: rtmToken,
            video_conference_provider: 'agora'
          })
          .eq('id', lessonId);

        if (updateError) {
          throw updateError;
        }

        logStep("Created Agora room", { channelName, uid });

        return new Response(
          JSON.stringify({
            success: true,
            channelName,
            rtcToken,
            rtmToken,
            uid,
            appId: agoraAppId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'get_tokens': {
        // Generate new tokens for existing room
        if (!lesson.agora_channel_name || !lesson.agora_uid) {
          return new Response(
            JSON.stringify({ error: "Room not created yet" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const role = userRole === 'tutor' ? 'publisher' : 'subscriber';
        const uid = userRole === 'tutor' ? lesson.agora_uid : Math.floor(Math.random() * 1000000) + 1;
        
        const rtcToken = generateRTCToken(agoraAppId, agoraAppCertificate, lesson.agora_channel_name, uid, role);
        const rtmToken = generateRTMToken(agoraAppId, agoraAppCertificate, user.id);

        logStep("Generated tokens", { channelName: lesson.agora_channel_name, uid, role });

        return new Response(
          JSON.stringify({
            success: true,
            channelName: lesson.agora_channel_name,
            rtcToken,
            rtmToken,
            uid,
            appId: agoraAppId,
            role
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'start_recording': {
        // This would integrate with Agora Cloud Recording
        // For now, we'll just update the status
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            agora_recording_status: 'recording'
          })
          .eq('id', lessonId);

        if (updateError) {
          throw updateError;
        }

        logStep("Started recording", { lessonId });

        return new Response(
          JSON.stringify({ success: true, message: "Recording started" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'stop_recording': {
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            agora_recording_status: 'stopped'
          })
          .eq('id', lessonId);

        if (updateError) {
          throw updateError;
        }

        logStep("Stopped recording", { lessonId });

        return new Response(
          JSON.stringify({ success: true, message: "Recording stopped" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error) {
    logStep("Error in Agora integration", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
