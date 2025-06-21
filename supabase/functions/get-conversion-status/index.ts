
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

    const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

    if (!netlessSDKToken) {
      return new Response(
        JSON.stringify({ error: "Missing Netless SDK token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check conversion status with Netless API
    const statusResponse = await fetch(`https://api.netless.link/v5/projector/tasks/${taskUuid}`, {
      method: 'GET',
      headers: {
        'token': netlessSDKToken,
        'region': 'us-sv'
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Netless status API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Status check failed' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusData = await statusResponse.json();
    console.log('Raw Netless response:', statusData);
    
    // Return the raw Netless response format that Fastboard expects
    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: statusData.uuid || taskUuid,
          type: statusData.type || 'static',
          status: statusData.status,
          failedReason: statusData.failedReason,
          // Raw Netless fields that Fastboard insertDocs expects
          images: statusData.images || {},
          prefix: statusData.prefix || '',
          progress: {
            totalPageSize: statusData.progress?.totalPageSize || 0,
            convertedPageSize: statusData.progress?.convertedPageSize || 0,
            convertedPercentage: statusData.progress?.convertedPercentage || 0
          }
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
