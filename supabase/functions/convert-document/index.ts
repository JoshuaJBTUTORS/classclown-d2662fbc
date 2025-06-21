
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { lessonId, fileUrl, fileName } = await req.json();

    if (!lessonId || !fileUrl || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Netless SDK token from environment
    const netlessSDKToken = Deno.env.get("NETLESS_SDK_TOKEN");

    if (!netlessSDKToken) {
      return new Response(
        JSON.stringify({ error: "Missing Netless SDK token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Starting Netless document conversion:', { fileName, fileUrl: fileUrl.substring(0, 50) + '...' });

    // Start conversion task with Netless API
    const conversionResponse = await fetch('https://api.netless.link/v5/projector/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': netlessSDKToken,
        'region': 'us-sv'
      },
      body: JSON.stringify({
        resource: fileUrl,
        type: 'static', // Convert to static images
        preview: true, // Generate previews
        outputFormat: 'png', // Use PNG format
        scale: 1.2 // Higher quality images
      })
    });

    if (!conversionResponse.ok) {
      const errorText = await conversionResponse.text();
      console.error('Netless conversion API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Document conversion service unavailable' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const conversionData = await conversionResponse.json();
    
    console.log('✅ Netless conversion request submitted successfully:', {
      taskUuid: conversionData.uuid,
      status: conversionData.status || 'Waiting',
      fileName
    });

    // Track conversion in database
    const { error: dbError } = await supabase
      .from('document_conversions')
      .insert({
        lesson_id: lessonId,
        file_name: fileName,
        file_url: fileUrl,
        task_uuid: conversionData.uuid,
        status: conversionData.status || 'Waiting'
      });

    if (dbError) {
      console.error('Database tracking error:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: conversionData.uuid,
          type: 'conversion',
          status: conversionData.status || 'Waiting'
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Document conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
