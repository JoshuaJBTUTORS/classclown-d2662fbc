
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
      Devo.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find expired files
    const { data: expiredFiles, error: fetchError } = await supabase
      .from('whiteboard_files')
      .select('*')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    let deletedCount = 0;
    
    for (const file of expiredFiles || []) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('whiteboard-files')
        .remove([file.file_path]);

      if (!storageError) {
        // Delete from database
        const { error: dbError } = await supabase
          .from('whiteboard_files')
          .delete()
          .eq('id', file.id);

        if (!dbError) {
          deletedCount++;
        }
      }
    }

    console.log(`Cleaned up ${deletedCount} expired whiteboard files`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Cleaned up ${deletedCount} expired files` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
