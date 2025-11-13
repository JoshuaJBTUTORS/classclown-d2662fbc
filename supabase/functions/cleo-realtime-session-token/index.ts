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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
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
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("User authenticated:", user.id);

    // Check voice quota
    const supabaseAnonClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const quotaCheckResponse = await supabaseAnonClient.functions.invoke('check-voice-quota', {
      body: { conversationId }
    });

    if (quotaCheckResponse.error || !quotaCheckResponse.data?.canStart) {
      console.error("Quota check failed:", quotaCheckResponse.error || quotaCheckResponse.data?.message);
      return new Response(
        JSON.stringify({
          error: 'No voice sessions remaining',
          message: quotaCheckResponse.data?.message || 'Please purchase more sessions or upgrade your plan.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("✅ Quota check passed:", quotaCheckResponse.data.sessionsRemaining, "sessions remaining");

    // Fetch user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, education_level, exam_boards')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.first_name || 'there';
    const educationLevel = userProfile?.education_level || '';
    const examBoards = userProfile?.exam_boards as Record<string, string> || {};

    // Fetch lesson plan if provided
    let lessonPlan = null;
    if (lessonPlanId) {
      const { data: plan, error } = await supabase
        .from('cleo_lesson_plans')
        .select('*')
        .eq('id', lessonPlanId)
        .single();
      
      if (!error && plan) {
        lessonPlan = plan;
        console.log("✅ Loaded lesson plan:", { 
          id: plan.id, 
          topic: plan.topic,
          steps: plan.teaching_sequence?.length || 0 
        });
      }
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
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      conversation = data;
    }

    // Determine exam board context
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
            courses!inner(
              subject
            )
          )
        `)
        .eq('id', lessonPlan.lesson_id)
        .single();
      
      if (lessonData?.course_modules?.courses?.subject) {
        subjectName = lessonData.course_modules.courses.subject;
      }
    }

    if (subjectName && conversation.subject_id && examBoards[conversation.subject_id]) {
      const examBoard = examBoards[conversation.subject_id];
      examBoardContext = ` for ${examBoard} ${subjectName}`;
    } else if (subjectName && educationLevel) {
      examBoardContext = ` for ${educationLevel.toUpperCase()} ${subjectName}`;
    } else if (lessonPlan?.topic && lessonPlan?.year_group) {
      examBoardContext = ` for ${lessonPlan.year_group}`;
    }

    // Build system prompt
    let systemPrompt = '';
    
    if (lessonPlan) {
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
            contentLibrary += description;
          });
        });
        
        return contentLibrary;
      };

      const objectivesList = lessonPlan.learning_objectives.map((obj: string, i: number) => `${i+1}. ${obj}`).join('\n');
      const sequenceList = lessonPlan.teaching_sequence.map((step: any, i: number) => `Step ${i+1}: ${step.title} (${step.duration_minutes}min) [ID: ${step.id}]`).join('\n');
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
1. Start with: "Hello ${userName}! Today we're going to learn about ${lessonPlan.topic}${examBoardContext}. This lesson is structured to help you master the key concepts step by step. To get the most from our session, don't hesitate to ask questions or request clarification whenever something isn't clear. Let's dive in!"
2. CRITICAL: Do NOT begin by saying things like "Absolutely! Let's start with..." or treating the session start as if the student asked a question. You are the teacher leading the lesson, not answering a student's request. Start authoritatively and warmly as described in step 1.
3. Immediately call move_to_step("${lessonPlan.teaching_sequence[0]?.id}", "${lessonPlan.teaching_sequence[0]?.title || 'Introduction'}") to begin the lesson
4. After the content appears, reference it naturally in your explanation
5. When you see a question in the content, present it and wait for the student's answer
6. Move through all steps in order, calling move_to_step with the exact step ID shown in brackets [ID: ...]

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
    } else if (topic && yearGroup) {
      systemPrompt = `You are Cleo, a friendly and encouraging AI tutor teaching ${topic} to a ${yearGroup} student.

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

    // Define tools
    const tools = [
      {
        type: "function",
        name: "move_to_step",
        description: "Call this BEFORE you start teaching a new step. This displays all pre-generated visual content for that step (tables, definitions, questions, diagrams).",
        parameters: {
          type: "object",
          properties: {
            stepId: { 
              type: "string", 
              description: "The exact step ID shown in brackets [ID: ...] in the content library." 
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
        description: "Display an ADDITIONAL table beyond the pre-generated content.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique ID for this table" },
            headers: {
              type: "array",
              items: { type: "string" },
              description: "Column headers"
            },
            rows: {
              type: "array",
              items: {
                type: "array",
                items: { type: "string" }
              },
              description: "Array of rows"
            }
          },
          required: ["id", "headers", "rows"]
        }
      },
      {
        type: "function",
        name: "show_definition",
        description: "Display an ADDITIONAL definition card.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            term: { type: "string" },
            definition: { type: "string" },
            example: { type: "string" }
          },
          required: ["id", "term", "definition"]
        }
      },
      {
        type: "function",
        name: "ask_question",
        description: "Present an ADDITIONAL practice question.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            question: { type: "string" },
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
            explanation: { type: "string" }
          },
          required: ["id", "question", "options"]
        }
      }
    ];

    // Request ephemeral token from OpenAI
    console.log("Requesting ephemeral token from OpenAI...");
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
        input_audio_transcription: {
          model: "whisper-1"
        },
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
      console.error("OpenAI session creation failed:", sessionResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create OpenAI session', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await sessionResponse.json();
    console.log("✅ Ephemeral token created");

    return new Response(
      JSON.stringify({
        client_secret: sessionData.client_secret.value,
        conversationId: conversation.id,
        lessonPlan
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error creating session token:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
