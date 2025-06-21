
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { taskUuid } = await req.json();

    if (!taskUuid) {
      return new Response(
        JSON.stringify({ error: "Missing task UUID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agoraAppId = Deno.env.get("AGORA_APP_ID");
    const agoraAppCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!agoraAppId || !agoraAppCertificate) {
      return new Response(
        JSON.stringify({ error: "Missing Agora credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check conversion status with Agora API
    const statusResponse = await fetch(`https://api.agora.io/v1/apps/${agoraAppId}/cloud_recording/file_conversion/tasks/${taskUuid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(agoraAppId + ':' + agoraAppCertificate)}`
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Agora status API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Status check failed' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: taskUuid,
          type: 'conversion',
          status: statusData.status,
          progress: statusData.progress,
          convertedFileList: statusData.convertedFileList,
          failedReason: statusData.failedReason
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Conversion status error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
