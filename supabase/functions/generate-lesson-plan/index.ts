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
      // Create new lesson plan with lesson_id if provided and valid
      const insertPayload: any = {
        conversation_id: conversationId || null,
        topic,
        year_group: yearGroup,
        status: 'generating'
      };
      
      // Validate and include lesson_id if provided
      if (lessonId) {
        // Check if the lesson exists in lessons table (FK target)
        const { data: lessonExists } = await supabase
          .from('lessons')
          .select('id')
          .eq('id', lessonId)
          .maybeSingle();
        
        if (lessonExists) {
          insertPayload.lesson_id = lessonId;
          console.log('Linking to lessons.id:', lessonId);
        } else {
          console.warn('Provided lessonId does not exist in lessons; skipping link:', lessonId);
          // Continue without lesson_id rather than failing
        }
      }
      
      const result = await supabase
        .from('cleo_lesson_plans')
        .insert(insertPayload)
        .select()
        .single();
      
      if (result.error && (result.error.code === '23503' || (result.error.message || '').includes('cleo_lesson_plans_lesson_id_fkey'))) {
        console.warn('FK violation on lesson_id when inserting cleo_lesson_plans. Retrying without lesson_id.', { lessonId });
        const retryPayload = { ...insertPayload };
        delete retryPayload.lesson_id;
        const retry = await supabase
          .from('cleo_lesson_plans')
          .insert(retryPayload)
          .select()
          .single();
        lessonPlan = retry.data;
        planError = retry.error;
      } else {
        lessonPlan = result.data;
        planError = result.error;
      }
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
3. Content Blocks (tables, definitions, questions, diagrams, text)

⚠️ CRITICAL: Each step MUST have 2-4 content blocks minimum. This is non-negotiable!

CONTENT BLOCK TYPES (with detailed examples):

1. TEXT: Explanatory content or instructions
   Example: { type: "text", title: "Understanding Photosynthesis", data: { content: "Photosynthesis is the process by which plants convert light energy into chemical energy..." } }

2. TABLE: Comparisons, data, organized information
   Example: { type: "table", title: "Plant vs Animal Cells", data: { headers: ["Feature", "Plant Cell", "Animal Cell"], rows: [["Cell Wall", "Yes", "No"], ["Chloroplasts", "Yes", "No"]] } }

3. DEFINITION: Key terms with examples
   Example: { type: "definition", title: "Key Term", data: { term: "Photosynthesis", definition: "The process by which plants make food", example: "A leaf absorbing sunlight to create glucose" } }

4. QUESTION: Check understanding (multiple choice)
   Example: { type: "question", title: "Check Understanding", data: { question: "What gas do plants absorb?", options: [{ text: "Carbon dioxide", isCorrect: true }, { text: "Oxygen", isCorrect: false }], explanation: "Plants absorb CO2 during photosynthesis" } }

5. DIAGRAM: Visual representations
   Example: { type: "diagram", title: "Plant Cell Structure", data: { description: "A cross-section showing cell wall, chloroplasts, nucleus, and vacuole", elements: ["Cell Wall", "Chloroplasts", "Nucleus", "Vacuole"] } }

