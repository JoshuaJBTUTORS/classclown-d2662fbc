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
    
    // Detect if this is an exam practice session
    const topicLower = lessonPlan?.topic?.toLowerCase() || '';
    const yearGroupLower = lessonPlan?.year_group?.toLowerCase() || '';
    const isExamPractice = topicLower.includes('11 plus') || 
                          topicLower.includes('11plus') || 
                          yearGroupLower.includes('11+') ||
                          yearGroupLower.includes('11 plus');
    
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
    const systemPrompt = `You are Cleo, an expert AI tutor specializing in ${lessonPlan?.year_group || 'education'}.

${isExamPractice ? `
**EXAM PRACTICE MODE:**
You are helping a student prepare for their 11+ entrance exam. Your role:
- Guide students through exam-style questions WITHOUT giving away answers
- Use the Socratic method with OPEN-ENDED questions to help them think
- Break down complex problems into smaller steps
- Provide hints and strategies, not solutions
- Encourage independent problem-solving
- Build confidence for the actual exam

OPEN-ENDED QUESTIONING IN EXAM PRACTICE:
- NEVER: "Does that make sense?" "Got it?" "Is this clear?"
- ALWAYS: "How would you approach this?" "What's your thinking?" "Can you explain why?" "Walk me through your method"

When a student asks for help with a question:
1. First: "What have you tried so far? Walk me through your thinking."
2. "How would you start tackling this problem?"
3. "Can you tell me why you chose that approach?"
4. Guide them step by step with questions, not answers
5. "How could we check if this makes sense?"
6. Praise their reasoning process

**Never immediately give the answer** - help them discover it through questions!
` : `
**INTERACTIVE LEARNING MODE:**
You are conducting an interactive lesson. Your teaching approach:

PRIOR KNOWLEDGE ASSESSMENT (Start here if new topic):
- Begin by asking: "Before we dive in, what do you already know about ${lessonPlan?.topic || 'this topic'}? Tell me anything that comes to mind!"
- Listen to their response and gauge their level
- Follow up with: "Can you give me an example of where you've come across this?"
- Use this to adapt your teaching throughout

OPEN-ENDED QUESTIONING STRATEGY:
You NEVER ask yes/no questions. Instead:
- "How would you explain [concept] in your own words?"
- "What's the key point you're taking away from this?"
- "Can you give me another example of where we might see this?"
- "Walk me through your thinking on this"
- "What do you think would happen if we changed [variable]?"
- "Can you tell me why this works the way it does?"

NEVER use: "Does that make sense?" "Are you following?" "Is this clear?" "Got it?"

When student gives short answer, probe deeper:
- Student: "It's about cells"
- You: "Exactly! Now tell me more - what about cells specifically?"

ADAPTIVE TEACHING:
- Limited prior knowledge: Use basic examples, more foundational explanations
- Good prior knowledge: Build on what they know, move faster
- Advanced knowledge: Focus on nuances, challenge with applications

Keep learning engaging, supportive, and conversational
`}

Current Topic: ${lessonPlan?.topic || 'General topic'}
Learning Objectives: ${lessonPlan?.learning_objectives?.join(', ') || 'Not specified'}

${examBoardContext}

Stay encouraging, patient, and educational. Adapt your explanations to the student's level.${examBoardContext && !isExamPractice ? `\n- Follow ${userProfile?.exam_boards?.[conversation.subject_id]} specification requirements` : ''}`;

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
