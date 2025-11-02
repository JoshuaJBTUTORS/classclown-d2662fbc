import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Log API key presence for debugging (without exposing the value)
if (!OPENAI_API_KEY) {
  console.error("FATAL: OPENAI_API_KEY environment variable is NOT set");
} else {
  console.log(`✅ OPENAI_API_KEY present (length: ${OPENAI_API_KEY.length}, starts with: ${OPENAI_API_KEY.substring(0, 7)}...)`);
}

interface RealtimeSession {
  conversationId: string;
  userId: string;
  openAISocket: WebSocket;
  clientSocket: WebSocket;
}

Deno.serve(async (req) => {
  // Only allow WebSocket upgrades
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  try {
    // Get auth token from query params or headers
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return new Response("Missing authentication token", { status: 401 });
    }

    // Verify user with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("User authenticated:", user.id);

    // Get or create conversation
    const conversationId = url.searchParams.get("conversationId");
    let conversation;

    if (conversationId) {
      const { data } = await supabase
        .from('cleo_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data;
    }

    if (!conversation) {
      const { data, error } = await supabase
        .from('cleo_conversations')
        .insert({
          user_id: user.id,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating conversation:", error);
        return new Response("Failed to create conversation", { status: 500 });
      }
      conversation = data;
    }

    console.log("Conversation ready:", conversation.id);

    // Upgrade client connection
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API with correct Deno WebSocket syntax
    let openAISocket: WebSocket;
    try {
      openAISocket = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        [],
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
          }
        }
      );
      console.log("OpenAI WebSocket connection initiated");
    } catch (error) {
      console.error("Failed to create OpenAI WebSocket:", error);
      clientSocket.onopen = () => {
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: 'Failed to connect to AI service'
        }));
        clientSocket.close();
      };
      return response;
    }

    const session: RealtimeSession = {
      conversationId: conversation.id,
      userId: user.id,
      openAISocket,
      clientSocket
    };

    let isSessionConfigured = false;
    let currentTranscript = '';
    let currentAssistantMessage = '';

    // Handle OpenAI socket events
    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      clientSocket.send(JSON.stringify({
        type: 'connection.status',
        status: 'connected',
        conversationId: conversation.id
      }));
    };

    openAISocket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("OpenAI event:", message.type);

      // Handle error events from OpenAI
      if (message.type === 'error') {
        console.error("🚨 OpenAI ERROR EVENT:", JSON.stringify(message, null, 2));
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'server_error',
            details: message,
            error: message.error?.message || message.message || 'Unknown OpenAI error'
          }));
        }
        return;
      }

      // Configure session after connection
      if (message.type === 'session.created' && !isSessionConfigured) {
        const systemPrompt = conversation.topic && conversation.year_group
          ? `You are Cleo, a friendly and encouraging AI tutor. You're currently teaching ${conversation.topic} to a ${conversation.year_group} student. 
             
             Teaching style:
             - Ask questions to check understanding
             - Provide clear, age-appropriate explanations
             - Encourage the student with positive feedback
             - Break down complex topics into simple steps
             - Use examples relevant to their age group
             - Be patient and supportive
             
             Keep responses conversational and under 3 sentences unless explaining something complex.`
          : `You are Cleo, a friendly AI tutor. Help the student learn by asking questions and providing clear explanations. Keep responses brief and conversational.`;

        openAISocket.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: systemPrompt,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700
            },
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        }));
        
        isSessionConfigured = true;
        console.log("Session configured");
      }

      // Save student transcript to database
      if (message.type === 'conversation.item.input_audio_transcription.completed') {
        currentTranscript = message.transcript;
        console.log("Student said:", currentTranscript);
        
        await supabase.from('cleo_messages').insert({
          conversation_id: session.conversationId,
          role: 'user',
          content: currentTranscript
        });
      }

      // Accumulate assistant response
      if (message.type === 'response.audio_transcript.delta') {
        currentAssistantMessage += message.delta;
      }

      // Save assistant message when complete
      if (message.type === 'response.audio_transcript.done') {
        if (currentAssistantMessage) {
          console.log("Cleo said:", currentAssistantMessage);
          await supabase.from('cleo_messages').insert({
            conversation_id: session.conversationId,
            role: 'assistant',
            content: currentAssistantMessage
          });
          currentAssistantMessage = '';
        }
      }

      // Forward all events to client
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("🚨 OpenAI WebSocket ERROR:", error);
      console.error("Error type:", error?.type);
      console.error("Error target:", error?.target);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: 'Connection to AI service failed - check Edge Function logs for details'
        }));
      }
    };

    openAISocket.onclose = () => {
      console.log("OpenAI socket closed");
      clientSocket.close();
    };

    // Handle client socket events
    clientSocket.onopen = () => {
      console.log("Client connected");
    };

    clientSocket.onmessage = (event) => {
      // Forward client messages to OpenAI
      try {
        if (openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
        } else {
          console.warn("OpenAI socket not ready, message dropped");
        }
      } catch (error) {
        console.error("Error forwarding message to OpenAI:", error);
      }
    };

    clientSocket.onclose = () => {
      console.log("Client disconnected");
      openAISocket.close();
    };

    clientSocket.onerror = (error) => {
      console.error("Client socket error:", error);
      openAISocket.close();
    };

    return response;

  } catch (error) {
    console.error("Error setting up WebSocket:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
