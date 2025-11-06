import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { lessonPlanId, conversationId } = await req.json();

    if (!lessonPlanId) {
      throw new Error('lessonPlanId is required');
    }

    console.log('Generating content for lesson plan:', lessonPlanId);

    // Fetch the lesson plan
    const { data: lessonPlan, error: planError } = await supabase
      .from('cleo_lesson_plans')
      .select('*')
      .eq('id', lessonPlanId)
      .single();

    if (planError || !lessonPlan) {
      throw new Error('Lesson plan not found');
    }

    // Check if content already exists
    const { data: existingContent } = await supabase
      .from('cleo_content_blocks')
      .select('id')
      .eq('lesson_plan_id', lessonPlanId)
      .limit(1);

    if (existingContent && existingContent.length > 0) {
      console.log('Content already exists for this lesson plan');
      return new Response(JSON.stringify({ message: 'Content already generated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse teaching sequence to get steps
    const teachingSequence = lessonPlan.teaching_sequence;
    if (!teachingSequence || !Array.isArray(teachingSequence)) {
      throw new Error('Invalid teaching sequence');
    }

    console.log(`Generating content for ${teachingSequence.length} steps`);

    // Generate content for each step using Lovable AI
    const systemPrompt = `You are an expert educational content creator. Generate detailed, engaging teaching materials for each lesson step.

For each step, create 2-4 content blocks that cover the topic thoroughly. Use a variety of content types:
- TEXT: Clear explanations and descriptions
- TABLE: Organized information comparisons
- DEFINITION: Key terms with examples
- QUESTION: Multiple choice questions to check understanding
- DIAGRAM: Descriptions of visual aids

CRITICAL: The "data" field must contain actual content, never leave it empty!

CONTENT BLOCK EXAMPLES:

TEXT type - data is a plain string:
{
  "type": "text",
  "title": "Introduction to Forces",
  "data": "Forces are pushes or pulls that can cause objects to speed up, slow down, or change direction. They are measured in Newtons (N)."
}

TABLE type - data is an object with headers and rows:
{
  "type": "table",
  "title": "Contact vs Non-Contact Forces",
  "data": {
    "headers": ["Contact Forces", "Non-Contact Forces"],
    "rows": [
      ["Friction", "Gravity"],
      ["Air resistance", "Magnetic force"],
      ["Tension", "Electrostatic force"]
    ]
  }
}

DEFINITION type - data is an object with term, definition, example:
{
  "type": "definition",
  "title": "Key Term",
  "data": {
    "term": "Contact Force",
    "definition": "A force that acts between objects that are physically touching.",
    "example": "When you push a book across a table, you apply a contact force."
  }
}

QUESTION type - data is an object with question, options array, explanation:
{
  "type": "question",
  "title": "Check Understanding",
  "data": {
    "question": "Which of these is a non-contact force?",
    "options": [
      {"id": "a", "text": "Friction", "isCorrect": false},
      {"id": "b", "text": "Gravity", "isCorrect": true},
      {"id": "c", "text": "Tension", "isCorrect": false}
    ],
    "explanation": "Gravity is a non-contact force because it acts at a distance without physical touch."
  }
}

DIAGRAM type - data is an object with caption and alt text:
{
  "type": "diagram",
  "title": "Forces Diagram",
  "data": {
    "caption": "A diagram showing the forces acting on a stationary object on a table, with weight pointing downward and normal force pointing upward.",
    "alt": "Forces diagram with arrows showing weight and normal force"
  }
}`;

    const userPrompt = `Generate detailed teaching content for this lesson:

Topic: ${lessonPlan.topic}
Year Group: ${lessonPlan.year_group}
Learning Objectives: ${lessonPlan.learning_objectives}

Teaching Steps:
${teachingSequence.map((step: any, idx: number) => `${idx + 1}. ${step.title}`).join('\n')}

For each step, create 2-4 diverse content blocks with fully populated data fields. Return ONLY the JSON array of content blocks.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_lesson_content',
            description: 'Generate detailed content blocks for lesson steps',
            parameters: {
              type: 'object',
              properties: {
                content_blocks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      step_index: { type: 'number', description: 'Index of the step (0-based)' },
                      type: { 
                        type: 'string',
                        enum: ['text', 'table', 'definition', 'question', 'diagram']
                      },
                      title: { type: 'string' },
                      data: {
                        description: 'Content data - structure depends on type. For text: string. For table: {headers, rows}. For definition: {term, definition, example}. For question: {question, options, explanation}. For diagram: {caption, alt}'
                      },
                      teaching_notes: { type: 'string' }
                    },
                    required: ['step_index', 'type', 'title', 'data']
                  }
                }
              },
              required: ['content_blocks']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_lesson_content' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'rate_limit',
          message: 'AI rate limit reached. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'payment_required',
          message: 'AI credits required. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract content from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const contentData = JSON.parse(toolCall.function.arguments);
    const contentBlocks = contentData.content_blocks;

    if (!contentBlocks || contentBlocks.length === 0) {
      throw new Error('No content blocks generated');
    }

    console.log(`Generated ${contentBlocks.length} content blocks`);

    // Validate content blocks
    for (const block of contentBlocks) {
      if (!block.data || (typeof block.data === 'object' && Object.keys(block.data).length === 0)) {
        console.error('Invalid block:', block);
        throw new Error(`Content block "${block.title}" has empty data`);
      }
    }

    // Save content blocks to database
    const blocksToInsert = contentBlocks.map((block: any, idx: number) => ({
      lesson_plan_id: lessonPlanId,
      conversation_id: conversationId,
      step_id: teachingSequence[block.step_index]?.id || `step-${block.step_index}`,
      type: block.type,
      data: block.data,
      title: block.title,
      teaching_notes: block.teaching_notes,
      order_index: idx,
      visible: true
    }));

    const { error: insertError } = await supabase
      .from('cleo_content_blocks')
      .insert(blocksToInsert);

    if (insertError) {
      console.error('Error inserting content blocks:', insertError);
      throw insertError;
    }

    console.log('Successfully saved content blocks');

    return new Response(JSON.stringify({ 
      success: true,
      contentBlockCount: contentBlocks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-lesson-content:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