IMPORTANT RULES:
- Each step MUST contain AT LEAST 2 content blocks
- Mix different content types for variety
- Include teaching_notes to guide how to present each block
- Use prerequisites to ensure blocks are shown in the right order
- Make content age-appropriate for ${yearGroup}
- Focus on depth and engagement, not quantity of steps`
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
                        minItems: 2,
                        description: 'REQUIRED: Each step MUST have at least 2 content blocks. Mix different types for variety.',
                        items: {
                          type: 'object',
                          properties: {
                            type: { 
                              type: 'string',
                              enum: ['table', 'definition', 'question', 'diagram', 'text']
                            },
                            title: { type: 'string' },
                            data: {
                              oneOf: [
                                {
                                  type: 'object',
                                  description: 'Text content',
                                  properties: {
                                    content: { type: 'string' }
                                  },
                                  required: ['content']
                                },
                                {
                                  type: 'object',
                                  description: 'Table data',
                                  properties: {
                                    headers: { type: 'array', items: { type: 'string' } },
                                    rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } }
                                  },
                                  required: ['headers', 'rows']
                                },
                                {
                                  type: 'object',
                                  description: 'Definition',
                                  properties: {
                                    term: { type: 'string' },
                                    definition: { type: 'string' },
                                    example: { type: 'string' }
                                  },
                                  required: ['term', 'definition']
                                },
                                {
                                  type: 'object',
                                  description: 'Question',
                                  properties: {
                                    question: { type: 'string' },
                                    options: {
                                      type: 'array',
                                      items: {
                                        type: 'object',
                                        properties: {
                                          text: { type: 'string' },
                                          isCorrect: { type: 'boolean' }
                                        },
                                        required: ['text', 'isCorrect']
                                      }
                                    },
                                    explanation: { type: 'string' }
                                  },
                                  required: ['question', 'options']
                                },
                                {
                                  type: 'object',
                                  description: 'Diagram',
                                  properties: {
                                    description: { type: 'string' },
                                    elements: { type: 'array', items: { type: 'string' } }
                                  },
                                  required: ['description', 'elements']
                                }
                              ]
                            },
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
                    required: ['id', 'title', 'duration_minutes', 'content_blocks']
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
    
    // Parse the data field of each content block (it comes as a JSON string)
    planData.steps.forEach((step: any) => {
      if (step.content_blocks) {
        step.content_blocks.forEach((block: any) => {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn('Failed to parse content block data:', block.type, e);
            }
          }
        });
      }
    });
    
    // Validate content blocks were generated
    const totalContentBlocks = planData.steps.reduce((sum: number, step: any) => 
      sum + (step.content_blocks?.length || 0), 0
    );
    
    console.log('Parsed plan data:', { 
      objectives: planData.objectives.length,
      steps: planData.steps.length,
      totalContentBlocks,
      contentBlocksPerStep: planData.steps.map((s: any) => ({
        stepId: s.id,
        blocks: s.content_blocks?.length || 0
      }))
    });
    
    // Log warning if any step has no content blocks
    planData.steps.forEach((step: any, idx: number) => {
      if (!step.content_blocks || step.content_blocks.length === 0) {
        console.warn(`⚠️ Step ${idx + 1} (${step.id}) has ZERO content blocks!`);
      }
    });

    // Generate images for diagram blocks
    console.log('Generating images for diagram blocks...');
    for (const step of planData.steps) {
      if (step.content_blocks) {
        for (const block of step.content_blocks) {
          if (block.type === 'diagram' && block.data?.description) {
            try {
              const elements = block.data.elements || [];
              const prompt = `Small compact educational diagram: ${block.data.description}. Must clearly show: ${elements.join(', ')}. Style: minimalist icon-style illustration, simple and clean, white background, suitable for ${yearGroup} students. Size: small thumbnail format, 400x300 pixels maximum.`;
              
              console.log(`Generating image for diagram: ${block.title || 'Untitled'}`);
              
              const imageResponse = await supabase.functions.invoke('generate-diagram-image', {
                body: { prompt }
              });
              
              if (imageResponse.data?.imageUrl) {
                block.data.url = imageResponse.data.imageUrl;
                block.data.caption = block.data.description;
                block.data.alt = `Diagram showing ${elements.join(', ')}`;
                console.log(`✓ Image generated for diagram: ${block.title || 'Untitled'}`);
              } else {
                console.warn(`Failed to generate image for diagram: ${block.title}`, imageResponse.error);
              }
            } catch (error) {
              console.error(`Error generating diagram image for ${block.title}:`, error);
              // Continue without image - DiagramBlock will show placeholder
            }
          }
        }
      }
    }

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