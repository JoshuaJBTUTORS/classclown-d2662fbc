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
    console.log("Connecting to OpenAI Realtime API...");
    const openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      [
        'realtime',
        `openai-insecure-api-key.${OPENAI_API_KEY}`,
        'openai-beta.realtime-v1'
      ]
    );
    console.log("OpenAI WebSocket connection initiated with subprotocol authentication");

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
          ? `You are Cleo, a friendly and encouraging AI tutor teaching ${conversation.topic} to a ${conversation.year_group} student.

        You have access to visual content tools that let you display information to the student:
        - show_table: Display tabular data with headers and rows
        - show_definition: Show a definition card for key terms
        - ask_question: Present interactive multiple-choice questions

Teaching style:
- Start by introducing the lesson naturally
- USE YOUR TOOLS to show visual content instead of just describing it
- Example: Instead of saying "let me explain atoms", call show_definition with term="Atom" and definition="..."
- Example: Instead of saying "here's a comparison", call show_table with the comparison data
- After showing a question, wait for the student's answer before continuing
- Provide clear explanations with visual aids
- Break down complex topics into simple steps
- Be patient and supportive

Keep spoken responses conversational and under 3 sentences unless explaining something complex.`
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
            tools: [
              {
                type: "function",
                name: "show_table",
                description: "Display a table with headers and rows of data. Use this when you want to present structured information visually.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { 
                      type: "string", 
                      description: "Unique ID for this table (e.g., 'periodic-table-basics')" 
                    },
                    headers: {
                      type: "array",
                      items: { type: "string" },
                      description: "Column headers for the table"
                    },
                    rows: {
                      type: "array",
                      items: {
                        type: "array",
                        items: { type: "string" }
                      },
                      description: "Array of rows, each row is an array of cell values"
                    }
                  },
                  required: ["id", "headers", "rows"]
                }
              },
              {
                type: "function",
                name: "show_definition",
                description: "Display a definition card for a key term or concept.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Unique ID for this definition" },
                    term: { type: "string", description: "The term being defined" },
                    definition: { type: "string", description: "The definition text" },
                    example: { type: "string", description: "Optional example to illustrate the term" }
                  },
                  required: ["id", "term", "definition"]
                }
              },
              {
                type: "function",
                name: "ask_question",
                description: "Present an interactive multiple-choice question to the student.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    question: { type: "string", description: "The question text" },
                    options: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          text: { type: "string" },
                          isCorrect: { type: "boolean" }
                        },
                        required: ["id", "text", "isCorrect"]
                      }
                    },
                    explanation: { type: "string", description: "Explanation shown after answering" }
                  },
                  required: ["id", "question", "options"]
                }
              }
            ],
            tool_choice: "auto",
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

      // Handle function calls from the AI
      if (message.type === 'response.function_call_arguments.done') {
        const functionName = message.name;
        const args = JSON.parse(message.arguments);
        
        console.log(`🎨 Function called: ${functionName}`, args);
        
        // Map function calls to content blocks
        let contentBlock: any = null;
        
        if (functionName === 'show_table') {
          contentBlock = {
            id: args.id,
            stepId: 'current',
            type: 'table',
            data: {
              headers: args.headers,
              rows: args.rows
            },
            visible: false
          };
        } else if (functionName === 'show_definition') {
          contentBlock = {
            id: args.id,
            stepId: 'current',
            type: 'definition',
            data: {
              term: args.term,
              definition: args.definition,
              example: args.example
            },
          visible: false
        };
      } else if (functionName === 'ask_question') {
          contentBlock = {
            id: args.id,
            stepId: 'current',
            type: 'question',
            data: {
              id: args.id,
              question: args.question,
              options: args.options,
              explanation: args.explanation
            },
            visible: false
          };
        }
        
        // Send the content block to the frontend
        if (contentBlock && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'content.block',
            block: contentBlock,
            autoShow: true
          }));
          console.log(`✅ Sent content block to frontend: ${contentBlock.type} (${contentBlock.id})`);
        }
        
        // Send function response back to OpenAI
        openAISocket.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: message.call_id,
            output: JSON.stringify({ success: true, displayed: true })
          }
        }));
        
        openAISocket.send(JSON.stringify({
          type: 'response.create'
        }));
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
