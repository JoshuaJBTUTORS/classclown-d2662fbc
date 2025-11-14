import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import { formatContentBlocksForPrompt, formatSingleBlock } from '../_shared/cleoPromptHelpers.ts';

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
      .from('profiles')
      .select('first_name, education_level, exam_boards')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.first_name || 'there';
    const educationLevel = userProfile?.education_level || '';
    const examBoards = userProfile?.exam_boards as Record<string, string> || {};
    console.log("User profile:", { userName, educationLevel, examBoards });

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

    // Determine exam board context for the introduction
    let examBoardContext = '';
    let subjectName = '';

    if (lessonPlan?.lesson_id) {
      // Fetch subject from lesson -> module -> course chain
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select(`
          id,
          module_id,
          course_modules!inner(
            course_id,
            courses!inner(
              subject
            )
          )
        `)
        .eq('id', lessonPlan.lesson_id)
        .single();
      
      if (lessonData?.course_modules?.courses?.subject) {
        subjectName = lessonData.course_modules.courses.subject;
        console.log("Subject determined:", subjectName);
      }
    }

    // Look up exam board for this subject
    if (subjectName && conversation.subject_id && examBoards[conversation.subject_id]) {
      const examBoard = examBoards[conversation.subject_id];
      examBoardContext = ` for ${examBoard} ${subjectName}`;
      console.log("Exam board context:", examBoardContext);
    } else if (subjectName && educationLevel) {
      examBoardContext = ` for ${educationLevel.toUpperCase()} ${subjectName}`;
      console.log("Education level context:", examBoardContext);
    } else if (lessonPlan?.topic && lessonPlan?.year_group) {
      examBoardContext = ` for ${lessonPlan.year_group}`;
      console.log("Year group context:", examBoardContext);
    }

    // Upgrade client connection
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API using subprotocol authentication
    console.log("Connecting to OpenAI Realtime API (full model)...");
    const openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-realtime",
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
    let isAIResponding = false; // Track if AI is currently generating a response
    
    // Track session timing for quota management
    const sessionStartTime = new Date().toISOString();
    const sessionStartTimestamp = Date.now();
    const MAX_SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    let sessionEndTimer: number | null = null;
    let sessionLogged = false;
    let keepaliveInterval: number | null = null;
    let clientKeepaliveInterval: number | null = null;

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
    
    // Function to log session usage
    async function logSessionUsage(wasInterrupted = false) {
      if (sessionLogged) return;
      sessionLogged = true;

      const durationSeconds = Math.floor((Date.now() - sessionStartTimestamp) / 1000);
      console.log(`📊 Logging voice session: ${durationSeconds} seconds`);

      try {
        const logResponse = await supabaseAnonClient.functions.invoke('log-voice-session', {
          body: {
            conversationId: conversation.id,
            sessionStart: sessionStartTime,
            durationSeconds: Math.min(durationSeconds, 300), // Cap at 5 minutes
            wasInterrupted
          }
        });

        if (logResponse.error) {
          console.error("Error logging session:", logResponse.error);
        } else {
          console.log("✅ Session logged successfully:", logResponse.data);
        }
      } catch (error) {
        console.error("Failed to log session:", error);
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

      // Send keepalive to prevent Deno Deploy timeout
      keepaliveInterval = setInterval(() => {
        if (openAISocket.readyState === WebSocket.OPEN) {
          console.log("📡 Sending keepalive ping to OpenAI");
          openAISocket.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        } else {
          if (keepaliveInterval) clearInterval(keepaliveInterval);
        }
      }, 20000); // Every 20 seconds

      // Also send keepalive to client
      clientKeepaliveInterval = setInterval(() => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          console.log("📡 Sending keepalive to client");
          clientSocket.send(JSON.stringify({
            type: 'server.keepalive',
            timestamp: Date.now()
          }));
        } else {
          if (clientKeepaliveInterval) clearInterval(clientKeepaliveInterval);
        }
      }, 20000); // Every 20 seconds
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
        let systemPrompt = '';
        
        if (lessonPlan) {
          // Authoritative teaching mode with lesson plan
          const objectivesList = lessonPlan.learning_objectives.map((obj: string, i: number) => `${i+1}. ${obj}`).join('\n');
          const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => `Step ${i+1}: ${step.title} (${step.duration_minutes}min) [ID: ${step.id}]`).join('\n');
          
          // NEW: Format pre-generated content
          const contentLibrary = formatContentBlocksForPrompt(lessonPlan);
          
          systemPrompt = `You are Cleo, a friendly learning companion who makes studying ${lessonPlan.topic} fun and engaging for ${lessonPlan.year_group} students!

I'm here to guide you through the lesson like a knowledgeable friend. Think of me as your study buddy - we're in this together! I'll help you understand these concepts in a way that makes sense.

SPEAKING STYLE: I speak naturally and conversationally. I'll pause between thoughts to give you time to process and ask questions.

LESSON STRUCTURE:
We'll explore these topics together:
${sequenceList}

${contentLibrary}

HOW WE'LL WORK TOGETHER:
1. Before we dive into each new topic, I'll use move_to_step to show you some helpful content I've prepared
2. This displays all the visual stuff - tables, definitions, diagrams - for that section
3. Once the content appears, I'll chat about it naturally: "Check this out..." or "See how this works..."
4. I won't recreate things that are already shown - I'll just help you understand what's there
5. Important tip: The teaching notes (💡) help me explain things in the best way
6. When we finish all the sections and you're feeling good about everything, I'll call complete_lesson to wrap up nicely

OUR LESSON JOURNEY:
1. I'll start with: "Hey ${userName}! So today we're learning about ${lessonPlan.topic}${examBoardContext}. I've organized everything into easy-to-follow sections. Feel free to stop me anytime if something doesn't click or you want me to explain differently. Ready? Let's jump in!"
2. Important: I'm leading our lesson together, not just responding to requests. I'll guide us warmly through the material
3. Right after saying hello, I'll call move_to_step("${lessonPlan.teaching_sequence[0]?.id}", "${lessonPlan.teaching_sequence[0]?.title || 'Introduction'}") to show our first content
4. Then I'll explain what we're looking at in a natural, conversational way
5. When there's a question in the content, I'll ask you and chat through your answer
6. We'll go through all ${lessonPlan.teaching_sequence.length} sections in order, using the step IDs from the brackets [ID: ...]
7. After we've covered everything and you don't have more questions, I'll call complete_lesson("We covered [main topics]") so you can see the completion button

WHEN TO COMPLETE THE LESSON:
- We've explored all ${lessonPlan.teaching_sequence.length} sections together
- You've tried the practice questions
- You've asked anything you wanted to know more about
- Then I'll call complete_lesson with a quick summary

MY TEACHING APPROACH:
- Warm, enthusiastic, and relatable - like a helpful friend
- I explain things clearly but conversationally (2-3 sentences at a time)
- I always reference what's on screen: "See this...", "Notice how..."
- I ask the practice questions and we discuss your answers together
- I use those teaching notes to help explain things well
- We take our time - no rushing!

TOOLS I USE:
- move_to_step: I call this before each new section to show the content
- complete_lesson: I call this when we're done to mark completion
- show_table: Only if I need to show something extra beyond what's already there
- show_definition: Only for additional definitions not in the pre-made content
- ask_question: Only for extra practice beyond what's already prepared

Remember: All that content above is already created and ready to show. I'll use it smartly and not duplicate it.
Important: When we finish, I'll call complete_lesson so you get that satisfying "Done" button!`;
        } else if (conversation.topic && conversation.year_group) {
          // Friendly exploration mode (no lesson plan)
          systemPrompt = `You are Cleo, a friendly learning companion helping with ${conversation.topic} for ${conversation.year_group} students!

I'm here to explore this topic with you in a relaxed, conversational way. Think of me as your study buddy who can show you cool stuff on screen.

SPEAKING STYLE: I chat naturally with you, pausing to let you think and ask questions whenever.

I've got some neat tools to make learning visual:
- show_table: I can show you tables with data
- show_definition: I can display definitions in a nice card format
- ask_question: I can give you practice questions to try

How we'll explore together:
- I'll introduce what we're learning in a casual way
- I'll use these tools to show you things instead of just talking about them
- Example: Instead of saying "let me explain atoms", call show_definition with term="Atom" and definition="..."
- Example: Instead of saying "here's a comparison", call show_table with the comparison data
- After showing a question, wait for the student's answer before continuing
- Provide clear explanations with visual aids
- Break down complex topics into simple steps
- Be patient and supportive

Keep spoken responses conversational and under 3 sentences unless explaining something complex.`;
        } else {
          systemPrompt = `You are Cleo, a friendly AI tutor. Speak slowly and clearly. Help the student learn by asking questions and providing clear explanations. Keep responses brief and conversational.`;
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
              threshold: 0.6,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
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
              },
              {
                type: "function",
                name: "complete_lesson",
                description: "Call this when you have finished teaching all steps in the lesson and the student has completed all practice questions. This signals that the lesson is complete and allows the student to finish the session.",
                parameters: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: "Brief summary of what was covered in the lesson (1-2 sentences)"
                    }
                  },
                  required: ["summary"]
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

        console.log("Session configured - triggering Cleo's personalized introduction");
        
        // Trigger Cleo to speak first with the personalized introduction
        openAISocket.send(JSON.stringify({
          type: 'response.create'
        }));

        console.log("Response.create sent - Cleo will now begin speaking");
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
        
        // Handle complete_lesson
        if (functionName === 'complete_lesson') {
          const { summary } = args;
          
          console.log(`🎓 ========== LESSON COMPLETE ==========`);
          console.log(`🎓 Summary: ${summary}`);
          console.log(`🎓 Call ID: ${message.call_id}`);
          
          // Send completion event to frontend
          if (clientSocket.readyState === WebSocket.OPEN) {
            const payload = {
              type: 'content.marker',
              data: {
                type: 'lesson_complete',
                summary: summary
              }
            };
            console.log(`📤 Sending lesson complete to frontend:`, JSON.stringify(payload));
            clientSocket.send(JSON.stringify(payload));
          }
          
          // Confirm to OpenAI
          openAISocket.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: message.call_id,
              output: JSON.stringify({ 
                success: true, 
                message: 'Lesson marked as complete. The student will see the completion options.' 
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
          console.log("Cleo said:", currentAssistantMessage);
          await supabase.from('cleo_messages').insert({
            conversation_id: session.conversationId,
            role: 'assistant',
            content: currentAssistantMessage
          });
          currentAssistantMessage = '';
        }
      }

      // Track AI response state
      if (message.type === 'response.created') {
        isAIResponding = true;
        console.log("AI response started");
      }

      if (message.type === 'response.done') {
        isAIResponding = false;
        console.log("AI response completed");
      }

      if (message.type === 'response.cancelled') {
        isAIResponding = false;
        console.log("AI response successfully cancelled");
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
        // Detailed error logging
        console.error("🚨 CRITICAL ERROR processing OpenAI message:", error);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error stack:", error?.stack);
        console.error("Message type that caused error:", event?.data ? JSON.parse(event.data).type : 'unknown');
        
        // Send detailed error to client
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            type: 'connection.error',
            error: 'Message processing failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            fatal: false,
            message: 'An error occurred while processing the AI response. The connection may be unstable.'
          }));
        }
        
        // Don't close connection - try to recover
        console.log("Attempting to continue despite error...");
      }
    };

    openAISocket.onerror = (error) => {
      console.error("🚨 OpenAI WebSocket ERROR:", error);
      console.error("Error type:", error?.type);
      console.error("Error target:", error?.target);
      console.error("Error timestamp:", new Date().toISOString());
      console.error("Session ID:", session.conversationId);
      console.error("User ID:", session.userId);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
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
      supabase.from('cleo_messages').insert({
        conversation_id: session.conversationId,
        role: 'system',
        content: `ERROR: OpenAI WebSocket error - ${JSON.stringify(error)}`
      }).catch(err => console.error("Failed to log error:", err));
    };

    openAISocket.onclose = (event) => {
      console.log("🔌 OpenAI socket closed");
      console.log("Close code:", event.code);
      console.log("Close reason:", event.reason);
      console.log("Was clean:", event.wasClean);
      console.log("Timestamp:", new Date().toISOString());
      
      // Clear all intervals and timers
      if (sessionEndTimer) clearTimeout(sessionEndTimer);
      if (keepaliveInterval) clearInterval(keepaliveInterval);
      if (clientKeepaliveInterval) clearInterval(clientKeepaliveInterval);
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
      console.log("Client connected");
    };

    clientSocket.onmessage = (event) => {
      // Forward client messages to OpenAI
      try {
        const msg = JSON.parse(event.data);
        console.log('📤 Client -> OpenAI:', msg.type);
        
        // Handle user_message type - inject text into conversation
        if (msg.type === 'user_message') {
          console.log('💬 Injecting user text message:', msg.text);
          
          // Save message to database
          supabase.from('cleo_messages').insert({
            conversation_id: session.conversationId,
            role: 'user',
            content: msg.text
          }).then(() => console.log('Message saved to database'));
          
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
      console.log("Client disconnected");
      
      // Clear all intervals and timers
      if (sessionEndTimer) clearTimeout(sessionEndTimer);
      if (keepaliveInterval) clearInterval(keepaliveInterval);
      if (clientKeepaliveInterval) clearInterval(clientKeepaliveInterval);
      
      logSessionUsage(true); // Mark as interrupted if client closes
      openAISocket.close();
    };

    clientSocket.onerror = (error) => {
      console.error("🚨 Client socket error:", error);
      console.error("Error type:", error?.type);
      console.error("Timestamp:", new Date().toISOString());
      console.error("Session ID:", session.conversationId);
      
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
