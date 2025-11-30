import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voiceId, speed = 1.0 } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    console.log(`🎙️ Streaming TTS for ${text.length} chars with voice ${voiceId} at speed ${speed}`)

    // Clamp speed to ElevenLabs range (0.7-1.2)
    const clampedSpeed = Math.max(0.7, Math.min(1.2, speed))

    // Call ElevenLabs streaming API with optimized stability settings
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=pcm_24000&optimize_streaming_latency=2`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/pcm',
          'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.70,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: false,
            speed: clampedSpeed
          }
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }

    // Create a readable stream that transforms binary chunks to base64 SSE events
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          let chunkCount = 0
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log(`✅ Stream complete. Sent ${chunkCount} chunks`)
              controller.enqueue(encoder.encode('data: {"done":true}\n\n'))
              controller.close()
              break
            }

            // Convert binary chunk to base64
            const base64Chunk = btoa(String.fromCharCode(...value))
            
            // Send as SSE event
            const event = `data: ${JSON.stringify({ chunk: base64Chunk })}\n\n`
            controller.enqueue(encoder.encode(event))
            
            chunkCount++
            if (chunkCount % 10 === 0) {
              console.log(`📦 Sent ${chunkCount} chunks...`)
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('TTS Stream error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
