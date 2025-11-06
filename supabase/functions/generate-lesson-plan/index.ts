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

    console.log('Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId });

    // Find an existing plan using a robust strategy to respect unique indexes
    // Priority: lesson_id -> conversation_id+topic -> standalone (topic+year_group, lesson_id IS NULL)
    let existingPlan = null as any;

    if (lessonId) {
      const { data } = await supabase
        .from('cleo_lesson_plans')
        .select()
        .eq('lesson_id', lessonId)
        .maybeSingle();
      existingPlan = data;
      console.log('Lookup by lesson_id result:', !!existingPlan);
    }

    if (!existingPlan && conversationId) {
      const { data } = await supabase
        .from('cleo_lesson_plans')
        .select()
        .eq('conversation_id', conversationId)
        .eq('topic', topic)
        .maybeSingle();
      existingPlan = data;
      console.log('Lookup by conversation_id+topic result:', !!existingPlan);
    }

    if (!existingPlan) {
      const { data } = await supabase
        .from('cleo_lesson_plans')
        .select()
        .eq('topic', topic)
        .eq('year_group', yearGroup)
        .is('lesson_id', null)
        .maybeSingle();
      existingPlan = data;
      console.log('Lookup standalone (topic+year_group, lesson_id IS NULL) result:', !!existingPlan);
    }

    let lessonPlan;
    let planError;

    if (existingPlan) {
      // If plan is complete and ready, return it immediately without any updates
      if (existingPlan.status === 'ready' && existingPlan.learning_objectives && existingPlan.teaching_sequence) {
        console.log('Found complete existing plan, returning immediately');
        return new Response(
          JSON.stringify({
            lessonPlanId: existingPlan.id,
            objectives: existingPlan.learning_objectives,
            stepsCount: existingPlan.teaching_sequence.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Plan exists but is incomplete, use it for generation without updating
      console.log('Found incomplete existing plan, will complete it');
      lessonPlan = existingPlan;
      planError = null;
    } else {
      // Create new lesson plan with lesson_id if provided
      const insertPayload: any = {
        conversation_id: conversationId || null,
        topic,
        year_group: yearGroup,
        status: 'generating'
      };
      
      // Include lesson_id if provided
      if (lessonId) {
        insertPayload.lesson_id = lessonId;
      }
      
      const result = await supabase
        .from('cleo_lesson_plans')
        .insert(insertPayload)
        .select()
        .single();
      
      lessonPlan = result.data;
      planError = result.error;
    }

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
            content: `You are an expert curriculum designer creating concise, focused lesson plans for students.

Your task: Create a streamlined lesson plan with 3-5 main teaching steps, each containing rich, pre-generated content.

LESSON PLAN STRUCTURE:
1. Learning Objectives (3-5 clear, measurable goals)
2. Teaching Sequence (3-5 FOCUSED steps, each 5-8 minutes)
3. Content Blocks (tables, definitions, questions, diagrams)

IMPORTANT: Create FEWER, RICHER steps instead of many micro-steps.
Each step should be substantial with multiple content blocks.

CONTENT BLOCK TYPES:
- TABLE: Comparisons, data, organized information
- DEFINITION: Key terms with examples
- QUESTION: Check understanding (multiple choice or open-ended)
- DIAGRAM: Visual representations (describe what should be shown)
- TEXT: Explanatory content or instructions

For each teaching step, specify:
- What content blocks to display
- When to show them (sequence order)
- How to present them (teaching notes)
- Prerequisites (what must be shown first)

Make content rich, engaging, and age-appropriate for ${yearGroup}.
Focus on depth rather than breaking content into too many small pieces.`
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
                  minItems: 3,
                  maxItems: 5,
                  description: '3-5 clear, measurable learning objectives'
                },
                steps: {
                  type: 'array',
                  minItems: 3,
                  maxItems: 5,
                  description: 'EXACTLY 3-5 teaching steps (NOT micro-steps). Each step should be substantial with multiple content blocks.',
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

    // Update lesson plan with objectives and full teaching sequence (including content blocks)
    const { error: updateError } = await supabase
      .from('cleo_lesson_plans')
      .update({
        learning_objectives: planData.objectives,
        teaching_sequence: planData.steps,
        status: 'ready'
      })
      .eq('id', lessonPlan.id);

    if (updateError) throw updateError;

    console.log('Lesson plan created successfully:', lessonPlan.id);

    return new Response(
      JSON.stringify({ 
        lessonPlanId: lessonPlan.id,
        objectives: planData.objectives,
        stepsCount: planData.steps.length
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