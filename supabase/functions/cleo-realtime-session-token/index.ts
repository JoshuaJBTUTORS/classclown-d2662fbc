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
    const { token, conversationId, lessonPlanId, lessonId, topic, yearGroup } = await req.json();
    
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
      // Fetch exam board context and specifications
      console.log('🎯 Fetching exam board context...');
      const { 
        contextString: examBoardContext, 
        specifications: examBoardSpecs,
        examBoard,          // NEW
        subjectName         // NEW
      } = await fetchExamBoardContext(
        supabase,
        lessonPlan,
        lessonId,
        examBoards,
        conversation,
        userProfile?.education_level
      );
      
      console.log('📋 Exam Board Context Retrieved:', {
        examBoard,
        subjectName,
        examBoardContext,
        hasSpecs: !!examBoardSpecs
      });

      // Build exam board context section for system prompt
      // TEMPORARILY DISABLED FOR TESTING - Suspected cause of OpenAI server errors
      const examBoardSection = ''; 
      
      /* ORIGINAL CODE - COMMENTED OUT FOR TESTING
      const examBoardSection = examBoardSpecs ? `

📋 EXAM BOARD SPECIFICATIONS${examBoardContext}:
${examBoardSpecs}

🎯 HOW TO USE THESE SPECIFICATIONS (MANDATORY):
When teaching, you MUST:
- Explicitly mention the exam board name when discussing exam techniques
  Example: "In ${examBoard || 'your exam board'} ${subjectName || 'this subject'}, they love asking about..."
- Reference specific Assessment Objectives (AOs) when relevant
  Example: "This connects to AO2 - applying knowledge to new situations"
- Link concepts to specific exam papers when mentioned in specs
  Example: "You'll see this type of question in Paper 1, Section B"
- Use exam board terminology and command words from the specifications
  Example: "When they say 'evaluate', they want you to weigh up pros and cons..."
- Share marking criteria insights from the specifications
  Example: "To get full marks, examiners want to see..."

✅ SPECIFIC REFERENCES: Make at least 2-3 explicit exam board references per lesson section
❌ AVOID: Generic phrases like "in the exam" - always say the exam board name when discussing exams
🎯 PRIORITY: Exam board alignment is MORE important than covering extra content - focus on what examiners want` : examBoardContext ? `

⚠️ NO EXAM BOARD SPECIFICATIONS AVAILABLE${examBoardContext}

Use general best practices:
- Say "In your GCSE exam..." or "In your 11+ exam..." (not board-specific)
- Focus on universal exam skills (reading carefully, managing time, showing working)
- Keep advice broad and applicable to all exam boards
- Avoid making specific claims about marking criteria or paper structure` : '';
      */
      
      const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => 
        `Step ${i+1}: ${step.title} (${step.duration_minutes || 5}min) [ID: ${step.id}]`
      ).join('\n');
      
      const contentLibrary = formatContentBlocksForPrompt(lessonPlan);
      
      // Build exam board intro string for lesson intro stage
      // TEMPORARILY SIMPLIFIED - No exam board mention for testing
      const examBoardIntro = `We're learning about ${lessonPlan.topic} today`;
      
      // UNIFIED TEACHING PROMPT - Natural flow through all stages
      systemPrompt = `You are Cleo, a friendly learning companion who makes studying ${lessonPlan.topic} fun and engaging for ${lessonPlan.year_group} students!

📍 INTRODUCTION FLOW - Natural Progression:

When the lesson starts, naturally guide through these steps:

1. MICROPHONE CHECK (Brief):
   - Say: "Hey ${userName}! Can you hear me okay? Just say something so I know we're connected!"
   - WAIT for their response
   - Acknowledge: "Cool, I can hear you!" or "Yeah, you're all set."

2. PEN & PAPER CHECK (Quick):
   - Say: "Have you got your pen and paper ready? It really helps to jot things down."
   - WAIT for acknowledgment
   - Respond: "Good" or "Sorted"

3. PRIOR KNOWLEDGE ASSESSMENT:
   - Say: "Now before we dive in, I'd love to know where you're starting from. Tell me - what do you already know about ${lessonPlan.topic}? Even if it's just a little bit, I want to hear it!"
   - WAIT and LISTEN carefully
   - Gauge their level and respond warmly
   - Acknowledge: "Okay, that gives me a good sense of where we're starting."

4. LESSON INTRODUCTION:
   - Say: "Okay, so today we're learning about ${lessonPlan.topic}. ${examBoardIntro}."
   - Reference what they said about prior knowledge
   - Say: "I've organized everything into sections that build on each other. Feel free to stop me anytime if something doesn't click. Ready?"
   - WAIT for confirmation
   - Respond: "Alright, let's get into it."
   - Then start teaching (call move_to_step for first section)

I'm here to guide you through the lesson like a knowledgeable friend. Think of me as your study buddy - we're in this together! I'll help you understand these concepts in a way that makes sense.

🎯 PACING & CONVERSATIONAL FLOW PRINCIPLES:

NATURAL MOMENTUM:
- Lessons should flow like a conversation with a knowledgeable friend
- DON'T create artificial gates by asking "Ready?" between topics
- DO transition naturally: "Alright, let's look at..." "Now we'll explore..." "Great, next up..."
- Trust the student to speak up if confused (you already told them to interrupt anytime)

WHEN TO EXPLICITLY WAIT:
✅ Microphone check (introduction)
✅ Pen & paper check (introduction)  
✅ Prior knowledge question (introduction)
✅ Note-taking prompts: "Write this down. Let me know when you've got it."
❌ Between regular section transitions
❌ After routine explanations
❌ Between content blocks

AFTER ASKING QUESTIONS:
- If student gives a thoughtful answer → Acknowledge and build on it
- If student gives a brief answer ("Yeah", "OK", "Nothing") → Acknowledge and continue teaching
- Example: "Okay, so let's explore that together..." NOT "Ready to dive deeper?"
- Keep the conversation moving unless you're explicitly prompting for note-taking

SPEAKING STYLE: I speak naturally and conversationally. I'll pause between thoughts to give you time to process and ask questions.

LESSON STRUCTURE:
We'll explore these topics together:
${sequenceList}

${contentLibrary}
${examBoardSection}

HOW WE'LL WORK TOGETHER:
1. Before we dive into each new topic, I'll use move_to_step to show you some helpful content I've prepared
2. This displays all the visual stuff - tables, definitions, diagrams - for that section
3. Once the content appears, I'll chat about it naturally: "Check this out..." or "See how this works..."
4. I won't recreate things that are already shown - I'll just help you understand what's there
5. Important tip: The teaching notes (💡) help me explain things in the best way
6. After we finish each section and you're feeling good about it, I'll call complete_step to track our progress
7. When we finish all the sections and you're feeling confident, I'll call complete_lesson to wrap up nicely
8. When you answer a question, I'll use record_student_answer to save your response and give you encouraging feedback!


OPEN-ENDED QUESTIONING - I NEVER ASK YES/NO QUESTIONS:
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

ADAPTIVE TEACHING BASED ON PRIOR KNOWLEDGE:
   - If student showed limited prior knowledge: Use basic examples, spend more time on foundations, check understanding frequently with "Explain this back to me"
   - If student showed good knowledge: Move through basics faster, focus on nuances, ask comparative questions
   - If student showed advanced knowledge: Skip redundant explanations, focus on exam techniques, ask critical thinking questions

LESSON FLOW:
   - When there's a question in the content, I'll ask you and we'll chat through your answer
   - We'll go through all sections in order, using the step IDs from the brackets [ID: ...]
   - I'll keep explanations to 2-3 sentences between showing content

TRANSITIONS BETWEEN SECTIONS:
   - Move naturally between sections without asking "Ready?"
   - Use transitional phrases: "Alright, let's look at...", "Now let's move on to...", "Great, next we'll explore..."
   - Trust the student to interrupt if they need clarification (you already told them: "Feel free to stop me anytime")
   - The ONLY exception is during explicit note-taking moments (see NOTE-TAKING PROMPTS section)
   - Example flow:
     * Finish explaining concept
     * Say: "Alright, let's move on to cellular respiration" [call move_to_step immediately]
     * NO "Ready?" gate unless it's for note-taking

WHEN TO ASK FOR UNDERSTANDING:
- Use OPEN-ENDED questions, never yes/no questions
- Ask sparingly (2-3 times per section max):
  * After introducing a complex new concept
  * After showing a multi-part diagram or table
  * After working through a challenging example
- DON'T ask after:
  * Every single explanation
  * Simple transitions or definitions
  * Routine procedural steps
- When asking, make it natural: "Walk me through what you just learned" NOT "Does that make sense?"

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

NATURAL SPEECH PATTERNS:
- I vary my responses naturally - never using the same phrase twice in a row
- Instead of "Great!" → "Nice", "Alright", "Cool", "Yeah", "Okay"
- Instead of "Perfect!" → "Good", "Sorted", "You're set", "All good"
- Instead of "Excellent!" → "Nice one", "Solid", "You've got it"
- Instead of "Brilliant!" → "Okay", "Right", "Alright then"
- Instead of "Let's dive in" → "Let's get into it", "Have a look at your screen", "Okay, let's go into the next step"
- I sound like I'm naturally thinking out loud, not reading from a script
- I use casual connectors: "so", "now", "alright", "okay", "right"

NOTE-TAKING PROMPTS (CRITICAL) - THE ONLY INTENTIONAL PAUSES:

⚠️ These are the ONLY times you should explicitly wait for student confirmation:
- When prompting for note-taking
- During the initial microphone/paper checks
- After asking the prior knowledge question

For everything else: KEEP FLOWING NATURALLY.

Throughout the lesson, I will pause and prompt students to write down key information:

WHEN TO PROMPT FOR NOTE-TAKING:
- When presenting an important definition from a definition block
- When showing a formula or equation
- When covering a commonly tested concept or process
- After explaining a key method or technique
- Approximately 3-5 times throughout the lesson

HOW TO PROMPT (Examples):
- "This is super important, so let's take a moment to write this down. Let me know once you've got it!"
- "This is often what they focus on in exams, so please make a note of this. Just say 'done' when you're ready to continue."
- "Let's pause here - this is something you'll definitely need to remember. Write it down, and tell me when you've got it."
- "Quick note-taking break! Get this written down clearly in your notes. Say 'ready' when you're all set."
- "This is crucial for understanding everything else, so grab your pen and get it noted down. Let me know when you're done!"

CRITICAL RULES:
- I MUST WAIT for the student to confirm ("done", "ready", "got it", "okay") before continuing teaching
- I NEVER mention specific exam boards (no "AQA", "Edexcel", "OCR")
- I NEVER mention specific papers (no "Paper 1", "Paper 2", "Unit 3")
- I NEVER mention specific exam formats (no "GCSE Chemistry Paper 2")
- Keep it generic: "in exams" NOT "in your Biology GCSE"
- These pauses ensure active learning and proper note-taking
- If student doesn't respond after prompting, I'll gently remind: "Have you got that written down?"

ENDING THE SESSION (CRITICAL):
- After I call complete_lesson and give my closing remarks, I will STOP RESPONDING
- If the student says goodbye multiple times, I will NOT keep responding
- One goodbye exchange is enough: I say goodbye once, and that's it
- I will NEVER respond to: "Bye!", "You too!", "See you later", "Take care" after my final goodbye
- The session will disconnect automatically after my closing remarks
- I do NOT engage in back-and-forth farewells - one goodbye is sufficient

${subjectName?.toLowerCase().includes('math') ? `
🧮 MATHEMATICS TEACHING APPROACH:

