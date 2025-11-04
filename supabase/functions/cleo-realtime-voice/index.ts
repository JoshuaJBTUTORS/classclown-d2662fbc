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

    // Fetch user profile for personalized greeting
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.first_name || 'there';
    console.log("User name:", userName);

    // Get or create conversation
    const conversationId = url.searchParams.get("conversationId");
    const topic = url.searchParams.get("topic");
    const yearGroup = url.searchParams.get("yearGroup");
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
          status: 'active',
          topic: topic || null,
          year_group: yearGroup || null
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

    // Fetch lesson details if this is a lesson-based conversation
    let lessonTitle = conversation.topic;
    let lessonDescription = '';

    if (conversation.lesson_id) {
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('title, description')
        .eq('id', conversation.lesson_id)
        .single();
      
      if (lessonData) {
        lessonTitle = lessonData.title;
        lessonDescription = lessonData.description || '';
        console.log("Lesson details:", { lessonTitle, hasDescription: !!lessonDescription });
      }
    }

    // Upgrade client connection
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API using subprotocol authentication
    console.log("🔌 ATTEMPTING to connect to OpenAI Realtime API...");
    console.log(`📋 Connection details:
      - Model: gpt-4o-realtime-preview-2024-10-01
      - API Key present: ${!!OPENAI_API_KEY}
      - API Key length: ${OPENAI_API_KEY?.length}
      - WebSocket URL: wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`);
    
    let openAISocket: WebSocket;
    let connectionTimeout: number;
    
    try {
      openAISocket = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        [
          'realtime',
          `openai-insecure-api-key.${OPENAI_API_KEY}`,
          'openai-beta.realtime-v1'
        ]
      );
      console.log("✅ OpenAI WebSocket object created successfully");
      
      // Set connection timeout - if onopen doesn't fire in 10 seconds, something is wrong
      connectionTimeout = setTimeout(() => {
        if (openAISocket.readyState !== WebSocket.OPEN) {
          console.error("⏱️ CONNECTION TIMEOUT: OpenAI WebSocket did not open within 10 seconds");
          console.error(`Current WebSocket state: ${openAISocket.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`);
          openAISocket.close();
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'error',
              error: 'Connection to AI service timed out after 10 seconds'
            }));
            clientSocket.close();
          }
        }
      }, 10000);
    } catch (error) {
      console.error("❌ FAILED to create OpenAI WebSocket:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error?.message);
      throw error;
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
      clearTimeout(connectionTimeout);
      console.log("✅✅✅ SUCCESSFULLY CONNECTED to OpenAI Realtime API");
      console.log(`WebSocket state: ${openAISocket.readyState} (should be 1 = OPEN)`);
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'connection.status',
          status: 'connected',
          conversationId: conversation.id
        }));
      }
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
          ? `You are Cleo, a friendly and encouraging AI tutor teaching ${conversation.topic} to a ${conversation.year_group} student.

CONTENT MARKERS - Use these to trigger visual content displays:
- Say "[SHOW_TABLE:table-id]" to display a table
- Say "[SHOW_QUESTION:question-id]" to present an interactive question
- Say "[SHOW_DEFINITION:definition-id]" to display a definition card
- Say "[NEXT_STEP]" when moving to the next lesson step
- Say "[COMPLETE_STEP:step-id]" when finishing a step

Teaching style:
- Start by introducing the lesson structure and steps
- Use content markers naturally in your speech
- For tables: "Let me show you this [SHOW_TABLE:definition-table]"
- For questions: "Here's a question for you [SHOW_QUESTION:q1]"
- Wait for student answers before continuing after questions
- Provide clear explanations with visual aids
- Break down complex topics into simple steps
- Be patient and supportive

Keep responses conversational and under 3 sentences unless explaining something complex.`
          : `You are Cleo, a friendly AI tutor. Help the student learn by asking questions and providing clear explanations. Keep responses brief and conversational.`;

        openAISocket.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: systemPrompt,
            voice: 'ballad',
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

        // Send initial greeting message
        const greetingText = lessonTitle 
          ? `Hi ${userName}! I'm Cleo, your AI tutor. I'm excited to help you learn about ${lessonTitle} today!${lessonDescription ? ` ${lessonDescription}` : ''} Let's dive in - what would you like to explore first?`
          : `Hi ${userName}! I'm Cleo, your AI tutor. I'm here to help you learn. What would you like to study today?`;

        console.log("Sending initial greeting:", greetingText);

        // Create a conversation item with the greeting prompt
        openAISocket.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: greetingText
              }
            ]
          }
        }));

        // Immediately trigger a response so Cleo speaks the greeting
        openAISocket.send(JSON.stringify({
          type: 'response.create'
        }));

        // Save the greeting prompt to database as a system message
        await supabase.from('cleo_messages').insert({
          conversation_id: conversation.id,
          role: 'system',
          content: `Initial greeting prompt: ${greetingText}`
        });

        console.log("Initial greeting sent to OpenAI");
      }

      // Cancel AI response when user starts speaking (interruption)
      if (message.type === 'input_audio_buffer.speech_started') {
        console.log("User started speaking - cancelling AI response");
        openAISocket.send(JSON.stringify({
          type: 'response.cancel'
        }));
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

      // Accumulate assistant response and detect content markers
      if (message.type === 'response.audio_transcript.delta') {
        currentAssistantMessage += message.delta;
        
        // Detect content markers in the transcript
        const text = currentAssistantMessage;
        
        // Check for table marker
        const tableMatch = text.match(/\[SHOW_TABLE:(\w+-?\w*)\]/);
        if (tableMatch && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.marker',
            data: {
              type: 'show_content',
              contentId: tableMatch[1]
            }
          }));
        }
        
        // Check for question marker
        const questionMatch = text.match(/\[SHOW_QUESTION:(\w+-?\w*)\]/);
        if (questionMatch && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.marker',
            data: {
              type: 'ask_question',
              questionId: questionMatch[1]
            }
          }));
        }
        
        // Check for definition marker
        const definitionMatch = text.match(/\[SHOW_DEFINITION:(\w+-?\w*)\]/);
        if (definitionMatch && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.marker',
            data: {
              type: 'show_content',
              contentId: definitionMatch[1]
            }
          }));
        }
        
        // Check for next step marker
        if (text.includes('[NEXT_STEP]') && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.marker',
            data: {
              type: 'next_step'
            }
          }));
        }
        
        // Check for complete step marker
        const completeStepMatch = text.match(/\[COMPLETE_STEP:(\w+-?\w*)\]/);
        if (completeStepMatch && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.marker',
            data: {
              type: 'complete_step',
              stepId: completeStepMatch[1]
            }
          }));
        }
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
      console.log('📥 OpenAI -> Client:', message.type);
      
      if (message.type === 'response.audio.delta') {
        console.log('🔊 Sending audio chunk to client');
      }
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error("🚨🚨🚨 OpenAI WebSocket ERROR EVENT FIRED");
      console.error("Error event type:", error?.type);
      console.error("Error constructor:", error?.constructor?.name);
      console.error("WebSocket readyState:", openAISocket.readyState);
      console.error("WebSocket URL:", openAISocket.url);
      
      // Try to extract any error details
      const errorDetails: any = {
        type: error?.type,
        target: error?.target?.constructor?.name,
        readyState: openAISocket.readyState,
        url: openAISocket.url
      };
      
      // Log full error object structure
      try {
        console.error("Error object keys:", Object.keys(error || {}));
        console.error("Error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      } catch (e) {
        console.error("Could not stringify error:", e);
      }
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'error',
          error: 'Connection to AI service failed',
          details: errorDetails
        }));
      }
    };

    openAISocket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      console.log("🔴 OpenAI WebSocket CLOSED");
      console.log(`Close code: ${event.code}`);
      console.log(`Close reason: ${event.reason || '(no reason provided)'}`);
      console.log(`Was clean: ${event.wasClean}`);
      
      // Common WebSocket close codes:
      // 1000 = Normal closure
      // 1001 = Going away
      // 1006 = Abnormal closure (no close frame)
      // 1008 = Policy violation
      // 1011 = Server error
      
      if (event.code !== 1000) {
        console.error(`⚠️ Abnormal close! Code ${event.code} may indicate a connection problem`);
      }
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };

    // Handle client socket events
    clientSocket.onopen = () => {
      console.log("Client connected");
    };

    clientSocket.onmessage = (event) => {
      // Forward client messages to OpenAI
      try {
        const msg = JSON.parse(event.data);
        console.log('📤 Client -> OpenAI:', msg.type);
        
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
