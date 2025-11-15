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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

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

    const { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice = false } = await req.json();

    console.log('Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    // Fetch learning objectives from the lesson if lessonId is provided
    let learningObjectives: string[] = [];
    if (lessonId) {
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('content_text')
        .eq('id', lessonId)
        .single();
      
      if (lessonData?.content_text) {
        try {
          const parsedContent = JSON.parse(lessonData.content_text);
          if (parsedContent.objectives && Array.isArray(parsedContent.objectives)) {
            learningObjectives = parsedContent.objectives;
            console.log('Loaded learning objectives from CSV:', learningObjectives);
          }
        } catch (e) {
          console.warn('Failed to parse lesson content_text:', e);
        }
      }
    }

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
      // If plan is complete and ready, check compliance before reusing
      if (existingPlan.status === 'ready' && existingPlan.learning_objectives && existingPlan.teaching_sequence) {
        // For exam practice mode, validate compliance
        if (isExamPractice) {
          const steps = existingPlan.teaching_sequence || [];
          const hasTwoSteps = steps.length === 2;
          const practiceStep = steps.find((s: any) => 
            (s.title || '').toLowerCase().includes('practice')
          );
          const questionCount = practiceStep?.content_blocks?.filter(
            (b: any) => b.type === 'question'
          ).length || 0;
          
          if (hasTwoSteps && questionCount >= 20) {
            console.log('Found compliant exam practice plan, returning immediately');
            return new Response(
              JSON.stringify({
                lessonPlanId: existingPlan.id,
                objectives: existingPlan.learning_objectives,
                stepsCount: existingPlan.teaching_sequence.length
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.log(`Existing plan is not exam-practice compliant (steps: ${steps.length}, questions: ${questionCount}), regenerating...`);
            // Fall through to regeneration - mark as generating and overwrite
            await supabase
              .from('cleo_lesson_plans')
              .update({ status: 'generating' })
              .eq('id', existingPlan.id);
            lessonPlan = existingPlan;
            planError = null;
          }
        } else {
          // Non-exam practice: return existing plan as before
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

    // Generate lesson plan using OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: isExamPractice 
              ? `You are an expert 11+ exam preparation tutor creating practice-focused lesson plans.

Your task: Create a lesson plan optimized for EXAM PRACTICE with one worked example followed by 20 practice questions.

LESSON PLAN STRUCTURE FOR 11+:
1. Learning Objectives (3-4 clear exam skills to master)
2. Teaching Sequence with TWO main steps:
   - Step 1: "Worked Example" - One detailed example showing method/technique
   - Step 2: "Practice Questions" - 20 exam-style questions

⚠️ CRITICAL REQUIREMENTS:
- Step 1 MUST have 1-2 content blocks showing a worked example with explanation
- Step 2 MUST have 20 question blocks (type: "question")
- Each question should be exam-style with multiple choice options
- Questions should gradually increase in difficulty
- Include clear explanations for each answer

CONTENT BLOCKS FOR STEP 1 (Worked Example):
- Use "text" blocks for explanation of method
- Use "definition" blocks for key concepts/formulas
- Keep it concise - focus on ONE clear example

⚠️ TEXT FORMATTING RULES:
- Use PLAIN TEXT only - NO HTML tags (<h3>, <p>, <ul>, <li>, etc.)
- For emphasis, use **bold text** (double asterisks)
- Use \n for line breaks and paragraphs
- For lists, use simple bullet points: "• Item 1\n• Item 2"
- For headings, use "## Heading" format or bold
- Example: "Place value tells us the value of each digit.\n\n**Important:** The digit 6 in 4,629 represents 600."

CONTENT BLOCKS FOR STEP 2 (Practice):
- YOU MUST GENERATE EXACTLY 20 QUESTION BLOCKS - NO MORE, NO LESS
- Count them as you generate: Question 1/20, Question 2/20, ... Question 20/20
- ALL blocks must be type "question"
- Format: { type: "question", data: { question: "...", options: [...], explanation: "..." } }
- Questions 1-7: Basic application (7 questions)
- Questions 8-14: Intermediate difficulty (7 questions)
- Questions 15-20: Advanced/challenging (6 questions)
- TOTAL: Exactly 20 questions

⚠️ CRITICAL: If you generate fewer than 20 questions, the lesson will be rejected. Count carefully!

Make all content appropriate for 11+ entrance exam level (ages 10-11).`
              
              : `You are an expert curriculum designer creating concise, focused lesson plans for students.

Your task: Create a streamlined lesson plan optimized for 15-20 minute sessions with 3-4 main teaching steps.

LESSON PLAN STRUCTURE:
1. Learning Objectives (3-4 clear, measurable goals)
2. Teaching Sequence (3-4 FOCUSED steps, targeting 15-20 minutes total)
3. Content Blocks (tables, definitions, questions, diagrams, text)

⚠️ TARGET DURATION: Aim for 15-20 minutes total. Keep content concise and focused.

⚠️ CRITICAL: Each step MUST have 2-3 content blocks. Keep it focused and concise for 15-20 minute lessons.

CONTENT BLOCK TYPES (with detailed examples):

1. TEXT: Explanatory content or instructions
   Example: { type: "text", title: "Understanding Photosynthesis", data: { content: "Photosynthesis is the process by which plants convert light energy into chemical energy.\n\n**Key Point:** Plants use sunlight to make food.\n\n• Requires sunlight, water, and CO2\n• Produces glucose and oxygen\n• Happens in chloroplasts" } }

2. TABLE: Comparisons, data, organized information
   Example: { type: "table", title: "Plant vs Animal Cells", data: { headers: ["Feature", "Plant Cell", "Animal Cell"], rows: [["Cell Wall", "Yes", "No"], ["Chloroplasts", "Yes", "No"]] } }

3. DEFINITION: Key terms with examples
   Example: { type: "definition", title: "Key Term", data: { term: "Photosynthesis", definition: "The process by which plants make food", example: "A leaf absorbing sunlight to create glucose" } }

4. QUESTION: Check understanding (multiple choice)
   Example: { type: "question", title: "Check Understanding", data: { question: "What gas do plants absorb?", options: [{ text: "Carbon dioxide", isCorrect: true }, { text: "Oxygen", isCorrect: false }], explanation: "Plants absorb CO2 during photosynthesis" } }

5. DIAGRAM: Visual representations
   Example: { type: "diagram", title: "Plant Cell Structure", data: { description: "A cross-section showing cell wall, chloroplasts, nucleus, and vacuole", elements: ["Cell Wall", "Chloroplasts", "Nucleus", "Vacuole"] } }

⚠️ TEXT FORMATTING RULES FOR ALL CONTENT:
- Use PLAIN TEXT only - NO HTML tags (<h3>, <p>, <ul>, <li>, etc.)
- For emphasis, use **bold text** (double asterisks)
- Use line breaks (\n) to separate paragraphs
- For lists, use simple bullet points: "• Item 1\n• Item 2\n• Item 3"
- For numbered lists: "1. Step one\n2. Step two\n3. Step three"
- For headings, use "## Heading" or bold: "**Key Concept**"
- Keep formatting simple and clean
- Example: "Photosynthesis is the process by which plants convert light energy.\n\n**Key fact:** Plants need sunlight, water, and CO2.\n\n• Occurs in chloroplasts\n• Produces glucose and oxygen\n• Essential for plant growth"

IMPORTANT RULES:
- Target 15-20 minutes total duration
- 3-4 steps maximum for conciseness
- Each step MUST contain 2-3 content blocks
- Mix different content types for variety
- Include teaching_notes to guide how to present each block
- Use prerequisites to ensure blocks are shown in the right order
- Make content age-appropriate for ${yearGroup}
- Focus on core concepts - avoid unnecessary detail`
          },
          {
            role: 'user',
            content: `Create a lesson plan for teaching: ${topic}
Year Group: ${yearGroup}
${learningGoal ? `Learning Goal: ${learningGoal}` : ''}
${learningObjectives.length > 0 ? `\nPredefined Learning Objectives (MUST use these exactly):\n${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}` : ''}

Generate a complete lesson with all necessary tables, definitions, diagrams, and questions.${learningObjectives.length > 0 ? ' Make sure to use the predefined learning objectives listed above.' : ''}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_lesson_plan',
            description: isExamPractice 
              ? 'Create an exam practice lesson plan with worked example and practice questions'
              : 'Create a structured lesson plan with pre-generated content',
            parameters: {
              type: 'object',
              properties: {
                objectives: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: isExamPractice ? 3 : 3,
                  maxItems: isExamPractice ? 4 : 4,
                  description: isExamPractice 
                    ? '3-4 exam skills to master' 
                    : '3-4 clear, measurable learning objectives'
                },
                steps: {
                  type: 'array',
                  minItems: isExamPractice ? 2 : 3,
                  maxItems: isExamPractice ? 2 : 4,
                  description: isExamPractice
                    ? 'EXACTLY 2 steps: (1) Worked Example, (2) 20 Practice Questions'
                    : '3-4 focused teaching steps targeting 15-20 minutes total. Each step should be substantial with 2-3 content blocks.',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      duration_minutes: { type: 'number' },
                      content_blocks: {
                        type: 'array',
                        minItems: isExamPractice ? 1 : 2,
                        maxItems: isExamPractice ? 20 : 3,
                        description: isExamPractice
                          ? 'Step 1: 1-2 explanation blocks. Step 2: EXACTLY 20 question blocks'
                          : 'REQUIRED: Each step MUST have 2-3 content blocks for concise 15-20 minute lessons.',
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
                                  description: 'Text content (PLAIN TEXT ONLY - no HTML tags. Use **bold** for emphasis, \\n for line breaks, • for bullets)',
                                  properties: {
                                    content: { 
                                      type: 'string',
                                      description: 'Plain text content with simple markdown. NO HTML tags. Use **text** for bold, \\n for paragraphs, • for bullet points.'
                                    }
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
    
    // Validate exam practice structure - enforce strict compliance
    if (isExamPractice) {
      const hasTwoSteps = planData.steps.length === 2;
      const practiceStep = planData.steps.find((s: any) => 
        s.title.toLowerCase().includes('practice')
      );
      
      if (practiceStep) {
        const questionCount = practiceStep.content_blocks?.filter(
          (b: any) => b.type === 'question'
        ).length || 0;
        
        console.log(`Exam practice validation: ${questionCount} questions generated (target: 20, steps: ${planData.steps.length})`);
        
        if (!hasTwoSteps || questionCount < 20) {
          console.error(`❌ First attempt non-compliant: steps=${planData.steps.length}, questions=${questionCount}`);
          console.log('🔄 Retrying with stricter prompt...');
          
          // RETRY WITH ULTRA-EXPLICIT PROMPT
          const retryPrompt = `CRITICAL: Your previous response had only ${questionCount} questions but you MUST generate EXACTLY 20 questions.

Generate a complete 11+ exam practice lesson plan for "${topic}" (Year Group: ${yearGroup}) with:

STEP 1: "Worked Example" 
- 1-2 content blocks showing a worked example

STEP 2: "Practice Questions"
- EXACTLY 20 question blocks
- Count each one: Q1, Q2, Q3... up to Q20
- Each question must have:
  * A clear question text
  * 4 multiple choice options
  * One correct answer (isCorrect: true)
  * An explanation

You MUST generate all 20 questions. If you generate fewer, the lesson will be rejected.`;

          const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-mini-2025-08-07',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: retryPrompt }
              ],
              tools: [{
                type: 'function',
                function: {
                  name: 'create_lesson_plan',
                  description: 'Create a complete lesson plan',
                  parameters: lessonPlanSchema
                }
              }],
              tool_choice: { type: 'function', function: { name: 'create_lesson_plan' } }
            })
          });
          
          if (!retryResponse.ok) {
            throw new Error(`Retry failed: ${retryResponse.status}`);
          }
          
          const retryData = await retryResponse.json();
          const retryToolCall = retryData.choices[0].message.tool_calls?.[0];
          
          if (retryToolCall) {
            const retryPlanData = JSON.parse(retryToolCall.function.arguments);
            
            // Parse data fields
            retryPlanData.steps.forEach((step: any) => {
              if (step.content_blocks) {
                step.content_blocks.forEach((block: any) => {
                  if (block.data && typeof block.data === 'string') {
                    try {
                      block.data = JSON.parse(block.data);
                    } catch (e) {
                      console.warn('Failed to parse retry content block data:', block.type, e);
                    }
                  }
                });
              }
            });
            
            const retryPracticeStep = retryPlanData.steps.find((s: any) => 
              s.title.toLowerCase().includes('practice')
            );
            const retryQuestionCount = retryPracticeStep?.content_blocks?.filter(
              (b: any) => b.type === 'question'
            ).length || 0;
            
            console.log(`✅ Retry generated ${retryQuestionCount} questions`);
            
            if (retryQuestionCount >= 20) {
              // Use retry data instead
              planData.objectives = retryPlanData.objectives;
              planData.steps = retryPlanData.steps;
              console.log('✅ Retry successful - using retry data');
            } else {
              console.warn(`⚠️ Retry still non-compliant with ${retryQuestionCount} questions - proceeding anyway`);
            }
          }
        }
      } else {
        console.error(`❌ Exam practice plan missing 'Practice' step`);
        throw new Error('Invalid exam practice plan: Missing practice questions step');
      }
    }

    // Generate images for diagram blocks in parallel
    console.log('Generating images for diagram blocks...');
    
    // Collect all diagram blocks that need images
    const diagramsToGenerate: Array<{
      block: any;
      prompt: string;
      title: string;
    }> = [];
    
    for (const step of planData.steps) {
      if (step.content_blocks) {
        for (const block of step.content_blocks) {
          if (block.type === 'diagram' && block.data?.description) {
            const elements = block.data.elements || [];
            const prompt = `Small compact educational diagram: ${block.data.description}. Must clearly show: ${elements.join(', ')}. Style: minimalist icon-style illustration, simple and clean, white background, suitable for ${yearGroup} students. Size: small thumbnail format, 400x300 pixels maximum.`;
            diagramsToGenerate.push({
              block,
              prompt,
              title: block.title || 'Untitled'
            });
          }
        }
      }
    }
    
    // Generate all images in parallel
    if (diagramsToGenerate.length > 0) {
      console.log(`Generating ${diagramsToGenerate.length} diagram images in parallel...`);
      
      const imagePromises = diagramsToGenerate.map(async ({ block, prompt, title }) => {
        try {
          console.log(`Generating image for diagram: ${title}`);
          
          const imageResponse = await supabase.functions.invoke('generate-diagram-image', {
            body: { prompt }
          });
          
          if (imageResponse.data?.imageUrl) {
            block.data.url = imageResponse.data.imageUrl;
            block.data.caption = block.data.description;
            const elements = block.data.elements || [];
            block.data.alt = `Diagram showing ${elements.join(', ')}`;
            console.log(`✓ Image generated for diagram: ${title}`);
          } else {
            console.warn(`Failed to generate image for diagram: ${title}`, imageResponse.error);
          }
        } catch (error) {
          console.error(`Error generating diagram image for ${title}:`, error);
          // Continue without image - DiagramBlock will show placeholder
        }
      });
      
      // Wait for all images to complete
      await Promise.all(imagePromises);
      console.log(`✓ All ${diagramsToGenerate.length} diagram images processed`);
    } else {
      console.log('No diagram blocks require image generation');
    }

    // Calculate estimated duration
    const estimatedMinutes = Math.ceil(planData.steps.length * 3); // Rough estimate: 3 min per step
    const contentBlockCount = planData.steps.reduce((total: number, step: any) => {
      return total + (step.content_blocks?.length || 0);
    }, 0);

    // Update lesson plan with objectives, teaching sequence, and duration estimate
    const { error: updateError } = await supabase
      .from('cleo_lesson_plans')
      .update({
        learning_objectives: planData.objectives,
        teaching_sequence: planData.steps,
        estimated_duration_minutes: estimatedMinutes,
        content_block_count: contentBlockCount,
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