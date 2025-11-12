
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('✅ Successfully retrieved Netless status:', {
      taskUuid,
      status: statusData.status,
      convertedPercentage: statusData.convertedPercentage,
      hasImages: !!statusData.images,
      hasPrefix: !!statusData.prefix
    });
    
    // Return the raw Netless response with minimal transformation
    // The Netless API already provides the correct format for Fastboard
    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: statusData.uuid || taskUuid,
          type: statusData.type || 'static',
          status: statusData.status,
          failedReason: statusData.failedReason,
          // Pass through all Netless fields directly
          images: statusData.images,
          prefix: statusData.prefix,
          pageCount: statusData.pageCount,
          convertedPercentage: statusData.convertedPercentage,
          previews: statusData.previews,
          note: statusData.note
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