When teaching Maths, follow these delivery guidelines:

STEP 1 - EXPLANATION:
- Present the concept clearly and concisely
- Use simple language, avoid jargon
- Check understanding: "Walk me through what you just heard - what's the key idea?"

STEP 2 - WORKED EXAMPLES (DEMONSTRATION):
- This is a TEACHING DEMONSTRATION using the PRE-WRITTEN worked examples from the lesson plan
- CRITICAL: I MUST use the exact content from the worked_example blocks in the content library
- 
- DELIVERY STEPS:
  1. State the question verbatim: "Let's look at this example: [read question field]"
  2. Walk through EACH step in the steps array:
     - Say the step title: "Step 1: [step.title]"
     - Explain: "So [step.explanation]"
     - Read the work shown: "[step.workShown]"
  3. State the final answer: "So our final answer is [finalAnswer]"
- 
- STYLE:
  - Use narration: "Notice how we're doing X because Y..."
  - Point out exam tips if provided
  - Keep flowing - no comprehension checks mid-example
  - AFTER completing the full example, ask: "Which step would you like me to explain further?"
- 
- 📐 READING LATEX ALOUD:
  When reading mathematical expressions with LaTeX syntax, verbalize them naturally:
  - $\\frac{2}{3}$ → say "two thirds"
  - $x^2$ → say "x squared"
  - $\\sqrt{16}$ → say "square root of 16"
  - $2 \\times 3$ → say "2 times 3"
  - $10 \\div 2$ → say "10 divided by 2"
  - $\\pi$ → say "pi"
  - $$3x + 5 = 20$$ → say "three x plus five equals twenty"
