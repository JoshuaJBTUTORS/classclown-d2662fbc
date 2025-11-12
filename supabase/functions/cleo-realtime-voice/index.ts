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
  currentModel: 'mini' | 'full';
  modelSwitchCount: number;
  lastSwitchTimestamp: number;
  miniSecondsUsed: number;
  fullSecondsUsed: number;
}

// Model configuration
const MODELS = {
  mini: 'gpt-4o-mini-realtime-preview-2024-12-17',
  full: 'gpt-4o-realtime-preview-2024-10-01'
};

// Confusion trigger phrases
const CONFUSION_TRIGGERS = [
  'explain like i\'m a potato',
  'explain like i\'m 5',
  'i don\'t understand',
  'can you explain that',
  'what does that mean',
  'confused',
  'help me understand',
  'break it down',
  'explain further',
  'explain more',
  'clarify',
  'can you elaborate',
  'make it simpler'
];

// Cost calculation (in GBP)
const COST_PER_MINUTE = {
  mini: 0.11,
  full: 0.36
};

function detectConfusion(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase();
  return CONFUSION_TRIGGERS.some(trigger => lowerMessage.includes(trigger));
}

function calculateSessionCost(miniSeconds: number, fullSeconds: number): number {
  const miniCost = (miniSeconds / 60) * COST_PER_MINUTE.mini;
  const fullCost = (fullSeconds / 60) * COST_PER_MINUTE.full;
  return miniCost + fullCost;
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

    // Check voice quota BEFORE starting session
    const supabaseAnonClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const quotaCheckResponse = await supabaseAnonClient.functions.invoke('check-voice-quota', {
      body: { conversationId: url.searchParams.get("conversationId") }
    });

    if (quotaCheckResponse.error || !quotaCheckResponse.data?.canStart) {
      console.error("Quota check failed:", quotaCheckResponse.error || quotaCheckResponse.data?.message);
      return new Response(
        JSON.stringify({
          error: 'No voice sessions remaining',
          message: quotaCheckResponse.data?.message || 'Please purchase more sessions or upgrade your plan.'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Quota check passed:", quotaCheckResponse.data.sessionsRemaining, "sessions remaining");
    const quotaId = quotaCheckResponse.data.quotaId;

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
    const lessonPlanId = url.searchParams.get("lessonPlanId");
    let lessonPlan = null;
    
    // Fetch lesson plan by ID if provided
    if (lessonPlanId) {
      try {
        const { data: plan, error } = await supabase
          .from('cleo_lesson_plans')
          .select('*')
          .eq('id', lessonPlanId)
          .single();
        
        if (error) {
          console.error("❌ Failed to fetch lesson plan:", error);
        } else {
          lessonPlan = plan;
          console.log("✅ Loaded lesson plan:", { 
            id: plan.id, 
            topic: plan.topic,
            steps: plan.teaching_sequence?.length || 0 
          });
        }
      } catch (e) {
        console.error("❌ Error fetching lesson plan:", e);
      }
    }
    
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

    // Get requested model from query params (default to mini)
    const requestedModel = url.searchParams.get("model") === 'full' ? 'full' : 'mini';
    
    // Connect to OpenAI Realtime API using subprotocol authentication
    console.log(`Connecting to OpenAI Realtime API with ${requestedModel} model...`);
    const openAISocket = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=${MODELS[requestedModel]}`,
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
      clientSocket,
      currentModel: requestedModel,
      modelSwitchCount: 0,
      lastSwitchTimestamp: Date.now(),
      miniSecondsUsed: 0,
      fullSecondsUsed: 0
    };

    let isSessionConfigured = false;
    let currentTranscript = '';
    let currentAssistantMessage = '';
    let isAIResponding = false; // Track if AI is currently generating a response
    
    // Track session timing for quota management
    const sessionStartTime = new Date().toISOString();
    const sessionStartTimestamp = Date.now();
    const MAX_SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    let sessionEndTimer: number | null = null;
    let sessionLogged = false;

    // Auto-disconnect at 5 minutes
    sessionEndTimer = setTimeout(() => {
      console.log("⏰ Session time limit reached (5 minutes) - disconnecting");
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'session.limit_reached',
          message: 'Your 5-minute voice session has ended. Start a new session to continue!'
        }));
      }
      openAISocket.close();
      clientSocket.close();
    }, MAX_SESSION_DURATION_MS);
    
    // Function to log session usage with model costs
    async function logSessionUsage(wasInterrupted = false) {
      if (sessionLogged) return;
      sessionLogged = true;

      // CRITICAL FIX: Calculate final model usage before logging
      const elapsedSinceLastSwitch = Math.floor((Date.now() - session.lastSwitchTimestamp) / 1000);
      if (session.currentModel === 'mini') {
        session.miniSecondsUsed += elapsedSinceLastSwitch;
      } else {
        session.fullSecondsUsed += elapsedSinceLastSwitch;
      }

      const durationSeconds = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
      const estimatedCost = calculateSessionCost(session.miniSecondsUsed, session.fullSecondsUsed);
      
      console.log(`📊 Logging voice session: ${durationSeconds} seconds`);
      console.log(`💰 Model usage: ${session.miniSecondsUsed}s mini, ${session.fullSecondsUsed}s full`);
      console.log(`💷 Estimated cost: £${estimatedCost.toFixed(4)}`);

      try {
        const logResponse = await supabaseAnonClient.functions.invoke('log-voice-session', {
          body: {
            conversationId: conversation.id,
            sessionStart: sessionStartTime,
            durationSeconds: Math.min(durationSeconds, 300),
            wasInterrupted,
            miniSecondsUsed: session.miniSecondsUsed,
            fullSecondsUsed: session.fullSecondsUsed,
            estimatedCostGbp: estimatedCost
          }
        });

        if (logResponse.error) {
          console.error("❌ Error logging session:", logResponse.error);
        } else {
          console.log("✅ Session logged successfully:", logResponse.data);
        }
      } catch (error) {
        console.error("❌ CRITICAL: Failed to log session:", error);
      }
      
      // Update conversation with final model usage (with error handling)
      try {
        await supabase
          .from('cleo_conversations')
          .update({
            mini_seconds_used: session.miniSecondsUsed,
            full_seconds_used: session.fullSecondsUsed,
            model_switches: session.modelSwitchCount
          })
          .eq('id', conversation.id);
        console.log("✅ Conversation usage updated");
      } catch (error) {
        console.error("❌ Failed to update conversation usage:", error);
      }
    }

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

      // Helper function to format content blocks for system prompt
      function formatContentBlocksForPrompt(lessonPlan: any): string {
        if (!lessonPlan?.teaching_sequence) return '';
        
        let contentLibrary = '\n\nPRE-GENERATED CONTENT AVAILABLE:\n';
        contentLibrary += 'When you call move_to_step, the following content will be displayed automatically:\n\n';
        
        lessonPlan.teaching_sequence.forEach((step: any, stepIndex: number) => {
          if (!step.content_blocks || step.content_blocks.length === 0) return;
          
          contentLibrary += `\n📚 ${step.title} [ID: ${step.id}]:\n`;
          
          step.content_blocks.forEach((block: any) => {
            contentLibrary += formatSingleBlock(block);
          });
        });
        
        return contentLibrary;
      }

      // Helper to format individual content blocks
      function formatSingleBlock(block: any): string {
        const { id, type, data, title, teaching_notes } = block;
        let description = '';
        
        switch (type) {
          case 'text':
            const textPreview = (data?.content || '').substring(0, 100);
            description = `   • Text Block: "${textPreview}${textPreview.length >= 100 ? '...' : ''}"`;
            break;
            
          case 'definition':
            description = `   • Definition: "${data?.term || 'Unknown'}" - ${(data?.definition || '').substring(0, 60)}...`;
            if (data?.example) description += `\n      Example: ${data.example.substring(0, 60)}...`;
            break;
            
          case 'question':
            description = `   • Question: "${(data?.question || '').substring(0, 80)}..."`;
            if (data?.options) {
              description += `\n      Options: ${data.options.map((o: any) => o.text).slice(0, 2).join(', ')}...`;
            }
            break;
            
          case 'table':
            const headers = data?.headers || [];
            const rowCount = data?.rows?.length || 0;
            description = `   • Table: ${headers.join(', ')} (${rowCount} rows)`;
            break;
            
          case 'diagram':
            description = `   • Diagram: ${title || data?.title || 'Visual diagram'}`;
            break;
            
          default:
            description = `   • ${type}: ${title || id}`;
        }
        
        if (title && type !== 'diagram') {
          description = `   • ${title} (${type})\n      ${description.substring(5)}`;
        }
        
        if (teaching_notes) {
          description += `\n      💡 Teaching Note: ${teaching_notes}`;
        }
        
        description += `\n      [ID: ${id}]\n`;
        
        return description;
      }

      // Configure session after connection
      if (message.type === 'session.created' && !isSessionConfigured) {
        let systemPrompt = '';
        
        if (lessonPlan) {
          // Authoritative teaching mode with lesson plan
          const objectivesList = lessonPlan.learning_objectives.map((obj: string, i: number) => `${i+1}. ${obj}`).join('\n');
          const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => `Step ${i+1}: ${step.title} (${step.duration_minutes}min) [ID: ${step.id}]`).join('\n');
          
          // NEW: Format pre-generated content
          const contentLibrary = formatContentBlocksForPrompt(lessonPlan);
          
          systemPrompt = `You are Cleo, an expert AI tutor teaching ${lessonPlan.topic} to a ${lessonPlan.year_group} student.

LESSON STRUCTURE:
The lesson is organized into these steps:
${sequenceList}

${contentLibrary}

CRITICAL INSTRUCTIONS:
1. Before teaching each step, you MUST call move_to_step with the step's ID and title
2. This displays ALL the pre-generated content listed above for that step
3. After calling move_to_step, reference the content that appears: "As you can see in the table..." or "Looking at this definition..."
4. DO NOT recreate content that already exists - use what's been generated
5. Pay attention to teaching notes (💡) - they guide how to use each piece of content

YOUR TEACHING FLOW:
1. Start with: "Welcome! Today we're learning ${lessonPlan.topic}."
2. Call move_to_step("${lessonPlan.teaching_sequence[0]?.id}", "${lessonPlan.teaching_sequence[0]?.title || 'Introduction'}") before starting
3. After the content appears, reference it naturally in your explanation
4. When you see a question in the content, present it and wait for the student's answer
5. Move through all steps in order, calling move_to_step with the exact step ID shown in brackets [ID: ...]

TEACHING STYLE:
- Be warm and engaging
- Explain concepts clearly in 2-3 sentences
- ALWAYS reference visual content after it appears: "As you can see...", "Looking at this diagram..."
- For pre-generated questions, ask them and wait for answers
- Use teaching notes to guide your explanations
- Move at a comfortable pace

TOOLS AVAILABLE:
- move_to_step: Call BEFORE starting each step (displays all that step's pre-generated content)
- show_table: Only use if you need an ADDITIONAL table beyond what's pre-generated
- show_definition: Only use for EXTRA definitions not in the pre-generated content
- ask_question: Only use for ADDITIONAL practice beyond pre-generated questions

Remember: The content library above shows what's ALREADY created. Use it! Don't recreate it.`;
        } else if (conversation.topic && conversation.year_group) {
          // Friendly exploration mode (no lesson plan)
          systemPrompt = `You are Cleo, a friendly and encouraging AI tutor teaching ${conversation.topic} to a ${conversation.year_group} student.

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

Keep spoken responses conversational and under 3 sentences unless explaining something complex.`;
        } else {
          systemPrompt = `You are Cleo, a friendly AI tutor. Help the student learn by asking questions and providing clear explanations. Keep responses brief and conversational.`;
        }

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
                name: "move_to_step",
                description: "Call this BEFORE you start teaching a new step. This displays all pre-generated visual content for that step (tables, definitions, questions, diagrams). Check the 'PRE-GENERATED CONTENT AVAILABLE' section in your instructions to see what will appear. Reference this content in your teaching after calling this function.",
                parameters: {
                  type: "object",
                  properties: {
                    stepId: { 
                      type: "string", 
                      description: "The exact step ID shown in brackets [ID: ...] in the content library. This is the step.id, NOT 'step-0' or 'step-1'." 
                    },
                    stepTitle: {
                      type: "string",
                      description: "The title of this step from the lesson plan"
                    }
                  },
                  required: ["stepId", "stepTitle"]
                }
              },
              {
                type: "function",
                name: "show_table",
                description: "Display an ADDITIONAL table beyond the pre-generated content. Only use this if you need to show a table that wasn't included in the lesson plan content library. Check the content library first to avoid duplicates.",
                parameters: {
                  type: "object",
                  properties: {
                    id: { 
                      type: "string", 
                      description: "Unique ID for this table (e.g., 'extra-comparison-table')" 
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
                description: "Display an ADDITIONAL definition card. Only use this if you need to define a term that wasn't included in the pre-generated content. Check the content library first.",
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
                description: "Present an ADDITIONAL practice question. Only use this if you want to check understanding beyond the pre-generated questions in the content library. Pre-generated questions appear automatically with move_to_step.",
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
        console.log("✅ Session configured");
        
        // Auto-display first step content if lesson plan exists
        if (lessonPlan?.teaching_sequence?.[0]) {
          const firstStep = lessonPlan.teaching_sequence[0];
          console.log(`📚 Auto-displaying first step: ${firstStep.title} [ID: ${firstStep.id}]`);
          
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'content.marker',
              data: {
                type: 'move_to_step',
                stepId: firstStep.id,
                stepTitle: firstStep.title
              }
            }));
          }
        }

        // Send initial greeting message
        let greetingText = '';
        if (lessonPlan) {
          const mainObjectives = lessonPlan.learning_objectives.slice(0, 2).join(', and ');
          const firstStep = lessonPlan.teaching_sequence[0]?.title || 'the basics';
          greetingText = `Hi ${userName}! Welcome! I'm Cleo, and I'll be guiding you through ${lessonPlan.topic} today. We have ${lessonPlan.learning_objectives.length} main objectives: ${mainObjectives}. Let's get started with ${firstStep}. Are you ready?`;
        } else if (lessonTitle) {
          greetingText = `Hi ${userName}! I'm Cleo, your AI tutor. I'm excited to help you learn about ${lessonTitle} today!${lessonDescription ? ` ${lessonDescription}` : ''} Let's dive in - what would you like to explore first?`;
        } else {
          greetingText = `Hi ${userName}! I'm Cleo, your AI tutor. I'm here to help you learn. What would you like to study today?`;
        }

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

        // Save the greeting prompt to database as a system message (with error handling)
        try {
          const { error: greetingSaveError } = await supabase
            .from('cleo_messages')
            .insert({
              conversation_id: conversation.id,
              role: 'system',
              content: `Initial greeting prompt: ${greetingText}`
            });
          if (greetingSaveError) {
            console.error("❌ Failed to save greeting message:", greetingSaveError);
          }
        } catch (e) {
          console.error("❌ Failed to save greeting message (exception):", e);
        }

        console.log("Initial greeting sent to OpenAI");
      }

      // Cancel AI response when user starts speaking (interruption)
      if (message.type === 'input_audio_buffer.speech_started') {
        if (isAIResponding) {
          console.log("User started speaking - cancelling active AI response");
          openAISocket.send(JSON.stringify({
            type: 'response.cancel'
          }));
          isAIResponding = false; // Reset state
        } else {
          console.log("User started speaking - no active AI response to cancel");
        }
      }

      // Save student transcript to database
      if (message.type === 'conversation.item.input_audio_transcription.completed') {
        currentTranscript = message.transcript;
        console.log("🎤 Student said:", currentTranscript);
        
        // Check for confusion in audio transcripts
        const isConfused = detectConfusion(currentTranscript);
        
        // Save with error handling
        try {
          const { error: transcriptSaveError } = await supabase
            .from('cleo_messages')
            .insert({
              conversation_id: session.conversationId,
              role: 'user',
              content: currentTranscript,
              model_used: session.currentModel
            });
          if (transcriptSaveError) {
            console.error("❌ Failed to save user transcript:", transcriptSaveError);
          }
        } catch (e) {
          console.error("❌ Failed to save user transcript (exception):", e);
        }
        
        // Auto-switch on confusion (with cooldown)
        const cooldownPeriod = 30000;
        const timeSinceLastSwitch = Date.now() - session.lastSwitchTimestamp;
        
        if (isConfused && session.currentModel === 'mini' && timeSinceLastSwitch > cooldownPeriod) {
          console.log('🧠 Confusion detected in audio - flagging for potential model switch');
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'confusion.detected',
              transcript: currentTranscript
            }));
          }
        }
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
        
            // Handle move_to_step
            if (functionName === 'move_to_step') {
              const { stepId, stepTitle } = args;
              
              console.log(`📚 ========== MOVE_TO_STEP CALLED ==========`);
              console.log(`📚 Step ID: ${stepId}`);
              console.log(`📚 Step Title: ${stepTitle}`);
              console.log(`📚 Call ID: ${message.call_id}`);
              
              // Send step change event to frontend
              if (clientSocket.readyState === WebSocket.OPEN) {
                const payload = {
                  type: 'content.marker',
                  data: {
                    type: 'move_to_step',
                    stepId: stepId,
                    stepTitle: stepTitle
                  }
                };
                console.log(`📤 Sending to frontend:`, JSON.stringify(payload));
                clientSocket.send(JSON.stringify(payload));
                console.log(`✅ Message sent to client successfully`);
              } else {
                console.error(`❌ Client socket not ready! State: ${clientSocket.readyState}`);
              }
          
          // Confirm to OpenAI
          openAISocket.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({ 
                success: true, 
                message: `Moved to step: ${stepTitle}. All content for this step is now visible to the student.` 
              })
            }
          }));
          
          openAISocket.send(JSON.stringify({
            type: 'response.create'
          }));
          
          return;
        }
        
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
          console.log("🤖 Cleo said:", currentAssistantMessage);
          
          // Save with error handling
          try {
            const { error: assistantSaveError } = await supabase
              .from('cleo_messages')
              .insert({
                conversation_id: session.conversationId,
                role: 'assistant',
                content: currentAssistantMessage,
                model_used: session.currentModel
              });
            if (assistantSaveError) {
              console.error("❌ Failed to save assistant message:", assistantSaveError);
            }
          } catch (e) {
            console.error("❌ Failed to save assistant message (exception):", e);
          }
          
          // Check for switch-back trigger if using full model
          const switchBackPhrases = ['does that make sense', 'is that clearer', 'do you understand now'];
          const hasCheckPhrase = switchBackPhrases.some(phrase => 
            currentAssistantMessage.toLowerCase().includes(phrase)
          );
          
          if (session.currentModel === 'full' && hasCheckPhrase) {
            console.log('🔄 Deep explanation complete - ready to switch back to mini on positive response');
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify({
                type: 'explanation.complete',
                message: 'Ready to switch back to efficient mode'
              }));
            }
          }
          
          currentAssistantMessage = '';
        }
      }

      // Track AI response state
      if (message.type === 'response.created') {
        isAIResponding = true;
        console.log("✅ AI response started");
      }

      if (message.type === 'response.done') {
        isAIResponding = false;
        console.log("✅ AI response completed");
      }

      if (message.type === 'response.cancelled') {
        isAIResponding = false;
        console.log("✅ AI response successfully cancelled");
      }

      // Forward all events to client
      if (message.type !== 'response.audio.delta') {
        console.log('📥 OpenAI -> Client:', message.type);
      }
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      } else {
        console.warn("⚠️ Client socket not ready, cannot forward message");
      }
    } catch (error) {
        // Detailed error logging - but don't crash the session
        console.error("🚨 CRITICAL ERROR processing OpenAI message:", error);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        console.error("Message type that caused error:", message?.type);
        console.error("Session ID:", session.conversationId);
        console.error("Timestamp:", new Date().toISOString());
        
        // Try to notify client of error but don't crash
        try {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              type: 'processing.error',
              error: 'An error occurred processing the message',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (sendError) {
          console.error("❌ Could not send error notification to client:", sendError);
        }
        
        // DO NOT throw - let the session continue
      }
    };

    openAISocket.onerror = async (error) => {
      console.error("🚨 OpenAI socket error:", error);
      console.error("Error type:", error?.type);
      console.error("Session ID:", session.conversationId);
      console.error("Timestamp:", new Date().toISOString());
      console.error("⏱️ Session duration so far:", Math.floor((Date.now() - sessionStartTimestamp) / 1000), "seconds");
      
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(JSON.stringify({
          type: 'connection.error',
          error: 'OpenAI connection failed',
          details: 'The connection to OpenAI\'s service was lost or failed to establish',
          fatal: true,
          message: 'Connection to AI service lost. Please try starting a new session.'
        }));
      }
      
      // Log to database for monitoring
      (async () => {
        try {
          const { error: logError } = await supabase
            .from('cleo_messages')
            .insert({
              conversation_id: session.conversationId,
              role: 'system',
              content: `ERROR: OpenAI WebSocket error - ${JSON.stringify(error)}`
            });
          if (logError) {
            console.error("Failed to log error:", logError);
          }
        } catch (err) {
          console.error("Failed to log error (exception):", err);
        }
      })();
    };

    openAISocket.onclose = (event) => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
      console.log("🔌 OpenAI connection closed");
      console.log("Close code:", event.code);
      console.log("Close reason:", event.reason);
      console.log("Was clean?:", event.wasClean);
      console.log("Session ID:", session.conversationId);
      console.log("⏱️ Session duration:", sessionDuration, "seconds");
      console.log("Timestamp:", new Date().toISOString());
      
      if (sessionEndTimer) clearTimeout(sessionEndTimer);
      logSessionUsage(false);
      
      // Send close reason to client
      if (clientSocket.readyState === WebSocket.OPEN) {
        const closeReason = event.reason || (event.wasClean ? 'Connection closed normally' : 'Connection closed unexpectedly');
        clientSocket.send(JSON.stringify({
          type: 'connection.closed',
          reason: closeReason,
          code: event.code,
          wasClean: event.wasClean,
          message: event.wasClean 
            ? 'Session ended successfully' 
            : 'Connection lost unexpectedly. Please try again.'
        }));
      }
      
      clientSocket.close();
    };

    // Handle client socket events
    clientSocket.onopen = () => {
      console.log("✅ Client connected - session started");
      console.log("🎯 Model:", session.currentModel);
      console.log("🆔 Conversation ID:", session.conversationId);
    };

    clientSocket.onmessage = async (event) => {
      // Forward client messages to OpenAI
      try {
        const msg = JSON.parse(event.data);
        console.log('📤 Client -> OpenAI:', msg.type);
        
        // Handle user_message type - inject text into conversation
        if (msg.type === 'user_message') {
          console.log('💬 Injecting user text message:', msg.text);
          
          // Detect confusion and potentially switch models
          const isConfused = detectConfusion(msg.text);
          const shouldSwitch = isConfused && session.currentModel === 'mini';
          const cooldownPeriod = 30000; // 30 seconds between switches
          const timeSinceLastSwitch = Date.now() - session.lastSwitchTimestamp;
          
          if (shouldSwitch && timeSinceLastSwitch > cooldownPeriod) {
            console.log('🧠 Confusion detected - switching to full model');
            
            // Update model usage time before switching
            const elapsedSeconds = Math.floor((Date.now() - session.lastSwitchTimestamp) / 1000);
            if (session.currentModel === 'mini') {
              session.miniSecondsUsed += elapsedSeconds;
            } else {
              session.fullSecondsUsed += elapsedSeconds;
            }
            
            // Notify client of model switch
            if (clientSocket.readyState === WebSocket.OPEN) {
              clientSocket.send(JSON.stringify({
                type: 'model.switching',
                fromModel: 'mini',
                toModel: 'full',
                reason: 'confusion_detected'
              }));
            }
            
            // Fetch recent conversation context
            const { data: recentMessages } = await supabase
              .from('cleo_messages')
              .select('role, content')
              .eq('conversation_id', session.conversationId)
              .order('created_at', { ascending: false })
              .limit(10);
            
            // Close current connection
            openAISocket.close(1000, 'Model switch');
            
            // Open new connection with full model
            const newSocket = new WebSocket(
              `wss://api.openai.com/v1/realtime?model=${MODELS.full}`,
              [
                'realtime',
                `openai-insecure-api-key.${OPENAI_API_KEY}`,
                'openai-beta.realtime-v1'
              ]
            );
            
            session.openAISocket = newSocket;
            session.currentModel = 'full';
            session.modelSwitchCount++;
            session.lastSwitchTimestamp = Date.now();
            
            // Update database
            await supabase
              .from('cleo_conversations')
              .update({
                current_model: 'full',
                model_switches: session.modelSwitchCount
              })
              .eq('id', session.conversationId);
            
            // Wait for connection and configure with context
            newSocket.onopen = () => {
              console.log('✅ Switched to full model');
              
              // Configure with deep explanation prompt
              const contextHistory = recentMessages?.reverse().map(m => 
                `${m.role === 'user' ? 'Student' : 'Cleo'}: ${m.content}`
              ).join('\n') || '';
              
              newSocket.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  instructions: `You are Cleo in DEEP EXPLANATION MODE. The student just asked for help because they were confused: "${msg.text}"

Previous conversation:
${contextHistory}

Provide a thorough, detailed explanation using:
- Analogies and real-world examples
- Step-by-step breakdowns
- Multiple perspectives
- Visual descriptions

After your explanation, ask "Does that make sense now?" to gauge understanding.`,
                  voice: 'ballad',
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 700
                  },
                  temperature: 0.8
                }
              }));
              
              // Send the user's message
              newSocket.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{ type: 'input_text', text: msg.text }]
                }
              }));
              
              newSocket.send(JSON.stringify({ type: 'response.create' }));
              
              if (clientSocket.readyState === WebSocket.OPEN) {
                clientSocket.send(JSON.stringify({
                  type: 'model.switched',
                  model: 'full'
                }));
              }
            };
            
            return;
          }
          
          // Save message to database
          try {
            const { error: saveMsgError } = await supabase
              .from('cleo_messages')
              .insert({
                conversation_id: session.conversationId,
                role: 'user',
                content: msg.text,
                model_used: session.currentModel
              });
            if (saveMsgError) {
              console.error('Failed to save user message:', saveMsgError);
            } else {
              console.log('Message saved to database');
            }
          } catch (err) {
            console.error('Failed to save user message (exception):', err);
          }
          
          // Create conversation item
          openAISocket.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: msg.text
                }
              ]
            }
          }));
          
          // Trigger response
          openAISocket.send(JSON.stringify({
            type: 'response.create'
          }));
          
          return;
        }
        
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
      const sessionDuration = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
      console.log("🔌 Client disconnected");
      console.log("⏱️ Session duration:", sessionDuration, "seconds");
      if (sessionEndTimer) clearTimeout(sessionEndTimer);
      logSessionUsage(true); // Mark as interrupted if client closes
      openAISocket.close();
    };

    clientSocket.onerror = (error) => {
      const sessionDuration = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
      console.error("🚨 Client socket error:", error);
      console.error("Error type:", error?.type);
      console.error("Timestamp:", new Date().toISOString());
      console.error("Session ID:", session.conversationId);
      console.error("⏱️ Session duration before error:", sessionDuration, "seconds");
      
      if (sessionEndTimer) clearTimeout(sessionEndTimer);
      logSessionUsage(true);
      
      // Gracefully close OpenAI connection
      if (openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close(1000, 'Client error');
      }
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
