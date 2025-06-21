
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

    // Get Agora credentials from environment
    const agoraAppId = Deno.env.get("AGORA_APP_ID");
    const agoraAppCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!agoraAppId || !agoraAppCertificate) {
      return new Response(
        JSON.stringify({ error: "Missing Agora credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Starting Agora document conversion:', { fileName, fileUrl: fileUrl.substring(0, 50) + '...' });

    // Start conversion task with Agora API
    const conversionResponse = await fetch('https://api.agora.io/v1/apps/' + agoraAppId + '/cloud_recording/file_conversion/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(agoraAppId + ':' + agoraAppCertificate)}`
      },
      body: JSON.stringify({
        fileUrl: fileUrl,
        outputFormat: 'png', // Convert to images for display
        config: {
          outputStorage: {
            vendor: 'agora',
            region: 'us'
          }
        }
      })
    });

    if (!conversionResponse.ok) {
      const errorText = await conversionResponse.text();
      console.error('Agora conversion API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Conversion service unavailable' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const conversionData = await conversionResponse.json();
    
    console.log('Agora conversion started:', conversionData);

    // Track conversion in database
    const { error: dbError } = await supabase
      .from('document_conversions')
      .insert({
        lesson_id: lessonId,
        file_name: fileName,
        file_url: fileUrl,
        task_uuid: conversionData.taskId,
        status: 'Converting'
      });

    if (dbError) {
      console.error('Database tracking error:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskInfo: {
          uuid: conversionData.taskId,
          type: 'conversion',
          status: 'Converting'
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