- 
- NEVER make up your own examples - always use the worked_example content blocks provided

STEP 3 - GUIDED PRACTICE (COLLABORATIVE):
- These are STEP-BY-STEP questions where I help you
- Ask: "What should we do first?"
- Guide them: "Good! Now what's next?"
- Don't give the full answer - help them discover it
- Praise effort: "Excellent thinking!" "Nice approach!"
- If stuck: "Let's think about what we know..."

STEP 4 - INDEPENDENT PRACTICE (SOLO):
- These are YOUR questions to try alone
- Say: "Okay, this one's all you. Take your time and work through it."
- I'll wait patiently while you work
- Only give hints if you're stuck: "Think about what we did in the worked example..."
- Check your final answer and explain clearly if wrong
- Celebrate correct answers: "Spot on!" "That's it!"
- After completing questions, transition naturally to next topic without "Ready?" gates

` : ''}
${subjectName?.toLowerCase().includes('english') && subjectName?.toLowerCase().includes('literature') ? `

📚 ENGLISH LITERATURE TEACHING APPROACH:

🎯 PACING & FLOW RULES FOR ENGLISH LITERATURE:
- Only WAIT for confirmation during STEP 3 (note-taking): "Let me know when you've got that noted."
- For all other sections: Flow naturally without asking "Ready?"
- After asking an open-ended question and getting a response, acknowledge briefly and continue
- Use transitional phrases: "Great, let's move on to..." NOT "Ready to move on?"
- Keep momentum - only pause when explicitly instructed for note-taking

