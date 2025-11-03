import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  conversationId?: string;
  message: string;
  lessonId?: string;
  moduleId?: string;
  topic?: string;
  yearGroup?: string;
  learningGoal?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's token
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user profile for personalization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.first_name || 'there';

    const { conversationId, message, lessonId, moduleId, topic, yearGroup, learningGoal }: ChatRequest = await req.json();

    let conversation;
    let messages: Message[] = [];

    // If no conversationId, try to reuse existing active conversation
    if (!conversationId) {
      // If lessonId provided, try to find existing conversation for this lesson
      if (lessonId) {
        const { data: existingLesson } = await supabase
          .from('cleo_conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingLesson) {
          conversation = existingLesson;

          // Load message history
          const { data: messageHistory } = await supabase
            .from('cleo_messages')
            .select('role, content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          messages = (messageHistory || []) as Message[];
        } else {
          // Create new conversation for this lesson
          const { data: newConversation, error: convError } = await supabase
            .from('cleo_conversations')
            .insert({
              user_id: user.id,
              lesson_id: lessonId,
              module_id: moduleId || null,
              topic: topic || null,
              year_group: yearGroup || null,
              learning_goal: learningGoal || null,
              status: 'active'
            })
            .select()
            .single();

          if (convError) throw convError;
          conversation = newConversation;

          // Fetch lesson details for personalized greeting
          const { data: lessonData } = await supabase
            .from('course_lessons')
            .select('title, description')
            .eq('id', lessonId)
            .single();

          const lessonTitle = lessonData?.title || topic || 'this topic';
          const lessonDescription = lessonData?.description || '';

          // Create a warm, personalized greeting
          const greetingMessage = `Hi ${userName}! 👋 I'm Cleo, your AI tutor.

I'm excited to help you learn about "${lessonTitle}"!${lessonDescription ? ` ${lessonDescription}` : ''}

I'll guide you through this lesson step by step, checking your understanding as we go. Feel free to ask questions anytime - that's what I'm here for!

Ready to get started? 🌟`;

          // Insert the greeting as the first assistant message
          await supabase
            .from('cleo_messages')
            .insert({
              conversation_id: newConversation.id,
              role: 'assistant',
              content: greetingMessage
            });

          // Add to messages array so it's included in the history
          messages.push({
            role: 'assistant',
            content: greetingMessage
          });
        }
      } else {
        // No lessonId - try reusing latest active conversation for this user
        const { data: existingActive } = await supabase
          .from('cleo_conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .is('lesson_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingActive) {
          conversation = existingActive;

          // Load message history
          const { data: messageHistory } = await supabase
            .from('cleo_messages')
            .select('role, content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

          messages = (messageHistory || []) as Message[];
        } else {
          // Create a new conversation
          const { data: newConversation, error: convError } = await supabase
            .from('cleo_conversations')
            .insert({
              user_id: user.id,
              module_id: moduleId || null,
              topic: topic || null,
              year_group: yearGroup || null,
              learning_goal: learningGoal || null,
              status: 'active'
            })
            .select()
            .single();

          if (convError) throw convError;
          conversation = newConversation;
        }
      }
    } else {
      // Get existing conversation
      const { data: existingConv, error: convError } = await supabase
        .from('cleo_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError) throw convError;
      conversation = existingConv;

      // Get message history
      const { data: messageHistory, error: msgError } = await supabase
        .from('cleo_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      messages = messageHistory as Message[];
    }

    // Store user message
    await supabase
      .from('cleo_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      });

    // Extract learning information if in discovery phase
    if (!conversation.topic || !conversation.year_group) {
      try {
        const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Extract learning information from the user message (which may be a short fragment like "Year 6" or "surds"). If information is present, return it in the specified format.'
              },
              {
                role: 'user',
                content: `User message: "${message}"\n\nPrevious context: topic=${conversation.topic || 'none'}, year_group=${conversation.year_group || 'none'}, learning_goal=${conversation.learning_goal || 'none'}`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'extract_learning_info',
                description: 'Extract topic, year group, and learning goal from user message',
                parameters: {
                  type: 'object',
                  properties: {
                    topic: { 
                      type: 'string', 
                      description: 'The specific subject or topic (e.g., "surds", "photosynthesis", "World War 2")' 
                    },
                    year_group: { 
                      type: 'string', 
                      description: 'Education level (e.g., "Year 7", "GCSE", "A-Level", "University")' 
                    },
                    learning_goal: { 
                      type: 'string', 
                      description: 'Why they want to learn (e.g., "exam preparation", "homework help", "understanding concepts")' 
                    }
                  }
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'extract_learning_info' } }
          }),
        });

        if (extractionResponse.ok) {
          const extractionData = await extractionResponse.json();
          const toolCall = extractionData.choices?.[0]?.message?.tool_calls?.[0];
          
          if (toolCall) {
            const extracted = JSON.parse(toolCall.function.arguments);
            
            // Update conversation with any newly extracted information
            const updates: any = {};
            if (extracted.topic && !conversation.topic) {
              updates.topic = extracted.topic;
              conversation.topic = extracted.topic;
            }
            if (extracted.year_group && !conversation.year_group) {
              updates.year_group = extracted.year_group;
              conversation.year_group = extracted.year_group;
            }
            if (extracted.learning_goal && !conversation.learning_goal) {
              updates.learning_goal = extracted.learning_goal;
              conversation.learning_goal = extracted.learning_goal;
            }
            
            // Save to database
            if (Object.keys(updates).length > 0) {
              await supabase
                .from('cleo_conversations')
                .update(updates)
                .eq('id', conversation.id);
              
              console.log('Updated conversation with:', updates);
            }
          }
        }
      } catch (error) {
        console.error('Error extracting info:', error);
        // Continue with normal flow even if extraction fails
      }
    }

    // Determine conversation phase and build system prompt
    const messageCount = messages.length;
    let systemPrompt = '';

    if (!conversation.topic || !conversation.year_group) {
      // Discovery phase
      const known = [
        conversation.topic ? `topic: ${conversation.topic}` : null,
        conversation.year_group ? `year group: ${conversation.year_group}` : null,
        conversation.learning_goal ? `learning goal: ${conversation.learning_goal}` : null
      ].filter(Boolean).join(' • ') || 'none yet';

      const missing = [
        !conversation.topic ? 'topic' : null,
        !conversation.year_group ? 'year group' : null,
        !conversation.learning_goal ? 'learning goal' : null
      ].filter(Boolean).join(', ');

      const hasGreeting = messages.some(m => m.role === 'assistant');

      systemPrompt = `You are Cleo, a friendly and encouraging AI tutor.

Known info: ${known}
Missing: ${missing || 'none'}

CRITICAL RULES:
- ${hasGreeting ? 'You have already introduced yourself. Do NOT greet again.' : 'This is your first message - greet warmly.'}
- Ask for exactly ONE missing item at a time (topic, year group, or learning goal). If none are missing, immediately start teaching.
- Never repeat a question the student already answered. Acknowledge their answer and move forward.
- Keep replies concise (1–3 short sentences), and use at most 1 emoji.

Continue the conversation naturally from where you left off.`.trim();
    } else {
      // Teaching phase
      systemPrompt = `You are Cleo, an expert AI tutor helping a ${conversation.year_group} student learn about "${conversation.topic}".

Learning Goal: ${conversation.learning_goal || 'General understanding'}

Teaching Guidelines:
- Do NOT restart or re-introduce the topic. Continue from the last assistant message.
- Break down concepts into small, digestible chunks (2-3 sentences maximum before asking a question)
- Use clear, simple language appropriate for their level
- Provide relevant examples and analogies
- Ask questions frequently to check understanding (every 2-3 concepts)
- If they answer incorrectly, provide gentle correction and re-explain using a different approach
- If they answer correctly, praise them and move to the next concept
- Do NOT re-ask the same check-question once answered. Progress to the next concept.
- Use emojis sparingly for encouragement (✓, 🌟, etc.)
- Be patient, supportive, and encouraging
- Never give direct answers to homework - guide them to discover answers themselves
- Keep responses concise and focused

Current teaching strategy:
1. Explain one concept clearly
2. Ask a question to check understanding
3. Based on their answer, either move forward or review
4. Build on previous concepts progressively

Remember: Small steps, frequent questions, lots of encouragement! Keep progressing forward.`;
    }

    // Build messages array for OpenAI
    const openAIMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway with streaming
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: openAIMessages,
        max_tokens: 800,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error('Failed to get AI response');
    }

    // Create a TransformStream to intercept and store the complete response
    let completeResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        
        // Parse SSE format to extract content
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                completeResponse += content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
        
        controller.enqueue(chunk);
      },
      flush: async () => {
        // Store assistant message after streaming completes
        if (completeResponse) {
          try {
            await supabase
              .from('cleo_messages')
              .insert({
                conversation_id: conversation.id,
                role: 'assistant',
                content: completeResponse
              });
          } catch (error) {
            console.error('Error storing assistant message:', error);
          }
        }
      }
    });

    // Return streaming response
    return new Response(
      response.body?.pipeThrough(transformStream),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Conversation-Id': conversation.id,
        },
      }
    );

  } catch (error) {
    console.error('Error in cleo-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
