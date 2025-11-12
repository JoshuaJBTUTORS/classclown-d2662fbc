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
    
    // Detect teaching mode
    const subjectLower = topic.toLowerCase();
    const yearGroupLower = yearGroup?.toLowerCase() || '';
    const isExamPractice = subjectLower.includes('11 plus') || 
                          subjectLower.includes('11plus') || 
                          yearGroupLower.includes('11+') ||
                          yearGroupLower.includes('11 plus');
    
    console.log('Teaching mode:', isExamPractice ? 'exam_practice' : 'continuous_teaching');

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

    // Build lesson plan schema (reusable for initial call and retries)
    const lessonPlanSchema = {
      type: 'object',
      properties: {
        objectives: {
          type: 'array',
          items: { type: 'string' },
          minItems: isExamPractice ? 3 : 3,
          maxItems: isExamPractice ? 4 : 5,
          description: isExamPractice 
            ? '3-4 exam skills to master' 
            : '3-5 clear, measurable learning objectives'
        },
        steps: {
          type: 'array',
          minItems: isExamPractice ? 2 : 3,
          maxItems: isExamPractice ? 2 : 5,
          description: isExamPractice
            ? 'EXACTLY 2 steps: (1) Worked Example, (2) 20 Practice Questions'
            : 'EXACTLY 3-5 teaching steps (NOT micro-steps). Each step should be substantial with multiple content blocks.',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              duration_minutes: { type: 'number' },
              content_blocks: {
                type: 'array',
                minItems: isExamPractice ? 1 : 2,
                description: isExamPractice
                  ? 'Step 1: 1-2 explanation blocks. Step 2: EXACTLY 20 question blocks'
                  : 'REQUIRED: Each step MUST have at least 2 content blocks. Mix different types for variety.',
                items: {
                  type: 'object',
                  properties: {
                    type: { 
                      type: 'string',
                      enum: ['table', 'definition', 'question', 'diagram', 'text']
                    },
                    title: { type: 'string' },
                    data: {
                      type: 'object',
                      description: 'CRITICAL: data MUST be a properly structured object (NOT a string). Never use stringified JSON.',
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
                          description: 'Question - MUST be a properly structured object with question, options array, and explanation',
                          properties: {
                            question: { type: 'string', description: 'The question text' },
                            options: {
                              type: 'array',
                              minItems: 2,
                              description: 'Array of answer options (minimum 2)',
                              items: {
                                type: 'object',
                                properties: {
                                  text: { type: 'string' },
                                  isCorrect: { type: 'boolean' }
                                },
                                required: ['text', 'isCorrect']
                              }
                            },
                            explanation: { type: 'string', description: 'Explanation of the correct answer' }
                          },
                          required: ['question', 'options', 'explanation']
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
                    teaching_notes: { 
                      type: 'string',
                      description: 'REQUIRED: Complete teaching script. Format: "Start by saying: [exact opening phrase]. Key points: • [point 1] • [point 2] • [point 3]. Transition: [exact closing phrase]." For questions, include hints for wrong answers.'
                    },
                    prerequisites: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'REQUIRED: List specific prior knowledge needed. Example: ["Understanding of basic fractions", "Multiplication tables"]. If none: ["None - introductory content"]'
                    },
                    delivery_guidance: {
                      type: 'string',
                      description: 'Optional: Specific delivery tips. Example: "Pause 3 seconds after question", "Use encouraging tone", "If student struggles with X, offer hint: [specific hint]"'
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
    };

    // Build system prompt based on teaching mode
    const systemPrompt = isExamPractice
      ? `You are an expert 11+ exam preparation tutor creating SCRIPTED, cost-optimized lesson plans for AI voice delivery.

Your task: Create a highly structured lesson plan (15-min duration) with detailed teaching scripts that minimize complex AI reasoning during delivery.

LESSON PLAN STRUCTURE FOR 11+ (15-minute optimized):
1. Learning Objectives (3-4 clear exam skills to master)
2. Teaching Sequence with TWO main steps:
   - Step 1 (3 min): "Worked Example" - Scripted demonstration with pre-written narration
   - Step 2 (12 min): "Practice Questions" - 20 exam-style questions with pre-written hints

⚠️ CRITICAL REQUIREMENTS FOR SCRIPT-BASED OPTIMIZATION:
- Every content block MUST have detailed teaching_notes with exact phrases Cleo will say
- Step 1 MUST have 1-2 content blocks with complete teaching script (opening, key points, transitions)
- Step 2 MUST have 20 question blocks with pre-written hints for common mistakes
- Each question must include: mark scheme, model answer, anticipated errors
- teaching_notes must be specific and actionable (not vague guidance)

CONTENT BLOCKS FOR STEP 1 (Worked Example) - MUST BE FULLY SCRIPTED:
- Use "text" blocks with detailed teaching_notes containing exact narration
- Example teaching_notes: "Start by saying: 'Let me show you the method step by step.' Walk through: Step 1 - Identify the numbers. Step 2 - Apply the rule. Step 3 - Check your answer. Then say: 'Now let's practice together.'"
- Use "definition" blocks with teaching_notes for how to explain each term
- Include prerequisites field: what students must know before this (e.g., ['Basic multiplication', 'Place value understanding'])
- Keep it concise - ONE clear example with complete delivery script

⚠️ TEXT FORMATTING RULES:
- Use PLAIN TEXT only - NO HTML tags (<h3>, <p>, <ul>, <li>, etc.)
- For emphasis, use **bold text** (double asterisks)
- Use \n for line breaks and paragraphs
- For lists, use simple bullet points: "• Item 1\n• Item 2"
- For headings, use "## Heading" format or bold
- Example: "Place value tells us the value of each digit.\n\n**Important:** The digit 6 in 4,629 represents 600."

CONTENT BLOCKS FOR STEP 2 (Practice) - FULLY SCRIPTED QUESTIONS:
- YOU MUST GENERATE EXACTLY 20 QUESTION BLOCKS - NO MORE, NO LESS
- Count them as you generate: Question 1/20, Question 2/20, ... Question 20/20
- ALL blocks must be type "question"
- Each question MUST have teaching_notes with pre-written hints (e.g., "If student picks A, say: 'Remember to round UP when the digit is 5 or more.' If student picks C, say: 'Check which place value you're rounding to.'")
- Each question MUST be a complete JSON object with required fields

⚠️ REQUIRED FORMAT (this is CRITICAL):
  {
    type: "question",
    data: {
      question: "What is 347 rounded to the nearest 10?",
      options: [
        { text: "340", isCorrect: false },
        { text: "350", isCorrect: true },
        { text: "300", isCorrect: false },
        { text: "400", isCorrect: false }
      ],
      explanation: "347 is closer to 350 than 340 when rounding to the nearest 10"
    }
  }

❌ WRONG FORMAT (DO NOT USE): 
  { type: "question", data: "What is 347 rounded to the nearest 10?" }

- The data field MUST be an object with question, options (array of 4), and explanation properties
- Questions 1-7: Basic application (7 questions)
- Questions 8-14: Intermediate difficulty (7 questions)
- Questions 15-20: Advanced/challenging (6 questions)
- TOTAL: Exactly 20 questions

⚠️ CRITICAL: If you generate fewer than 20 questions OR use wrong format, the lesson will be rejected!

Make all content appropriate for 11+ entrance exam level (ages 10-11).`
      
      : `You are an expert curriculum designer creating SCRIPTED, cost-optimized lesson plans for AI voice delivery.

Your task: Create a highly structured 15-minute lesson with detailed teaching scripts that minimize complex AI reasoning during delivery.

LESSON PLAN STRUCTURE (15-minute optimized):
1. Learning Objectives (3-5 clear, measurable goals)
2. Teaching Sequence (4-5 FOCUSED steps):
   - Step 1 (2 min): Hook & Context - Engaging opener with scripted hook
   - Step 2 (4 min): Core Concept - Main explanation with pre-written analogies/examples
   - Step 3 (4 min): Worked Examples - 2-3 examples with complete narration scripts
   - Step 4 (3 min): Guided Practice - 3-5 questions with pre-written hints
   - Step 5 (2 min): Quick Check - Recap with scripted key takeaways
3. Content Blocks (each with detailed teaching_notes and prerequisites)

⚠️ CRITICAL SCRIPT-BASED REQUIREMENTS:
- Each content block MUST have teaching_notes with exact phrases/scripts Cleo will use
- Each content block MUST have prerequisites array (what student needs to know)
- teaching_notes must include: opening phrase, 3-5 key bullet points, transition phrase
- Questions must have pre-written hints for wrong answers in teaching_notes
- Each step MUST have 2-4 content blocks minimum

CONTENT BLOCK TYPES (with detailed examples):

1. TEXT: Explanatory content with COMPLETE teaching script
   Example: { 
     type: "text", 
     title: "Understanding Photosynthesis", 
     data: { content: "Photosynthesis is the process by which plants convert light energy into chemical energy.\n\n**Key Point:** Plants use sunlight to make food.\n\n• Requires sunlight, water, and CO2\n• Produces glucose and oxygen\n• Happens in chloroplasts" },
     teaching_notes: "Start by saying: 'Let me explain photosynthesis in simple terms.' Key points to emphasize: • It's how plants make food • They need three things: sunlight, water, CO2 • The output is glucose and oxygen. Then transition: 'Now let's see this in action with an example.'",
     prerequisites: ["Basic understanding of plants", "Knowledge that plants need sunlight"]
   }

2. TABLE: Comparisons, data, organized information
   Example: { type: "table", title: "Plant vs Animal Cells", data: { headers: ["Feature", "Plant Cell", "Animal Cell"], rows: [["Cell Wall", "Yes", "No"], ["Chloroplasts", "Yes", "No"]] } }

3. DEFINITION: Key terms with examples
   Example: { type: "definition", title: "Key Term", data: { term: "Photosynthesis", definition: "The process by which plants make food", example: "A leaf absorbing sunlight to create glucose" } }

4. QUESTION: Check understanding with pre-written hints
   ⚠️ CRITICAL FORMAT - The "data" field MUST be an object, NOT a string:
   
   ✅ CORRECT FORMAT:
   { 
     type: "question", 
     title: "Check Understanding", 
     data: {
       question: "What gas do plants absorb during photosynthesis?",
       options: [
         { text: "Carbon dioxide", isCorrect: true },
         { text: "Oxygen", isCorrect: false },
         { text: "Nitrogen", isCorrect: false },
         { text: "Hydrogen", isCorrect: false }
       ],
       explanation: "Plants absorb CO2 from the air during photosynthesis to make glucose"
     },
     teaching_notes: "If student picks 'Oxygen', say: 'Remember, plants PRODUCE oxygen, they don't absorb it. Think about what gas humans breathe out.' If correct, say: 'Excellent! CO2 is essential for making glucose.'",
     prerequisites: ["Understanding of photosynthesis process"]
   }
   
   ❌ WRONG FORMAT (DO NOT USE):
   { type: "question", data: "What gas do plants absorb?" }
   
   The data field MUST be an object with question, options (array of objects), and explanation properties.

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
- Each step MUST contain AT LEAST 2 content blocks
- Mix different content types for variety
- Include teaching_notes to guide how to present each block
- Use prerequisites to ensure blocks are shown in the right order
- Make content age-appropriate for ${yearGroup}
- Focus on depth and engagement, not quantity of steps`;

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
            content: systemPrompt
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
            parameters: lessonPlanSchema
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
    
    // Validate and detect malformed question blocks
    planData.steps.forEach((step: any) => {
      if (step.content_blocks) {
        step.content_blocks = step.content_blocks.map((block: any) => {
          if (block.type === 'question') {
            // Check if data is a string instead of object
            if (typeof block.data === 'string') {
              console.warn('⚠️ Malformed question detected - data is string instead of object:', block.data);
              block.needsRepair = true;
              block.originalQuestion = block.data;
            }
            // Check if data is object but missing required fields
            else if (typeof block.data === 'object') {
              if (!block.data.question || !block.data.options || !Array.isArray(block.data.options)) {
                console.warn('⚠️ Malformed question detected - missing required fields:', {
                  hasQuestion: !!block.data.question,
                  hasOptions: !!block.data.options,
                  isOptionsArray: Array.isArray(block.data.options)
                });
                block.needsRepair = true;
              } else if (block.data.options.length < 2) {
                console.warn('⚠️ Malformed question - insufficient options:', block.data.options.length);
                block.needsRepair = true;
              }
            }
          }
          return block;
        });
      }
    });

    // Count questions needing repair
    const questionsNeedingRepair = planData.steps.flatMap((s: any) => 
      s.content_blocks?.filter((b: any) => b.type === 'question' && b.needsRepair) || []
    );

    // RETRY LOGIC FOR MALFORMED QUESTIONS (applies to all teaching modes)
    if (questionsNeedingRepair.length > 0) {
      console.warn(`⚠️ ${questionsNeedingRepair.length} questions marked for repair - triggering retry...`);
      console.log('🔄 Retrying with stricter prompt to fix malformed questions...');
      
      const retryPrompt = `CRITICAL: Your previous response had ${questionsNeedingRepair.length} malformed questions.

⚠️ FORMATTING ERROR: Some questions had "data" as a plain string instead of a properly structured object!

Generate a complete lesson plan for "${topic}" (Year Group: ${yearGroup}) with properly formatted questions.

EXAMPLE OF CORRECT QUESTION FORMAT (USE THIS EXACT STRUCTURE):
{
  "type": "question",
  "title": "Check Understanding",
  "data": {
    "question": "What is photosynthesis?",
    "options": [
      { "text": "The process plants use to make food", "isCorrect": true },
      { "text": "The process plants use to breathe", "isCorrect": false },
      { "text": "The process plants use to grow roots", "isCorrect": false },
      { "text": "The process plants use to reproduce", "isCorrect": false }
    ],
    "explanation": "Photosynthesis is the process by which plants convert light energy into chemical energy to make food"
  }
}

CRITICAL RULES:
1. The "data" field MUST be an object with these properties:
   - question: string (the question text)
   - options: array of objects with "text" and "isCorrect" properties
   - explanation: string
2. DO NOT use plain strings for the "data" field
3. Each question MUST have at least 2 options (preferably 4)
4. At least one option must have "isCorrect": true

If you generate questions with incorrect format, the lesson will be rejected.`;

      const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: isExamPractice ? systemPrompt : systemPrompt },
            { role: 'user', content: retryPrompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_lesson_plan',
              description: 'Create a complete lesson plan with properly formatted questions',
              parameters: lessonPlanSchema
            }
          }],
          tool_choice: { type: 'function', function: { name: 'create_lesson_plan' } }
        })
      });
      
      if (!retryResponse.ok) {
        console.error(`Retry API call failed: ${retryResponse.status}`);
        throw new Error(`Retry failed: ${retryResponse.status}`);
      }
      
      const retryData = await retryResponse.json();
      const retryToolCall = retryData.choices[0].message.tool_calls?.[0];
      
      if (retryToolCall) {
        const retryPlanData = JSON.parse(retryToolCall.function.arguments);
        
        // Parse data fields in retry
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
        
        // Validate retry result
        const retryMalformed = retryPlanData.steps.flatMap((s: any) => 
          s.content_blocks?.filter((b: any) => 
            b.type === 'question' && (typeof b.data === 'string' || !b.data?.question)
          ) || []
        );
        
        if (retryMalformed.length === 0) {
          console.log('✅ Retry successful - all questions properly formatted');
          planData.objectives = retryPlanData.objectives;
          planData.steps = retryPlanData.steps;
        } else {
          console.warn(`⚠️ Retry still has ${retryMalformed.length} malformed questions - proceeding with validation`);
          // Use retry data anyway as it might be better
          planData.objectives = retryPlanData.objectives;
          planData.steps = retryPlanData.steps;
        }
      }
    }
    
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
        
        // Check for malformed questions
        const allQuestions = practiceStep.content_blocks?.filter((b: any) => b.type === 'question') || [];
        const malformedQuestions = allQuestions.filter((q: any) => 
          typeof q.data === 'string' || !q.data?.question || !q.data?.options || !Array.isArray(q.data.options)
        );
        
        if (!hasTwoSteps || questionCount < 20 || malformedQuestions.length > 0) {
          console.error(`❌ First attempt non-compliant: steps=${planData.steps.length}, questions=${questionCount}, malformed=${malformedQuestions.length}`);
          console.log('🔄 Retrying with stricter prompt...');
          
          // RETRY WITH ULTRA-EXPLICIT PROMPT
          const retryPrompt = `CRITICAL: Your previous response had problems:
- Question count: ${questionCount} (need exactly 20)
- Malformed questions: ${malformedQuestions.length} (need 0)

${malformedQuestions.length > 0 ? '⚠️ FORMATTING ERROR: Some questions had data as a plain string instead of an object!' : ''}

Generate a complete 11+ exam practice lesson plan for "${topic}" (Year Group: ${yearGroup}) with:

STEP 1: "Worked Example" 
- 1-2 content blocks showing a worked example

STEP 2: "Practice Questions"
- EXACTLY 20 question blocks
- Count each one: Q1, Q2, Q3... up to Q20

EXAMPLE OF CORRECT QUESTION FORMAT (USE THIS EXACT STRUCTURE):
{
  "type": "question",
  "data": {
    "question": "What is 347 rounded to the nearest 10?",
    "options": [
      { "text": "340", "isCorrect": false },
      { "text": "350", "isCorrect": true },
      { "text": "300", "isCorrect": false },
      { "text": "400", "isCorrect": false }
    ],
    "explanation": "347 is closer to 350 because the ones digit (7) is 5 or more"
  }
}

Each question MUST have:
- question: string (the question text)
- options: array of 4 objects with "text" and "isCorrect" properties
- explanation: string

DO NOT generate questions with data as a plain string! The data field MUST be an object.

You MUST generate all 20 questions. If you generate fewer or use wrong format, the lesson will be rejected.`;

          const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
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
            
            // Check for string data (should not happen with strict schema)
            retryPlanData.steps.forEach((step: any) => {
              if (step.content_blocks) {
                step.content_blocks.forEach((block: any) => {
                  if (block.data && typeof block.data === 'string') {
                    console.error(`❌ Retry block ${block.type} has string data (should be object):`, block.data.substring(0, 100));
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
    
    // Final validation before saving - ensure no malformed questions
    const finalValidation = planData.steps.flatMap((step: any, stepIndex: number) => 
      step.content_blocks?.map((b: any, blockIndex: number) => {
        if (b.type === 'question') {
          const issues: string[] = [];
          
          if (typeof b.data === 'string') {
            issues.push('data is a string instead of object');
            console.error(`❌ Question [Step ${stepIndex}, Block ${blockIndex}]: data is string:`, b.data.substring(0, 100));
          }
          if (!b.data?.question) {
            issues.push('missing question field');
          }
          if (!b.data?.options) {
            issues.push('missing options field');
          }
          if (b.data?.options && !Array.isArray(b.data.options)) {
            issues.push('options is not an array');
          }
          if (b.data?.options && Array.isArray(b.data.options) && b.data.options.length < 2) {
            issues.push(`only ${b.data.options.length} options (need at least 2)`);
          }
          if (b.data?.options && Array.isArray(b.data.options) && !b.data.options.some((o: any) => o.isCorrect)) {
            issues.push('no correct answer marked');
          }
          
          if (issues.length > 0) {
            console.error(`❌ Question validation failed [Step ${stepIndex}, Block ${blockIndex}]:`, issues);
            console.error('   Question title:', b.title);
            console.error('   Data type:', typeof b.data);
            console.error('   Data preview:', JSON.stringify(b.data).substring(0, 200));
            return { stepIndex, blockIndex, issues, block: b };
          }
        }
        return null;
      }).filter(v => v !== null) || []
    );

    if (finalValidation.length > 0) {
      const errorDetails = finalValidation.map(v => 
        `Step ${v.stepIndex}, Block ${v.blockIndex}: ${v.issues.join(', ')}`
      ).join('\n  ');
      
      console.error(`❌ Final validation failed: ${finalValidation.length} invalid questions\n  ${errorDetails}`);
      
      // Check if this is a first-time failure - attempt second retry with ultra-strict prompt
      const hasStringData = finalValidation.some(v => v.issues.includes('data is a string instead of object'));
      
      if (hasStringData && isExamPractice) {
        console.log('🔄 Attempting second retry with ultra-strict JSON format prompt...');
        
        const secondRetryPrompt = `CRITICAL ERROR: Your previous responses generated invalid JSON for question data!

❌ WRONG FORMAT (data as STRING):
{
  "type": "question",
  "data": "{\\"question\\": \\"What...\\", \\"options\\": [...]}"  ← This is a STRING, not an object!
}

✅ CORRECT FORMAT (data as OBJECT):
{
  "type": "question",
  "data": {
    "question": "What is 2+2?",
    "options": [
      { "text": "3", "isCorrect": false },
      { "text": "4", "isCorrect": true }
    ],
    "explanation": "2+2=4 is basic addition"
  }
}

Generate the 11+ NVR exam practice lesson for "${topic}" with properly formatted question OBJECTS (NOT strings)!`;

        const secondRetryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: secondRetryPrompt }
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
        
        if (secondRetryResponse.ok) {
          const secondRetryData = await secondRetryResponse.json();
          const secondRetryToolCall = secondRetryData.choices[0].message.tool_calls?.[0];
          
          if (secondRetryToolCall) {
            const secondRetryPlanData = JSON.parse(secondRetryToolCall.function.arguments);
            
            // Check for string data
            secondRetryPlanData.steps.forEach((step: any) => {
              if (step.content_blocks) {
                step.content_blocks.forEach((block: any) => {
                  if (block.data && typeof block.data === 'string') {
                    console.error(`❌ Second retry block ${block.type} still has string data:`, block.data.substring(0, 100));
                  }
                });
              }
            });
            
            const secondRetryPracticeStep = secondRetryPlanData.steps.find((s: any) => 
              s.title.toLowerCase().includes('practice')
            );
            const secondRetryQuestionCount = secondRetryPracticeStep?.content_blocks?.filter(
              (b: any) => b.type === 'question'
            ).length || 0;
            
            console.log(`✅ Second retry generated ${secondRetryQuestionCount} questions`);
            
            if (secondRetryQuestionCount >= 20) {
              planData.objectives = secondRetryPlanData.objectives;
              planData.steps = secondRetryPlanData.steps;
              console.log('✅ Second retry successful - using second retry data');
            } else {
              console.warn(`⚠️ Second retry still non-compliant with ${secondRetryQuestionCount} questions - proceeding anyway`);
            }
          }
        }
      } else {
        throw new Error(`Cannot save lesson plan: ${finalValidation.length} questions have invalid structure:\n${errorDetails}`);
      }
    }
    
    console.log('✅ All questions validated successfully');

    // Generate images for diagram blocks
    console.log('Generating images for diagram blocks...');
    for (const step of planData.steps) {
      if (step.content_blocks) {
        for (const block of step.content_blocks) {
          if (block.type === 'diagram' && block.data?.description) {
            try {
              const elements = block.data.elements || [];
              
              // Enhance vague descriptions with topic context
              let enhancedDescription = block.data.description;
              const topicKeyword = topic.toLowerCase().split(' ')[0];
              if (enhancedDescription.length < 10 || !enhancedDescription.toLowerCase().includes(topicKeyword)) {
                enhancedDescription = `${topic}: ${enhancedDescription}`;
                console.log(`Enhanced vague description: "${block.data.description}" -> "${enhancedDescription}"`);
              }
              
              // Build educational context prompt
              const prompt = `Educational diagram for ${yearGroup} ${topic} lesson: ${enhancedDescription}

Subject: ${topic}
Learning context: ${learningGoal || 'General educational content'}
Must clearly show: ${elements.join(', ')}

Requirements:
- Directly related to ${topic}
- Appropriate for ${yearGroup} students
- Educational and curriculum-focused content only
- NO generic or lifestyle imagery
- Style: minimalist icon-style illustration, simple and clean, white background
- Size: small thumbnail format, 400x300 pixels maximum`;
              
              console.log(`Generating image for diagram: ${block.title || 'Untitled'}`);
              console.log(`Full image prompt: ${prompt.substring(0, 200)}...`);
              
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