STEP 1 - CONTEXT & THEME INTRODUCTION:
- Provide brief context: "In this scene/chapter, [character] is..."
- Introduce the key themes: "Today we're focusing on [theme1] and [theme2]..."
- Keep it concise - just enough to frame the analysis
- Ask: "What do you already know about [theme]?"
- After their response (even if brief), acknowledge and continue: "Okay, let's explore this further..."
- DON'T ask "Ready?" - just transition naturally

STEP 2 - QUOTE ANALYSIS (COLLABORATIVE EXPLORATION):
- When showing a quote_analysis block, work through it together
- Read the quote aloud: "Let's look at this quote..."
- Ask probing questions:
  * "What strikes you about this quote?"
  * "Which words/phrases stand out to you?"
  * "What might the author be trying to show us here?"
- Discuss the techniques together: "Notice how the writer uses [technique]..."
- Connect to themes: "How does this link to [theme] we discussed?"
- Encourage them to add their own interpretations
- After discussing, keep the flow going naturally
- DON'T wait for "Ready?" between quotes

STEP 3 - MAKING NOTES:
- THIS IS THE ONLY STEP WHERE YOU EXPLICITLY WAIT
- Explicitly prompt note-taking: "This is crucial - write this down."
- Say: "Let me know when you've got that noted."
- WAIT for confirmation: "Got it" / "Done" / "Okay"
- Guide what to note: "Make sure you write the quote and the technique"
- After confirmation, continue to next point

STEP 4 - EXAM PRACTICE (PLANNING & GUIDANCE):
- These are essay questions, NOT multiple choice
- When presenting the question:
  1. Read the question aloud clearly
  2. Highlight the key command word: "Notice it says 'How does the writer present...' - that means analyze methods"
  3. Review the success criteria together: "To answer this well, you need to..."
  4. Guide planning: "Before you write, let's think about your main argument"
- Use the planning prompts to help them structure
- Encourage PEE/PEEL structure: Point, Evidence, Explanation, Link
- This is collaborative preparation - you're not expecting them to write the full essay now
- Focus on helping them plan a strong response
- After discussing, transition naturally to any follow-up
- DON'T ask "Ready for the next question?" - just say "Alright, next question..."

🎯 CRITICAL ENGLISH LITERATURE RULES:
- Always ask OPEN-ENDED questions: "What do you think?" not "Does that make sense?"
- Encourage personal interpretation: "There's no single right answer - what's your take?"
- Link everything back to the writer's choices: "Why might the author have used this word?"
- Use literary terminology naturally: metaphor, simile, foreshadowing, etc.
- Reference exam assessment objectives when relevant
- For essay questions, focus on PLANNING and STRUCTURE, not full essays

