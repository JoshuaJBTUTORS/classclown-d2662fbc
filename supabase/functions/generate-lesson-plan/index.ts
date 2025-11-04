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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in to generate lesson plans' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lessonId, topic, yearGroup, learningGoal, conversationId } = await req.json();

    console.log('Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal });

    // Create lesson plan record
    const { data: lessonPlan, error: planError } = await supabase
      .from('lesson_plans')
      .insert({
        lesson_id: lessonId,
        conversation_id: conversationId,
        topic,
        year_group: yearGroup,
        status: 'generating'
      })
      .select()
      .single();

    if (planError) throw planError;

    // Generate lesson plan using Lovable AI
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
            content: `You are an expert curriculum designer creating detailed lesson plans for students.

Your task: Create a comprehensive, engaging lesson plan that pre-generates ALL teaching materials.

LESSON PLAN STRUCTURE:
1. Learning Objectives (3-5 clear, measurable goals)
2. Teaching Sequence (10-15 micro-steps, each 2-3 minutes)
3. Content Blocks (tables, definitions, questions, diagrams)

CONTENT BLOCK TYPES:
- TABLE: Comparisons, data, organized information
- DEFINITION: Key terms with examples
- QUESTION: Check understanding (multiple choice or open-ended)
- DIAGRAM: Visual representations (describe what should be shown)

For each teaching step, specify:
- What content blocks to display
- When to show them (sequence order)
- How to present them (teaching notes)
- Prerequisites (what must be shown first)

Make content rich, engaging, and age-appropriate for ${yearGroup}.`
          },
          {
            role: 'user',
            content: `Create a lesson plan for teaching: ${topic}
Year Group: ${yearGroup}
${learningGoal ? `Learning Goal: ${learningGoal}` : ''}

Generate a complete lesson with all necessary tables, definitions, diagrams, and questions.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_lesson_plan',
            description: 'Create a structured lesson plan with pre-generated content',
            parameters: {
              type: 'object',
              properties: {
                objectives: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '3-5 clear learning objectives'
                },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      duration_minutes: { type: 'number' },
                      content_blocks: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { 
                              type: 'string',
                              enum: ['table', 'definition', 'question', 'diagram', 'text']
                            },
                            title: { type: 'string' },
                            data: { type: 'object' },
                            teaching_notes: { type: 'string' },
                            prerequisites: {
                              type: 'array',
                              items: { type: 'string' }
                            }
                          },
                          required: ['type', 'data']
                        }
                      }
                    },
                    required: ['id', 'title', 'content_blocks']
                  }
                }
              },
              required: ['objectives', 'steps']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_lesson_plan' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add Lovable AI credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No lesson plan generated');
    }

    const planData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed plan data:', { 
      objectives: planData.objectives.length,
      steps: planData.steps.length 
    });

    // Update lesson plan with objectives and sequence
    const { error: updateError } = await supabase
      .from('lesson_plans')
      .update({
        learning_objectives: planData.objectives,
        teaching_sequence: planData.steps.map((s: any) => ({
          id: s.id,
          title: s.title,
          duration_minutes: s.duration_minutes
        })),
        status: 'ready'
      })
      .eq('id', lessonPlan.id);

    if (updateError) throw updateError;

    // Insert all content blocks
    const contentBlocks: any[] = [];
    let sequenceOrder = 0;

    for (const step of planData.steps) {
      for (const block of step.content_blocks) {
        contentBlocks.push({
          lesson_plan_id: lessonPlan.id,
          block_type: block.type,
          sequence_order: sequenceOrder++,
          step_id: step.id,
          title: block.title || '',
          data: block.data,
          teaching_notes: block.teaching_notes || '',
          prerequisites: block.prerequisites || []
        });
      }
    }

    if (contentBlocks.length > 0) {
      const { error: blocksError } = await supabase
        .from('lesson_content_blocks')
        .insert(contentBlocks);

      if (blocksError) throw blocksError;
    }

    console.log('Lesson plan created successfully:', lessonPlan.id);

    return new Response(
      JSON.stringify({ 
        lessonPlanId: lessonPlan.id,
        objectives: planData.objectives,
        stepsCount: planData.steps.length,
        contentBlocksCount: contentBlocks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating lesson plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});