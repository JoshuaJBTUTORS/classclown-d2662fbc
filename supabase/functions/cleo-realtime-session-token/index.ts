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

    // Build system prompt
    let systemPrompt = `You are Cleo, a friendly AI tutor. Help students learn by providing clear explanations and using your tools to show visual content.`;
    
    if (lessonPlan) {
      const stepsList = lessonPlan.teaching_sequence.map((s: any, i: number) => 
        `${i+1}. ${s.title} [ID: ${s.id}]`
      ).join('\n');
      
      systemPrompt = `You are Cleo teaching ${lessonPlan.topic} to ${lessonPlan.year_group}.

Steps:
${stepsList}

Start: "Hello ${userName}! Today we're learning ${lessonPlan.topic}. Let's begin!"
Then call move_to_step with the first step ID to display content.

Tools:
- move_to_step: Display lesson step content
- show_table: Show additional tables
- show_definition: Define terms
- ask_question: Ask practice questions`;
    }

    // Define tools
    const tools = [
      {
        type: "function",
        name: "move_to_step",
        description: "Display lesson step content",
        parameters: {
          type: "object",
          properties: {
            stepId: { type: "string" },
            stepTitle: { type: "string" }
          },
          required: ["stepId", "stepTitle"]
        }
      },
      {
        type: "function",
        name: "show_table",
        description: "Display a table",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string" },
            headers: { type: "array", items: { type: "string" } },
            rows: { type: "array", items: { type: "array", items: { type: "string" } } }
          },
          required: ["id", "headers", "rows"]
        }
      },
      {
        type: "function",
        name: "show_definition",
        description: "Show a definition",
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
        description: "Ask a question",
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
