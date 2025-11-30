import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeMessageContent(content: string): string {
  // Remove base64 image data URLs (they start with data:image/)
  return content
    .replace(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g, '[IMAGE REMOVED]')
    .replace(/!\[.*?\]\(data:image\/[^\)]+\)/g, '[IMAGE]') // Markdown images
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    
    if (!conversationId) {
      throw new Error('conversationId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation and messages
    const { data: conversation, error: convError } = await supabase
      .from('cleo_conversations')
      .select(`
        *,
        cleo_messages(content, role)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract key concepts from conversation
    const messages = conversation.cleo_messages || [];
    const conversationText = messages
      .filter((m: any) => m.role === 'assistant')
      .map((m: any) => sanitizeMessageContent(m.content))
      .join('\n\n');

    // Generate flashcards using AI
    let flashcards = [];
    
    if (lovableApiKey) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an educational assistant that creates high-quality flashcards for effective learning. Generate 8-12 flashcards based on the lesson content. Each flashcard should have a front (question or term) and back (answer or definition), a difficulty level (easy, medium, or hard), and optionally include visual cues or examples.'
            },
            {
              role: 'user',
              content: `Create comprehensive flashcards for this lesson about "${conversation.lesson_title}":\n\n${conversationText.slice(0, 4000)}\n\nInclude various difficulty levels and focus on key concepts, definitions, and application questions.`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_flashcards',
              description: 'Create flashcards from lesson content with difficulty levels',
              parameters: {
                type: 'object',
                properties: {
                  flashcards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        front: { 
                          type: 'string',
                          description: 'The question or term'
                        },
                        back: { 
                          type: 'string',
                          description: 'The answer or definition'
                        },
                        difficulty: {
                          type: 'string',
                          enum: ['easy', 'medium', 'hard'],
                          description: 'Difficulty level of the flashcard'
                        },
                        example: {
                          type: 'string',
                          description: 'Optional example or context'
                        }
                      },
                      required: ['front', 'back', 'difficulty']
                    }
                  }
                },
                required: ['flashcards']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'create_flashcards' } }
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const args = JSON.parse(toolCall.function.arguments);
          flashcards = args.flashcards || [];
        }
      }
    }

    // Fallback: Generate basic flashcards if AI fails
    if (flashcards.length === 0) {
      flashcards = [
        {
          front: `What did you learn about ${conversation.lesson_title}?`,
          back: 'Review your lesson notes to remember the key concepts covered.',
          difficulty: 'medium'
        },
        {
          front: 'Key Topic: ' + conversation.lesson_title,
          back: 'This lesson covered fundamental concepts. Review your conversation with Cleo for details.',
          difficulty: 'easy'
        }
      ];
    }

    // Insert flashcards as notes
    const noteInserts = flashcards.map((card: any) => ({
      user_id: user.id,
      lesson_id: conversation.lesson_id,
      course_id: conversation.course_id,
      note_type: 'flashcard',
      title: card.front,
      content: JSON.stringify({
        front: card.front,
        back: card.back,
        example: card.example
      }),
      difficulty: card.difficulty || 'medium',
      mastery_level: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedNotes, error: insertError } = await supabase
      .from('course_notes')
      .insert(noteInserts)
      .select();

    if (insertError) {
      console.error('Error inserting flashcards:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        flashcardsGenerated: flashcards.length,
        flashcards: insertedNotes 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating flashcards:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
