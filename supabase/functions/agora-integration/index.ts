
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAgoraCredentials, validateNetlessSDKToken } from "./credentials-validator.ts";
import { createVideoRoom, getTokens, regenerateTokens } from "./action-handlers.ts";
import { createFlexibleClassroomSession } from "./flexible-classroom-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log('[AGORA-INTEGRATION] Function starting up...');

serve(async (req) => {
  console.log('[AGORA-INTEGRATION] Request received:', req.method);
  
  if (req.method === "OPTIONS") {
    console.log('[AGORA-INTEGRATION] Handling OPTIONS request');
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('[AGORA-INTEGRATION] Processing request with Flexible Classroom support');
    
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
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { action, ...requestData } = requestBody;
    console.log('[AGORA-INTEGRATION] Action extracted:', action);

    // Validate required environment variables
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");
    const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

    console.log('[AGORA-INTEGRATION] Environment check:', {
      hasAppId: !!appId,
      hasAppCertificate: !!appCertificate,
      hasNetlessToken: !!netlessSDKToken,
      netlessTokenValid: netlessSDKToken ? validateNetlessSDKToken(netlessSDKToken) : false
    });

    if (!appId || !appCertificate) {
      console.error('[AGORA-INTEGRATION] Missing required credentials');
      return new Response(
        JSON.stringify({ success: false, error: "Missing Agora credentials in environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    validateAgoraCredentials(appId, appCertificate);

    console.log('[AGORA-INTEGRATION] Processing action:', action);
    
    // Handle action variations (with or without underscores)
    const normalizedAction = action?.toLowerCase().replace(/-/g, '_');
    
    switch (normalizedAction) {
      case "create_flexible_classroom":
        console.log('[AGORA-INTEGRATION] Handling create-flexible-classroom action');
        if (!requestData.lessonId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing lessonId parameter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await createFlexibleClassroomSession(requestData, supabase, appId, appCertificate);
        
      case "create_room":
        console.log('[AGORA-INTEGRATION] Handling create-room action');
        return await createVideoRoom(requestData, supabase, appId, appCertificate, netlessSDKToken);
        
      case "get_tokens":
        console.log('[AGORA-INTEGRATION] Handling get-tokens action');
        return await getTokens(requestData, supabase, appId, appCertificate, netlessSDKToken);
        
      case "regenerate_tokens":
        console.log('[AGORA-INTEGRATION] Handling regenerate-tokens action');
        return await regenerateTokens(requestData, supabase, appId, appCertificate, netlessSDKToken);
        
      default:
        console.error('[AGORA-INTEGRATION] Invalid action received:', action);
        console.error('[AGORA-INTEGRATION] Available actions: create-flexible-classroom, create-room, get-tokens, regenerate-tokens');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid action", 
            received: action,
            available: ["create-flexible-classroom", "create-room", "get-tokens", "regenerate-tokens"]
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[AGORA-INTEGRATION] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error",
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

console.log('[AGORA-INTEGRATION] Function initialization complete');
