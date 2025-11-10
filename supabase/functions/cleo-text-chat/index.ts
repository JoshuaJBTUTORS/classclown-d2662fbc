import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing conversationId or message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation details with subject_id
    const { data: conversation, error: convError } = await supabase
      .from('cleo_conversations')
      .select('*, cleo_lesson_plans(*)')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // Get user profile with exam board info
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, education_level, gcse_subject_ids, exam_boards')
      .eq('id', conversation.user_id)
      .single();

    // Get recent message history
    const { data: history, error: historyError } = await supabase
      .from('cleo_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) throw historyError;

    // Build exam board context
    let examBoardContext = '';
    const lessonPlan = conversation.cleo_lesson_plans;
    
    if (userProfile?.education_level === 'gcse' && userProfile?.exam_boards && conversation.subject_id) {
      const examBoard = userProfile.exam_boards[conversation.subject_id];
      
      if (examBoard) {
        // Fetch specification summary if available
        const { data: spec } = await supabase
          .from('exam_board_specifications')
          .select('summary, key_topics')
          .eq('subject_id', conversation.subject_id)
          .eq('exam_board', examBoard)
          .eq('status', 'active')
          .maybeSingle();
        
        examBoardContext = `\n\nExam Board: ${examBoard}`;
        if (spec?.summary) {
          examBoardContext += `\nSpecification Context: ${spec.summary}`;
        }
        if (spec?.key_topics) {
          const topics = Array.isArray(spec.key_topics) ? spec.key_topics : [];
          if (topics.length > 0) {
            examBoardContext += `\nKey Topics: ${topics.join(', ')}`;
          }
        }
        examBoardContext += `\n\nIMPORTANT: All teaching must align with ${examBoard} ${conversation.topic} specification. Use ${examBoard}-specific terminology, examples, and question styles.`;
      }
    }

    // Build system prompt
    const systemPrompt = `You are Cleo, an AI tutor helping students learn.

Current lesson: ${lessonPlan?.topic || 'General learning'}
Year group: ${lessonPlan?.year_group || 'Not specified'}
Learning objectives: ${lessonPlan?.learning_objectives?.join(', ') || 'Practice and understanding'}${examBoardContext}

Guidelines:
- Keep responses concise and clear (text mode)
- Ask follow-up questions to check understanding
- Provide hints rather than direct answers for practice
- Encourage critical thinking
- Be supportive and patient${examBoardContext ? `\n- Follow ${userProfile?.exam_boards?.[conversation.subject_id]} specification requirements` : ''}`;

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const assistantContent = aiData.choices[0].message.content;

    // Save user message
    await supabase.from('cleo_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
      mode: 'text',
    });

    // Save assistant message
    const { data: savedMessage, error: saveError } = await supabase
      .from('cleo_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        mode: 'text',
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Update conversation text message count
    await supabase.rpc('increment', {
      table_name: 'cleo_conversations',
      id_value: conversationId,
      column_name: 'text_message_count',
      increment_by: 2,
    }).catch(() => {
      supabase.from('cleo_conversations')
        .update({ text_message_count: (conversation.text_message_count || 0) + 2 })
        .eq('id', conversationId);
    });

    return new Response(
      JSON.stringify({ message: savedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleo-text-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
