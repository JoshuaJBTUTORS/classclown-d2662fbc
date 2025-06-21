
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
    
    // Preserve original progress object when available (finished state)
    // Only construct when missing (in-progress state)
    let progress;
    if (statusData.progress) {
      // Use existing progress object from Netless (finished state)
      progress = statusData.progress;
      console.log('Using existing progress object from Netless:', progress);
    } else {
      // Construct progress object for in-progress conversions
      progress = {
        totalPageSize: statusData.pageCount || 0,
        convertedPageSize: Math.floor((statusData.convertedPercentage || 0) / 100 * (statusData.pageCount || 0)),
        convertedPercentage: statusData.convertedPercentage || 0
      };
      console.log('Constructed progress object for in-progress conversion:', progress);
    }

    // Ensure images and prefix are properly preserved
    const images = statusData.images || {};
    const prefix = statusData.prefix || '';

    // Validation check to ensure all required fields are present
    const hasRequiredFields = {
      hasImages: Object.keys(images).length > 0 || statusData.status !== 'Finished',
      hasPrefix: prefix.length > 0 || statusData.status !== 'Finished', 
      hasProgress: progress && typeof progress.convertedPercentage === 'number'
    };

    console.log('Field validation for Fastboard compatibility:', {
      status: statusData.status,
      hasImages: hasRequiredFields.hasImages,
      hasPrefix: hasRequiredFields.hasPrefix,
      hasProgress: hasRequiredFields.hasProgress,
      imageCount: Object.keys(images).length,
      prefixLength: prefix.length,
      progressData: progress
    });

    // For finished conversions, ensure we have the required data
    if (statusData.status === 'Finished' && (!hasRequiredFields.hasImages || !hasRequiredFields.hasPrefix)) {
      console.error('Finished conversion missing required data:', {
        missingImages: !hasRequiredFields.hasImages,
        missingPrefix: !hasRequiredFields.hasPrefix,
        rawData: statusData
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Conversion completed but required data is missing',
          taskInfo: {
            uuid: statusData.uuid || taskUuid,
            type: statusData.type || 'static',
            status: 'Fail',
            failedReason: 'Conversion completed but images or prefix data is missing'
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Return the response format that Fastboard expects with preserved data
    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: statusData.uuid || taskUuid,
          type: statusData.type || 'static',
          status: statusData.status,
          failedReason: statusData.failedReason,
          // Preserve original Netless fields that Fastboard insertDocs expects
          images: images,
          prefix: prefix,
          progress: progress
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
