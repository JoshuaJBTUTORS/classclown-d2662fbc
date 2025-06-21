
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

    const { lessonId, fileName, fileType, fileContent } = await req.json();

    // Validate inputs
    if (!lessonId || !fileName || !fileType || !fileContent) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create storage bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('whiteboard-files', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
        'application/pdf', 'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    // Ignore error if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Bucket creation error:', bucketError);
    }

    // Convert base64 to blob with proper MIME type detection
    const base64Data = fileContent.split(',')[1];
    if (!base64Data) {
      return new Response(
        JSON.stringify({ error: 'Invalid file content format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Determine MIME type from file extension as fallback
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes: { [key: string]: string } = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    const contentType = getContentType(fileName);
    
    // Upload file to storage with proper content type
    const filePath = `lesson-${lessonId}/${fileType}s/${Date.now()}-${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whiteboard-files')
      .upload(filePath, binaryData, {
        contentType: contentType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file: ' + uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('whiteboard-files')
      .getPublicUrl(filePath);

    // Track file in database
    const { error: dbError } = await supabase
      .from('whiteboard_files')
      .insert({
        lesson_id: lessonId,
        file_path: filePath,
        file_type: fileType,
        file_name: fileName,
        file_size: binaryData.length,
        uploaded_by: req.headers.get('authorization')?.replace('Bearer ', '')
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB tracking fails
    }

    console.log('File uploaded successfully:', {
      filePath,
      contentType,
      size: binaryData.length,
      url: urlData.publicUrl
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        filePath: filePath
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