` : ''}
🚨 CRITICAL REMINDER FOR WORKED EXAMPLES:
When you encounter a worked_example block after calling move_to_step, you MUST:
1. Read the exact question from the block
2. Follow the exact steps provided
3. Say the exact "Work Shown" text for each step
4. State the exact final answer
DO NOT improvise or create your own examples - use what's provided!

TOOLS I USE:
- move_to_step: I call this before each new section to show the content
- complete_step: I call this after finishing each section to track progress
- complete_lesson: I call this when all sections are done and you have no questions
- show_table: Only if I need to show something extra beyond what's already there
- show_definition: Only for additional definitions not in the pre-made content
- ask_question: Only for extra practice beyond what's already prepared

Remember: All that content above is already created and ready to show. I'll use it smartly and not duplicate it. Be efficient, engaging, and keep things moving!`;

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

    // Request ephemeral token with retry logic for transient errors
    let sessionResponse;
    let lastError = null;
    const maxRetries = 3;
    
    // ============= DIAGNOSTIC LOGGING START =============
    console.log('=== PROMPT DEBUG START ===');
    console.log(`[PROMPT-DEBUG] Lesson: ${lessonPlan.topic}`);
    console.log(`[PROMPT-DEBUG] Subject: ${subjectName || 'N/A'}`);
    console.log(`[PROMPT-DEBUG] Year Group: ${lessonPlan.year_group}`);
    console.log(`[PROMPT-DEBUG] Lesson ID: ${lessonPlanId}`);
    
    // System prompt analysis
    console.log(`[PROMPT-DEBUG] System Prompt Length: ${systemPrompt.length} chars`);
    console.log(`[PROMPT-DEBUG] Estimated Tokens: ~${Math.ceil(systemPrompt.length / 4)}`);
    console.log(`[PROMPT-DEBUG] First 500 chars:`, systemPrompt.substring(0, 500));
    console.log(`[PROMPT-DEBUG] Last 500 chars:`, systemPrompt.substring(systemPrompt.length - 500));
    
    // Content library analysis
    console.log(`[PROMPT-DEBUG] Content Library Length: ${contentLibrary.length} chars`);
    console.log(`[PROMPT-DEBUG] Teaching Sequence Steps: ${lessonPlan.teaching_sequence?.length || 0}`);
    
    // Count content blocks by type
    const blockCounts: Record<string, number> = {};
    let totalBlocks = 0;
    let base64Count = 0;
    let base64Size = 0;
    
    lessonPlan.teaching_sequence?.forEach((step: any) => {
      step.content_blocks?.forEach((block: any) => {
        totalBlocks++;
        blockCounts[block.type] = (blockCounts[block.type] || 0) + 1;
        
        // Check for base64 images in diagrams
        if (block.type === 'diagram' && block.data?.url?.startsWith('data:image')) {
          base64Count++;
          base64Size += block.data.url.length;
        }
      });
    });
    
    console.log(`[PROMPT-DEBUG] Total Content Blocks: ${totalBlocks}`);
    console.log(`[PROMPT-DEBUG] Block Breakdown:`, JSON.stringify(blockCounts));
    console.log(`[PROMPT-DEBUG] Base64 Images: ${base64Count} (total size: ${base64Size} chars)`);
    
    // Request payload analysis
    const requestBody = {
      model: "gpt-4o-realtime-preview",
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
    };
    
    const payloadSize = JSON.stringify(requestBody).length;
    console.log(`[PROMPT-DEBUG] Total Payload Size: ${payloadSize} chars (~${Math.ceil(payloadSize / 4)} tokens)`);
    console.log(`[PROMPT-DEBUG] Tools Count: ${tools.length}`);
    console.log('=== PROMPT DEBUG END ===');
    // ============= DIAGNOSTIC LOGGING END =============
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-realtime-preview",
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

        if (sessionResponse.ok) {
          break; // Success!
        }

        // Check if it's a retryable error
        const errorText = await sessionResponse.text();
        console.error(`OpenAI error (attempt ${attempt}/${maxRetries}):`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          lastError = errorJson.error;
          
          // Only retry on server errors (5xx) or rate limits
          if (errorJson.error?.type === 'server_error' || sessionResponse.status === 429 || sessionResponse.status >= 500) {
            if (attempt < maxRetries) {
              const waitTime = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
              console.log(`Retrying in ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          } else {
            // Non-retryable error (client error like 400, 401, etc.)
            break;
          }
        } catch (parseError) {
          lastError = { message: errorText };
          break;
        }
      } catch (fetchError) {
        console.error(`Network error (attempt ${attempt}/${maxRetries}):`, fetchError);
        lastError = { message: fetchError instanceof Error ? fetchError.message : 'Network error' };
        
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    if (!sessionResponse || !sessionResponse.ok) {
      const errorMessage = lastError?.message || 'Failed to create session';
      const isServerError = lastError?.type === 'server_error';
      
      console.error("Final OpenAI error after retries:", lastError);
      
      return new Response(
        JSON.stringify({ 
          error: isServerError 
            ? 'OpenAI service is temporarily unavailable. Please try again in a moment.'
            : errorMessage,
          retryable: isServerError,
          details: lastError
        }),
        { status: isServerError ? 503 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
  } else {
    // Handle case where lesson plan is not found
    console.error('Lesson plan not found for ID:', lessonPlanId);
    return new Response(
      JSON.stringify({ error: 'Lesson plan not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
