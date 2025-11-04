import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate block data structure based on type
function validateBlockData(type: string, data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  switch (type) {
    case 'text':
      return typeof data.text === 'string' && data.text.length > 0;
    case 'table':
      return Array.isArray(data.headers) && Array.isArray(data.rows) && 
             data.headers.length > 0 && data.rows.length > 0;
    case 'definition':
      return typeof data.term === 'string' && typeof data.definition === 'string' &&
             data.term.length > 0 && data.definition.length > 0;
    case 'question':
      return typeof data.question === 'string' && Array.isArray(data.options) &&
             data.options.length > 0 && data.options.every((opt: any) => 
               typeof opt.text === 'string' && typeof opt.isCorrect === 'boolean'
             );
    case 'diagram':
      return typeof data.description === 'string' && data.description.length > 0;
    default:
      return true;
  }
}

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

    // Validate lessonId against lessons table to avoid FK violations
    let lessonIdToInsert: string | null = null;
    if (lessonId) {
      const { data: existingLesson, error: lessonCheckError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', lessonId)
        .single();
      if (lessonCheckError) {
        console.warn('Lesson check error (continuing without linking lesson):', lessonCheckError.message);
      }
      if (existingLesson?.id) {
        lessonIdToInsert = existingLesson.id;
      } else {
        console.log('Provided lessonId not found, proceeding with null linkage');
      }
    }

    // Create lesson plan record
    const { data: lessonPlan, error: planError } = await supabase
      .from('cleo_lesson_plans')
      .insert({
        lesson_id: lessonIdToInsert,
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
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert curriculum designer creating detailed lesson plans for students.

Your task: Create a comprehensive, engaging lesson plan that pre-generates ALL teaching materials.

LESSON PLAN STRUCTURE:
1. Learning Objectives (3-5 clear, measurable goals)
2. Teaching Sequence (10-15 micro-steps, each 2-3 minutes)
3. Content Blocks (tables, definitions, questions, diagrams, text)

CRITICAL: Each content block MUST have a properly structured 'data' field. Here are the EXACT formats required:

TEXT BLOCKS:
{
  "type": "text",
  "title": "Introduction",
  "data": {
    "text": "Atoms are the fundamental building blocks of all matter. They are incredibly small particles that make up everything around us."
  }
}

TABLE BLOCKS:
{
  "type": "table",
  "title": "Subatomic Particles",
  "data": {
    "headers": ["Particle", "Charge", "Mass", "Location"],
    "rows": [
      ["Proton", "+1", "1 amu", "Nucleus"],
      ["Neutron", "0", "1 amu", "Nucleus"],
      ["Electron", "-1", "~0 amu", "Shells"]
    ]
  }
}

DEFINITION BLOCKS:
{
  "type": "definition",
  "title": "Key Term",
  "data": {
    "term": "Atom",
    "definition": "The smallest unit of a chemical element that retains the properties of that element.",
    "example": "A single hydrogen atom consists of one proton and one electron."
  }
}

QUESTION BLOCKS:
{
  "type": "question",
  "title": "Check Understanding",
  "data": {
    "id": "q1",
    "question": "What is the charge of a proton?",
    "options": [
      {"id": "a", "text": "Positive (+1)", "isCorrect": true},
      {"id": "b", "text": "Negative (-1)", "isCorrect": false},
      {"id": "c", "text": "Neutral (0)", "isCorrect": false}
    ],
    "explanation": "Protons have a positive charge of +1, which balances the negative charge of electrons."
  }
}

DIAGRAM BLOCKS:
{
  "type": "diagram",
  "title": "Atomic Structure",
  "data": {
    "description": "Diagram showing a carbon atom with nucleus containing 6 protons and 6 neutrons, surrounded by 2 electron shells with 2 and 4 electrons respectively.",
    "elements": ["nucleus (6 protons + 6 neutrons)", "inner shell (2 electrons)", "outer shell (4 electrons)", "electron cloud"]
  }
}

For each teaching step, specify:
- What content blocks to display (with COMPLETE data fields)
- When to show them (sequence order)
- How to present them (teaching notes)
- Prerequisites (what must be shown first)

Make content rich, detailed, and age-appropriate for ${yearGroup}.`
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
                              enum: ['table', 'definition', 'question', 'diagram', 'text'],
                              description: 'Type of content block'
                            },
                            title: { 
                              type: 'string',
                              description: 'Title for the content block'
                            },
                            data: { 
                              type: 'object',
                              description: 'Content data - structure depends on type. TEXT: {text: string}, TABLE: {headers: string[], rows: string[][]}, DEFINITION: {term: string, definition: string, example?: string}, QUESTION: {id: string, question: string, options: {id: string, text: string, isCorrect: boolean}[], explanation?: string}, DIAGRAM: {description: string, elements: string[]}',
                              additionalProperties: true
                            },
                            teaching_notes: { 
                              type: 'string',
                              description: 'Notes for the teacher on how to present this content'
                            },
                            prerequisites: {
                              type: 'array',
                              items: { type: 'string' },
                              description: 'IDs of content blocks that should be shown before this one'
                            }
                          },
                          required: ['type', 'data', 'title']
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
      .from('cleo_lesson_plans')
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

    // Insert all content blocks with validation
    const contentBlocks: any[] = [];
    let sequenceOrder = 0;

    for (const step of planData.steps) {
      for (const block of step.content_blocks) {
        // Validate that data is not empty
        if (!block.data || Object.keys(block.data).length === 0) {
          console.warn(`Empty data for block type ${block.type} in step ${step.id}, skipping`);
          continue;
        }

        // Type-specific validation
        const isValid = validateBlockData(block.type, block.data);
        if (!isValid) {
          console.warn(`Invalid data structure for ${block.type} block:`, block.data);
          continue;
        }

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

    console.log(`Generated ${contentBlocks.length} valid content blocks`);

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