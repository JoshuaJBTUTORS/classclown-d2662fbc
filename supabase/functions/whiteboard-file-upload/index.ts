
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    console.log('Received upload request:', {
      lessonId: lessonId?.substring(0, 8) + '...',
      fileName,
      fileType,
      contentLength: fileContent?.length
    });

    // Validate inputs
    if (!lessonId || !fileName || !fileType || !fileContent) {
      console.error('Missing required parameters:', { lessonId: !!lessonId, fileName: !!fileName, fileType: !!fileType, fileContent: !!fileContent });
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file type at application level
    const validImageExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    const validDocExtensions = ['pdf', 'ppt', 'pptx', 'doc', 'docx'];
    const validExtensions = fileType === 'image' ? validImageExtensions : validDocExtensions;
    
    const fileExtension = fileName.toLowerCase().split('.').pop();
    if (!validExtensions.includes(fileExtension || '')) {
      console.error('Invalid file extension:', fileExtension, 'for type:', fileType);
      return new Response(
        JSON.stringify({ error: `Invalid ${fileType} file type. Allowed extensions: ${validExtensions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create storage bucket without MIME type restrictions
    const { error: bucketError } = await supabase.storage.createBucket('whiteboard-files', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      // Removed allowedMimeTypes to avoid MIME type detection issues
    });

    // Ignore error if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Bucket creation error:', bucketError);
    }

    // Parse base64 data with improved error handling
    const base64Match = fileContent.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      console.error('Invalid base64 format, trying fallback parsing');
      // Fallback: assume it's already base64 without data URI
      const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
      if (!base64Data) {
        return new Response(
          JSON.stringify({ error: 'Invalid file content format' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const base64Data = base64Match ? base64Match[2] : (fileContent.includes(',') ? fileContent.split(',')[1] : fileContent);
    
    // Convert base64 to binary with better error handling
    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('Binary conversion successful, size:', binaryData.length);
    } catch (error) {
      console.error('Failed to decode base64:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to decode file content' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine MIME type from file extension with comprehensive mapping
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes: { [key: string]: string } = {
        // Images
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        // Documents
        'pdf': 'application/pdf',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      return mimeTypes[ext || ''] || 'application/octet-stream';
    };

    const contentType = getContentType(fileName);
    console.log('Determined content type:', contentType, 'for file:', fileName);
    
    // Upload file to storage with enhanced options
    const filePath = `lesson-${lessonId}/${fileType}s/${Date.now()}-${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whiteboard-files')
      .upload(filePath, binaryData, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false,
        duplex: 'half' // Help with binary uploads
      });

    if (uploadError) {
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        cause: uploadError.cause,
        filePath,
        contentType,
        fileSize: binaryData.length
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to upload file: ' + uploadError.message,
          details: {
            filePath,
            contentType,
            fileSize: binaryData.length
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Upload successful:', {
      filePath: uploadData.path,
      contentType,
      size: binaryData.length
    });

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
      console.error('Database tracking error:', dbError);
      // Don't fail the request if DB tracking fails
    }

    console.log('File upload completed successfully:', {
      filePath,
      url: urlData.publicUrl,
      size: binaryData.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        filePath: filePath,
        fileSize: binaryData.length,
        contentType: contentType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: 'function_error'
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
