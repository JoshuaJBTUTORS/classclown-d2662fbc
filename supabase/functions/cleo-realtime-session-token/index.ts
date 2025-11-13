import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

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

    const userName = userProfile?.first_name || 'there';
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

    // Helper to format content blocks for system prompt
    const formatContentBlocksForPrompt = (lessonPlan: any): string => {
      if (!lessonPlan?.teaching_sequence) return '';
      
      let contentLibrary = '\n\nPRE-GENERATED CONTENT AVAILABLE:\n';
      contentLibrary += 'When you call move_to_step, the following content will be displayed automatically:\n\n';
      
      lessonPlan.teaching_sequence.forEach((step: any) => {
        if (!step.content_blocks || step.content_blocks.length === 0) return;
        
        contentLibrary += `\n📚 ${step.title} [ID: ${step.id}]:\n`;
        
        step.content_blocks.forEach((block: any) => {
          const { id, type, data, title, teaching_notes } = block;
          let description = '';
          
          switch (type) {
            case 'text':
              const textPreview = (data?.content || '').substring(0, 100);
              description = `   • Text: "${textPreview}${textPreview.length >= 100 ? '...' : ''}"`;
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
          contentLibrary += description;
        });
      });
      
      return contentLibrary;
    };

    // Build comprehensive system prompt
    let systemPrompt = '';

    if (lessonPlan) {
      // Fetch exam board context
      let examBoardContext = '';
      let subjectName = '';
      
      if (lessonPlan?.lesson_id) {
        const { data: lessonData } = await supabase
          .from('course_lessons')
          .select(`
            id,
            module_id,
            course_modules!inner(
              course_id,
              courses!inner(subject)
            )
          `)
          .eq('id', lessonPlan.lesson_id)
          .single();
        
        if (lessonData?.course_modules?.courses?.subject) {
          subjectName = lessonData.course_modules.courses.subject;
        }
      }

      // Look up exam board
      if (subjectName && examBoards[subjectName.toLowerCase()]) {
        const examBoard = examBoards[subjectName.toLowerCase()];
        examBoardContext = ` for ${examBoard} ${subjectName}`;
      } else if (lessonPlan?.year_group) {
        examBoardContext = ` for ${lessonPlan.year_group}`;
      }

      const objectivesList = lessonPlan.learning_objectives?.map((obj: string, i: number) => 
        `${i+1}. ${obj}`
      ).join('\n') || 'Master the key concepts';
      
      const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => 
        `Step ${i+1}: ${step.title} (${step.duration_minutes || 5}min) [ID: ${step.id}]`
      ).join('\n');
      
      const contentLibrary = formatContentBlocksForPrompt(lessonPlan);
      
      systemPrompt = `You are Cleo, an expert AI tutor teaching ${lessonPlan.topic} to a ${lessonPlan.year_group} student (approximately 15 years old).

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
6. After finishing each step and confirming student understanding, call complete_step with that step's ID
7. When you've completed all teaching steps and the student has no more questions, call complete_lesson to end the session gracefully

YOUR TEACHING FLOW:
1. Start with: "Hello ${userName}! Today we're going to learn about ${lessonPlan.topic}${examBoardContext}. This lesson is structured to help you master the key concepts step by step. To get the most from our session, don't hesitate to ask questions or request clarification whenever something isn't clear. Let's dive in!"
2. CRITICAL: Do NOT begin by saying things like "Absolutely! Let's start with..." or treating the session start as if the student asked a question. You are the teacher leading the lesson, not answering a student's request. Start authoritatively and warmly as described in step 1.
3. Immediately call move_to_step("${lessonPlan.teaching_sequence[0]?.id}", "${lessonPlan.teaching_sequence[0]?.title || 'Introduction'}") to begin the lesson
4. After the content appears, reference it naturally in your explanation
5. After explaining a key concept or important point, pause and ask: "Does that make sense?" or "Are you following so far?" to give the student a chance to speak and ask questions
6. Wait for the student's response. If they say yes or seem confident, continue. If they express confusion, explain further or rephrase
7. When you see a question in the content, present it and wait for the student's answer
8. Move through all steps in order, calling move_to_step with the exact step ID shown in brackets [ID: ...]
9. Keep your spoken explanations under 3 sentences between showing content - avoid long monologues
10. Don't rush through material - give the student time to process and respond after each key explanation
11. Don't ask "Are you ready to move on?" - just progress naturally through the steps

WHEN TO ASK FOR UNDERSTANDING:
- After introducing a new concept or definition
- After showing a complex table or diagram
- After working through an example problem
- After presenting multiple related points
- NOT after every single sentence - only after key explanations
- Example: "So photosynthesis converts light energy into chemical energy. Does that make sense?"

UK GCSE CONTEXT:
- This student is preparing for ${examBoardContext.trim() || 'GCSE exams'}
- Ground explanations in UK curriculum standards
- Use UK terminology (e.g., "revision" not "studying", "exam" not "test")
- Reference GCSE exam skills when relevant (e.g., "This is the type of question you'll see in Paper 1")

TEACHING STYLE:
- Be warm, engaging, and authoritative (you're the teacher, not a peer)
- Explain concepts clearly in 2-3 sentences maximum before showing content
- ALWAYS reference visual content after it appears: "As you can see...", "Looking at this diagram..."
- For pre-generated questions, ask them and wait for answers
- Use teaching notes to guide your explanations
- Move at a comfortable pace - don't rush through steps
- Add light, age-appropriate humor occasionally (safe, educational humor only)
- Example humor: "Don't worry, mitochondria aren't as scary as they sound - though the name does make them sound like tiny monsters!"
- Avoid waiting for permission - lead the lesson confidently

TOOLS AVAILABLE:
- move_to_step: Call BEFORE starting each step (displays all that step's pre-generated content)
- complete_step: Call AFTER finishing each step to track progress
- complete_lesson: Call when all steps are done and student has no questions
- show_table: Only use if you need an ADDITIONAL table beyond what's pre-generated
- show_definition: Only use for EXTRA definitions not in the pre-generated content
- ask_question: Only use for ADDITIONAL practice beyond pre-generated questions

Remember: The content library above shows what's ALREADY created. Use it! Don't recreate it. Be efficient, engaging, and keep things moving.`;
    } else {
      systemPrompt = `You are Cleo, a friendly and encouraging AI tutor. Help students learn by providing clear explanations and using your tools to show visual content.`;
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
        model: "gpt-4o-realtime-preview-2024-10-01",
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
