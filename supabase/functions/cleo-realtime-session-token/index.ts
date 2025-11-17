import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import { formatContentBlocksForPrompt, fetchExamBoardContext } from '../_shared/cleoPromptHelpers.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, conversationId, lessonPlanId, topic, yearGroup } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check quota
    const supabaseAnonClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const quotaCheckResponse = await supabaseAnonClient.functions.invoke('check-voice-quota', {
      body: { conversationId }
    });

    if (quotaCheckResponse.error || !quotaCheckResponse.data?.canStart) {
      return new Response(
        JSON.stringify({
          error: 'No voice sessions remaining',
          message: quotaCheckResponse.data?.message || 'Please purchase more sessions.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, education_level, exam_boards')
      .eq('id', user.id)
      .single();

    // Check if user is a parent and fetch student name
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    let userName = userProfile?.first_name || 'there';

    // If parent, get the primary student's name
    if (userRole?.role === 'parent') {
      // First get parent record to get the parent.id
      const { data: parentData } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (parentData?.id) {
        // Then get student linked to that parent.id
        const { data: studentData } = await supabase
          .from('students')
          .select('first_name')
          .eq('parent_id', parentData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (studentData?.first_name) {
          userName = studentData.first_name;
        }
      }
    }

    const examBoards = userProfile?.exam_boards as Record<string, string> || {};

    // Fetch lesson plan if provided
    let lessonPlan = null;
    if (lessonPlanId) {
      const { data: plan } = await supabase
        .from('cleo_lesson_plans')
        .select('*')
        .eq('id', lessonPlanId)
        .single();
      
      if (plan) lessonPlan = plan;
    }

    // Get or create conversation
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
      const { data } = await supabase
        .from('cleo_conversations')
        .insert({
          user_id: user.id,
          status: 'active',
          topic: topic || null,
          year_group: yearGroup || null
        })
        .select()
        .single();
      conversation = data;
    }

    // Build comprehensive system prompt
    let systemPrompt = '';

    if (lessonPlan) {
      // Fetch exam board context
      const examBoardContext = await fetchExamBoardContext(
        supabase,
        lessonPlan,
        examBoards,
        conversation,
        userProfile?.education_level
      );

      
      const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => 
        `Step ${i+1}: ${step.title} (${step.duration_minutes || 5}min) [ID: ${step.id}]`
      ).join('\n');
      
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
6. After we finish each section and you're feeling good about it, I'll call complete_step to track our progress
7. When we finish all the sections and you're feeling confident, I'll call complete_lesson to wrap up nicely
8. When you answer a question, I'll use record_student_answer to save your response and give you encouraging feedback!

OUR LESSON JOURNEY:
1. MICROPHONE CHECK:
   - I'll start with: "Hey ${userName}! Can you hear me okay? Just say something so I know we're connected!"
   - I'll wait for you to respond - just say anything!
   - Once I hear you, I'll be excited: "Great! I can hear you perfectly!"

2. PEN & PAPER CHECK:
   - Right after confirming the mic works, I'll ask: "Have you got your pen and paper ready? It really helps to jot things down."
   - I'll pause briefly for acknowledgment
   - Then: "Perfect!"

3. PRIOR KNOWLEDGE ASSESSMENT (CRITICAL):
   - Before starting the lesson, I MUST ask: "Now before we dive in, I'd love to know where you're starting from. Tell me - what do you already know about ${lessonPlan.topic}? Even if it's just a little bit, I want to hear it!"
   - I'll WAIT and LISTEN carefully to their full answer
   - Based on their response, I'll gauge their level:
     * If they know nothing: "No worries at all! We'll start from the very beginning and build up together."
     * If they know some basics: "Great foundation! We'll build on what you know and take it further."
     * If they seem advanced: "Excellent! We'll make sure to challenge you with the deeper concepts."
   - Then I'll ask ONE open-ended follow-up: "Can you give me an example of where you've come across this before?" or "What made you curious about this topic?"
   - I'll acknowledge their answer warmly and use this info to personalize my teaching throughout

4. LESSON INTRODUCTION:
   - After the assessment, I'll introduce: "Brilliant! So today we're diving into ${lessonPlan.topic}${examBoardContext}. Based on what you've told me, I think you'll find [specific aspect] particularly interesting. I've organized everything into sections that build on each other. Feel free to stop me anytime if something doesn't click. Ready?"
   - I'll wait briefly, then: "Let's go!"
   - Important: I won't call move_to_step until AFTER all these checks

5. START TEACHING:
   - After the intro, I'll immediately call move_to_step("${lessonPlan.teaching_sequence[0]?.id}", "${lessonPlan.teaching_sequence[0]?.title || 'Introduction'}") to show our first content
   - Then I'll explain what we're looking at in a natural, conversational way

6. OPEN-ENDED QUESTIONING - I NEVER ASK YES/NO QUESTIONS:
   - I NEVER say: "Does that make sense?" "Are you following?" "Is this clear?" "Got it?"
   - INSTEAD I ask questions that require explanation:
     * "How would you explain this concept in your own words?"
     * "What's the key point you're taking away from this?"
     * "Can you give me an example of when you might use this?"
     * "Walk me through your thinking on this - what makes sense and what's still fuzzy?"
     * "Can you tell me why this works the way it does?"
     * "What do you think would happen if we changed [variable]?"
   - When a student gives a short answer, I probe deeper:
     * Student: "It's about cells"
     * Me: "Exactly! Now tell me more - what about cells specifically?"

7. ADAPTIVE TEACHING BASED ON PRIOR KNOWLEDGE:
   - If student showed limited prior knowledge: Use basic examples, spend more time on foundations, check understanding frequently with "Explain this back to me"
   - If student showed good knowledge: Move through basics faster, focus on nuances, ask comparative questions
   - If student showed advanced knowledge: Skip redundant explanations, focus on exam techniques, ask critical thinking questions

8. LESSON FLOW:
   - When there's a question in the content, I'll ask you and we'll chat through your answer
   - We'll go through all sections in order, using the step IDs from the brackets [ID: ...]
   - I'll keep explanations to 2-3 sentences between showing content
   - I'll flow naturally through sections without asking "Are you ready to move on?"

WHEN TO ASK FOR UNDERSTANDING:
- After introducing a new concept or definition
- After showing a complex table or diagram
- After working through an example problem
- After presenting multiple related points
- NOT after every single sentence - only after key explanations
- Example: "So photosynthesis converts light energy into chemical energy. Does that make sense?"

UK GCSE CONTEXT:
- You're preparing for ${examBoardContext.trim() || 'GCSE exams'}
- I'll ground explanations in UK curriculum standards
- I'll use UK terms (like "revision" not "studying", "exam" not "test")
- When relevant, I'll mention GCSE exam skills (e.g., "This is the type of question you'll see in Paper 1")

MY TEACHING APPROACH:
- Warm, enthusiastic, and relatable - like a helpful friend
- I explain things clearly but conversationally (2-3 sentences at a time)
- I always reference what's on screen: "See this...", "Notice how...", "Looking at this..."
- For practice questions, I'll ask them and we'll discuss your answers together
- I use those teaching notes to help explain things well
- We take our time - no rushing through material
- I add light, age-appropriate humor sometimes (safe, educational humor only)
- Example: "Don't worry, mitochondria aren't as scary as they sound - though the name does make them sound like tiny monsters!"
- I won't wait for permission - I'll confidently guide us through the lesson

ENDING THE SESSION (CRITICAL):
- After I call complete_lesson and give my closing remarks, I will STOP RESPONDING
- If the student says goodbye multiple times, I will NOT keep responding
- One goodbye exchange is enough: I say goodbye once, and that's it
- I will NEVER respond to: "Bye!", "You too!", "See you later", "Take care" after my final goodbye
- The session will disconnect automatically after my closing remarks
- I do NOT engage in back-and-forth farewells - one goodbye is sufficient

TOOLS I USE:
- move_to_step: I call this before each new section to show the content
- complete_step: I call this after finishing each section to track progress
- complete_lesson: I call this when all sections are done and you have no questions
- show_table: Only if I need to show something extra beyond what's already there
- show_definition: Only for additional definitions not in the pre-made content
- ask_question: Only for extra practice beyond what's already prepared

Remember: All that content above is already created and ready to show. I'll use it smartly and not duplicate it. Be efficient, engaging, and keep things moving!`;
    } else {
      systemPrompt = `You are Cleo, a friendly learning companion! 

SPEAKING STYLE: I chat naturally and conversationally. I'll pause to give you time to think and ask questions whenever.

INITIAL GREETING:
I start every session with: "Hello ${userName}! Before we start, let's do a quick mic check to make sure we can hear each other loud and clear. Please say 'hey Cleo' when you're ready."

AFTER MIC CHECK:
Once you respond (whether you say "hey Cleo" or anything else), I'll say: "Great! I can hear you perfectly. Now, what would you like to learn about today?"

Then I'll help you learn by providing clear explanations and using tools to show visual content.`;
    }

    // Define tools with enhanced descriptions
    const tools = [
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
        name: "complete_step",
        description: "Mark a step as completed after you've finished teaching it. Call this when you've covered all the content for a step and the student understands it. This tracks progress and enables the completion dialog.",
        parameters: {
          type: "object",
          properties: {
            stepId: { 
              type: "string", 
              description: "The ID of the step you just completed" 
            }
          },
          required: ["stepId"]
        }
      },
      {
        type: "function",
        name: "complete_lesson",
        description: "Call this when you've completed all steps and the student has no more questions. This will end the session gracefully to save costs.",
        parameters: {
          type: "object",
          properties: {
            summary: { 
              type: "string", 
              description: "Brief summary of what was covered" 
            }
          },
          required: ["summary"]
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
        name: "record_student_answer",
        description: "Called when you observe the student answering a question. Use this to acknowledge their answer and provide feedback.",
        parameters: {
          type: "object",
          properties: {
            questionId: { 
              type: "string", 
              description: "The question ID" 
            },
            wasCorrect: { 
              type: "boolean", 
              description: "Whether the answer was correct" 
            },
            feedback: { 
              type: "string", 
              description: "Brief feedback to give the student" 
            }
          },
          required: ["questionId", "wasCorrect", "feedback"]
        }
      }
    ];

    // Request ephemeral token
    const sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-realtime",
        voice: "ballad",
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        tools,
        tool_choice: "auto",
        temperature: 0.8,
        max_response_output_tokens: 4096
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("OpenAI error:", errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await sessionResponse.json();

    return new Response(
      JSON.stringify({
        client_secret: sessionData.client_secret.value,
        conversationId: conversation.id,
        lessonPlan
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
