import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const VOICE_ID = 'Tx7VLgfksXHVnoY6jDGU'; // Cleo's voice

    // Filler phrases to generate
    const fillerPhrases = [
      "Okay, let's see...",
      "Alright, looking at your answer...",
      "Hmm, let me think about that...",
      "Right, so...",
      "Okay, so...",
    ];

    const results: Array<{ text: string; audio: string }> = [];

    // Generate audio for each filler
    for (const phrase of fillerPhrases) {
      console.log(`🎙️ Generating: "${phrase}"`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_22050_32&optimize_streaming_latency=4`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: phrase,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: false,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${await response.text()}`);
      }

      // Convert to base64
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(audioBuffer))
      );

      results.push({
        text: phrase,
        audio: base64Audio,
      });

      console.log(`✅ Generated: "${phrase}" (${base64Audio.length} chars)`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        fillers: results,
        message: 'Copy these base64 strings into src/assets/audio/cleoFillers.ts'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating filler audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
