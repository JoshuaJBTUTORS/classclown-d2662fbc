import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY');
    if (!lessonSpaceApiKey) {
      return new Response(
        JSON.stringify({ error: 'LessonSpace API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching recording URL for session: ${sessionId}`);

    // Call LessonSpace API to get session recording URL
    const lessonSpaceResponse = await fetch(`https://api.thelessonspace.com/v2/sessions/${sessionId}/playback`, {
      method: 'GET',
      headers: {
        'Authorization': `Organisation ${lessonSpaceApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!lessonSpaceResponse.ok) {
      console.error(`LessonSpace API error: ${lessonSpaceResponse.status} - ${lessonSpaceResponse.statusText}`);
      const errorText = await lessonSpaceResponse.text();
      console.error('LessonSpace API error details:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch recording from LessonSpace',
          details: `Status: ${lessonSpaceResponse.status}`,
          recording_available: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recordingData = await lessonSpaceResponse.json();
    console.log('LessonSpace recording response:', recordingData);

    const recordingUrl = recordingData.url || recordingData.recording_url;

    // Store the recording URL in the lessons table
    if (recordingUrl) {
      const { error: updateError } = await supabaseClient
        .from('lessons')
        .update({ lesson_space_recording_url: recordingUrl })
        .eq('lesson_space_session_id', sessionId);

      if (updateError) {
        console.error('Error updating lesson with recording URL:', updateError);
      } else {
        console.log('Successfully stored recording URL for session:', sessionId);
      }
    }

    return new Response(
      JSON.stringify({
        recording_url: recordingUrl,
        recording_available: true,
        expires_at: recordingData.expires_at,
        metadata: recordingData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-lessonspace-recording function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        recording_available: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});