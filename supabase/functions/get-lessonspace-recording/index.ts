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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
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
    const lessonSpaceResponse = await fetch(`https://api.thelessonspace.com/v2/sessions/${sessionId}/recording`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${lessonSpaceApiKey}`,
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

    return new Response(
      JSON.stringify({
        recording_url: recordingData.url || recordingData.recording_url,
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