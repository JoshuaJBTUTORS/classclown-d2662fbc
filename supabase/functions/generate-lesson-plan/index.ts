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

    const { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice = false } = await req.json();

    console.log('Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    // Helper function to get user's exam board for a subject
    async function getUserExamBoardForSubject(userId: string, subjectName: string): Promise<string | null> {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('exam_boards')
        .eq('id', userId)
        .single();
      
      const examBoards = userProfile?.exam_boards || {};
      return examBoards[subjectName?.toLowerCase()] || null;
    }

    // Determine subject name and exam board from lesson structure (via course)
    let subjectName = '';
    let examBoard = '';
    let examBoardSpecs = '';
    
    if (lessonId) {
      console.log('Fetching course and exam board spec from lesson_id:', lessonId);
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select(`
          id,
          module_id,
          course_modules!inner(
            course_id,
            courses!inner(
              subject,
              exam_board_specification_id,
              exam_board_specifications(
                title,
                exam_board,
                extracted_text
              )
            )
          )
        `)
        .eq('id', lessonId)
        .single();
      
      if (lessonData?.course_modules?.courses) {
        const course = lessonData.course_modules.courses;
        subjectName = course.subject;
        console.log('Determined subject from course:', subjectName);
        
        // If course has an exam board spec linked, use it directly
        if (course.exam_board_specifications) {
          const spec = course.exam_board_specifications;
          examBoard = spec.exam_board;
          examBoardSpecs = spec.extracted_text || '';
          console.log('Loaded exam board from course:', examBoard, 'Specs length:', examBoardSpecs.length);
        } else {
          console.log('No exam board specification linked to this course');
        }
      }
    }

    // Fetch learning objectives from the lesson if lessonId is provided
    let learningObjectives: string[] = [];
    let avoidOverlapContext = '';
    
    if (lessonId) {
      const { data: lessonData } = await supabase
        .from('course_lessons')
        .select('content_text, module_id')
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

      // Fetch sibling lessons from the same module to avoid overlap
      if (lessonData?.module_id) {
        const { data: siblingLessons } = await supabase
          .from('course_lessons')
          .select('id, title, description, content_text')
          .eq('module_id', lessonData.module_id)
          .neq('id', lessonId)
          .order('position');

        if (siblingLessons && siblingLessons.length > 0) {
          const lessonSummaries = siblingLessons.map(lesson => {
            let objectives: string[] = [];
            if (lesson.content_text) {
              try {
                const parsed = JSON.parse(lesson.content_text);
                objectives = parsed.objectives || [];
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            return `- "${lesson.title}"${lesson.description ? ` - ${lesson.description}` : ''}${objectives.length > 0 ? `\n  Covers: ${objectives.join(', ')}` : ''}`;
          }).join('\n');

          avoidOverlapContext = `\n\n⚠️ AVOID OVERLAP WITH THESE LESSONS IN THE SAME MODULE:\n${lessonSummaries}\n\nYOUR LESSON MUST:\n- Focus specifically on the narrow scope of "${topic}"\n- NOT repeat content from the above lessons\n- Build upon or complement (not duplicate) existing module content\n- Be precise and targeted, not broad overviews`;
          
          console.log('Loaded sibling lessons for overlap avoidance:', siblingLessons.length);
        }
      }
    }

    // Find an existing plan using a robust strategy to respect unique indexes
    // Priority: lesson_id + exam_board -> lesson_id only -> conversation_id+topic -> standalone
    let existingPlan = null as any;

    // Priority 1: Check by lesson_id + exam_board (if both provided)
    if (lessonId && examBoard) {
      const { data, error: lookupError } = await supabase
        .from('cleo_lesson_plans')
        .select()
        .eq('lesson_id', lessonId)
        .eq('exam_board', examBoard)
        .maybeSingle();
      
      if (lookupError) {
        console.error('Error looking up lesson plan by lesson_id + exam_board:', lookupError);
      } else {
        existingPlan = data;
        console.log('Lookup by lesson_id + exam_board:', !!existingPlan);
      }
    }

    // Priority 2: Check by lesson_id only (if no exam board match found)
    if (!existingPlan && lessonId) {
      const { data } = await supabase
        .from('cleo_lesson_plans')
        .select()
        .eq('lesson_id', lessonId)
        .is('exam_board', null)
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
      exam_board: examBoard || null,
      subject_name: subjectName || null,
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

    // Categorize subject for specialized prompts
    const categorizeSubject = (subject: string): string => {
      const s = subject.toLowerCase();
      if (s.includes('maths') || s.includes('mathematics')) return 'maths';
      if (s.includes('english') && s.includes('language')) return 'english_language';
      if (s.includes('english') && s.includes('literature')) return 'english_literature';
      if (s.includes('computer') || s.includes('computing')) return 'computer_science';
      if (s.includes('biology') || s.includes('chemistry') || s.includes('physics')) return 'science';
      return 'general';
    };

    const subjectCategory = categorizeSubject(subjectName || topic);

    // Generate lesson plan using Lovable AI (Gemini 2.5 Flash - faster than GPT-5 mini)
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
              
              : subjectCategory === 'maths'
              ? `You are an expert GCSE Maths curriculum designer creating concise, exam-focused lesson plans${examBoard ? ` for ${examBoard} ${subjectName}` : ''}.
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `\n📋 EXAM SPECIFICATIONS: ${examBoardSpecs}\n` : ''}

📐 MATHS LESSON STRUCTURE:
Your task: Create a tutor-style maths lesson following this EXACT flow:

TEACHING SEQUENCE (3-4 main steps, 15-20 minutes total):

Step 1: "Concept Introduction" (3-4 minutes)
- 1 text block explaining the concept
- 1 definition block for key formula/term

Step 2: "Worked Example" (5-6 minutes)
- 1 worked_example block showing full solution step-by-step
- Format: { type: "worked_example", data: { problem: "...", steps: [...], key_technique: "..." } }
- Teaching notes: Emphasize method marks and exam technique

Step 3: "Guided Practice" (4-5 minutes)
- 2-3 question blocks with detailed explanations
- Format: Exam-style questions with mark schemes
- Cleo walks through these WITH the student

Step 4: "Independent Practice" (5-7 minutes)
- 3-4 question blocks
- Student completes these independently
- Include mark scheme feedback in explanations

${examBoard === 'AQA' ? '⚠️ AQA STYLE: Use "Show that...", "Work out the value of..." wording. Include method marks clearly (e.g., 2 marks for method, 1 for answer).' : ''}
${examBoard === 'Edexcel' ? '⚠️ EDEXCEL STYLE: Use "Calculate...", "Find the value of..." wording. Show clear step-by-step working.' : ''}

WORKED EXAMPLE FORMAT:
{
  type: "worked_example",
  title: "Worked Example: [Topic]",
  data: {
    problem: "The actual question",
    steps: [
      { step_number: 1, explanation: "First, identify what we know", calculation: "x = 5, y = 3" },
      { step_number: 2, explanation: "Apply the formula", calculation: "A = x × y" },
      { step_number: 3, explanation: "Calculate the answer", calculation: "A = 15" }
    ],
    key_technique: "When solving for area, always identify dimensions first"
  },
  teaching_notes: "Emphasize showing working for method marks"
}`

              : subjectCategory === 'english_language'
              ? `You are an expert GCSE English Language curriculum designer${examBoard ? ` for ${examBoard}` : ''}.
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `\n📋 EXAM SPECIFICATIONS: ${examBoardSpecs}\n` : ''}

📝 ENGLISH LANGUAGE LESSON STRUCTURE:
Focus: Analysis techniques and exam question structure

TEACHING SEQUENCE (3-4 main steps, 15-20 minutes total):

Step 1: "Text Introduction & Context" (3-4 minutes)
- 1 text block with extract
- 1 definition block for key terminology (e.g., "Rhetoric", "Tone")

Step 2: "Model Analysis" (5-6 minutes)
- 1 text block showing model paragraph
- Must include: embedded quotations, analysis structure
- Teaching notes: Point out sentence starters, PEE/PETAL structure

Step 3: "Guided Practice" (4-5 minutes)
- 1-2 question blocks (shorter response, 4 marks)
- Provide sentence starters in teaching notes

Step 4: "Extended Writing Task" (8-10 minutes)
- 1 writing_box block for 8-mark or 12-mark question
- Format: { type: "writing_box", data: { prompt: "...", guidance: "...", sentenceStarters: [...], marks: 8 } }

${examBoard === 'AQA' ? '⚠️ AQA STRUCTURE: Use What/How/Why - "What does the writer do? How do they do it? Why/What effect?"' : ''}
${examBoard === 'Edexcel' ? '⚠️ EDEXCEL STRUCTURE: Use PETAL (Point, Evidence, Technique, Analysis, Link)' : ''}
${!examBoard ? '⚠️ STRUCTURE: Use PEE (Point, Evidence, Explain)' : ''}

MODEL PARAGRAPH EXAMPLE:
"The writer uses powerful imagery to create tension. In the phrase 'shadows crept across the floor,' the verb 'crept' suggests something sinister and threatening. This makes the reader feel uneasy and anticipates danger."

WRITING BOX FORMAT:
{
  type: "writing_box",
  title: "Analysis Question (8 marks)",
  data: {
    prompt: "How does the writer use language to describe the storm? (8 marks)",
    guidance: "Structure your answer using ${examBoard === 'Edexcel' ? 'PETAL' : examBoard === 'AQA' ? 'What/How/Why' : 'PEE'}",
    sentenceStarters: [
      "The writer creates [effect] by...",
      "This is shown in the phrase '...' where...",
      "The technique of [X] suggests...",
      "This makes the reader feel..."
    ],
    marks: 8
  },
  teaching_notes: "Remind students to embed quotations and analyze language"
}`

              : subjectCategory === 'english_literature'
              ? `You are an expert GCSE English Literature curriculum designer${examBoard ? ` for ${examBoard}` : ''}.
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `\n📋 EXAM SPECIFICATIONS: ${examBoardSpecs}\n` : ''}

📚 ENGLISH LITERATURE LESSON STRUCTURE:
⚠️ CRITICAL: All quotations MUST be from actual set texts (Macbeth, Jekyll & Hyde, An Inspector Calls, etc.)

TEACHING SEQUENCE (3-4 main steps, 15-20 minutes total):

Step 1: "Theme/Character Introduction" (3-4 minutes)
- 1 text block introducing theme/character
- 1 table block comparing scenes or character development

Step 2: "Quotation Bank & Analysis" (5-7 minutes)
- 3-4 definition blocks with key quotes
- Format: { type: "definition", data: { term: "Theme/Aspect", definition: "[actual quote from text]", example: "Analysis with context" } }

Step 3: "Close Analysis Practice" (4-5 minutes)
- 2 question blocks focusing on quotation analysis
- Ask: "How does this quote reveal [character/theme]?"

Step 4: "Essay Writing" (8-10 minutes)
- 1 writing_box for full essay response
- Guidance on: selecting quotes, analyzing keywords, linking to context

QUOTATION BANK EXAMPLE:
{
  type: "definition",
  title: "Key Quotations",
  data: {
    term: "Character's Manipulation",
    definition: "'[actual quote from the text]'",
    example: "Analysis: This quote shows... The word '[X]' suggests... This connects to the theme of... Contextually, in [time period]..."
  },
  teaching_notes: "Emphasize context - link to historical/social background"
}

ASSESSMENT OBJECTIVES:
- AO1: Textual references and terminology
- AO2: Language and structure analysis
- AO3: Context (historical, social, cultural)

${examBoard === 'AQA' ? '⚠️ AQA FOCUS: Whole-text knowledge and thematic links' : ''}
${examBoard === 'Edexcel' ? '⚠️ EDEXCEL FOCUS: Specific extract analysis with wider text connections' : ''}`

              : subjectCategory === 'computer_science'
              ? `You are an expert GCSE Computer Science curriculum designer${examBoard ? ` for ${examBoard}` : ''}.
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `\n📋 EXAM SPECIFICATIONS: ${examBoardSpecs}\n` : ''}

💻 COMPUTER SCIENCE LESSON STRUCTURE:
Focus: Definitions, algorithms, and exam-style questions

TEACHING SEQUENCE (3-4 main steps, 15-20 minutes total):

Step 1: "Concept Definition" (3-4 minutes)
- 2-3 definition blocks with GCSE-level language
- Keep definitions clear and exam-board aligned

Step 2: "Code/Algorithm Examples" (5-6 minutes)
- 1-2 code_example blocks
- Format: { type: "code_example", data: { language: "pseudocode", code: "...", explanation: "...", lineHighlights: [2] } }
- Show pseudocode first, then optionally Python
- Teaching notes: Explain logic line-by-line

Step 3: "Practice Questions" (5-7 minutes)
- 3-4 question blocks (mix of multiple choice and short answer)
- Include: definitions, trace tables, code completion

Step 4: "Structured Question" (6-8 minutes)
- 1-2 question blocks (6-8 marks)
- Exam-style format with sub-parts

CODE EXAMPLE FORMAT:
{
  type: "code_example",
  title: "Linear Search Algorithm",
  data: {
    language: "pseudocode",
    code: "FOR each item IN list\\n  IF item == target THEN\\n    RETURN position\\n  ENDIF\\nENDFOR\\nRETURN -1",
    explanation: "This algorithm checks each element until it finds the target or reaches the end",
    lineHighlights: [2]
  },
  teaching_notes: "Emphasize time complexity: O(n)"
}

DIAGRAM TYPES TO USE:
- System architecture (CPU, Von Neumann)
- Network topologies (star, bus, ring)
- Data structures (arrays, linked lists)
- Flowcharts for algorithms

QUESTION VARIETY:
- Multiple choice (4-5 per lesson)
- Short answer definitions (2-3)
- 6-8 mark structured questions (1-2)
- Code tracing exercises (1)`

              : `You are an expert curriculum designer creating concise, focused lesson plans${examBoard ? ` for ${examBoard} ${subjectName}` : ''} for students.
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `

📋 EXAM BOARD SPECIFICATIONS FOR ${examBoard} ${subjectName}:
${examBoardSpecs}

🎯 CRITICAL REQUIREMENTS - EXAM BOARD ALIGNMENT:
- MUST align all learning objectives with the Assessment Objectives (AOs) stated above
- MUST use ${examBoard}-specific terminology and methods
- MUST structure questions to match ${examBoard} exam paper formats
- MUST include exam tips that reference marking criteria from above
- MUST focus on question types that appear in ${examBoard} papers
- Reference specific topics from the specification when relevant

Example of good exam board integration:
"In ${examBoard} ${subjectName} Paper 1, questions on this topic typically award 6 marks for..."
"Remember, ${examBoard} examiners are looking for [specific criteria from marking scheme]..."
"This connects to Assessment Objective 2 (AO2) - applying knowledge to new situations..."
` : examBoard ? `

⚠️ EXAM BOARD CONTEXT: This lesson is for ${examBoard} ${subjectName}, but detailed specifications are not available.
- Use general GCSE/11+ best practices for ${examBoard}
- Keep content broad and applicable to the ${examBoard} curriculum
- When discussing exam techniques, mention "${examBoard}" specifically but avoid specification details
- Example: "In your ${examBoard} exam, you'll need to..." rather than specific paper structures
` : ''}

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
${learningObjectives.length > 0 ? `\nPredefined Learning Objectives (MUST use these exactly):\n${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}` : ''}${avoidOverlapContext}

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
                              enum: ['table', 'definition', 'question', 'diagram', 'text', 'worked_example', 'writing_box', 'code_example']
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
                                },
                                {
                                  type: 'object',
                                  description: 'Worked Example (for Maths) - step-by-step solution',
                                  properties: {
                                    problem: { type: 'string', description: 'The question/problem to solve' },
                                    steps: {
                                      type: 'array',
                                      items: {
                                        type: 'object',
                                        properties: {
                                          step_number: { type: 'number' },
                                          explanation: { type: 'string' },
                                          calculation: { type: 'string' },
                                          visual_note: { type: 'string' }
                                        },
                                        required: ['step_number', 'explanation']
                                      }
                                    },
                                    key_technique: { type: 'string', description: 'The main method/technique being demonstrated' }
                                  },
                                  required: ['problem', 'steps', 'key_technique']
                                },
                                {
                                  type: 'object',
                                  description: 'Writing Box (for English) - extended writing task',
                                  properties: {
                                    prompt: { type: 'string', description: 'The question/task' },
                                    guidance: { type: 'string', description: 'Structure guidance (e.g., PEE, PETAL)' },
                                    sentenceStarters: { 
                                      type: 'array', 
                                      items: { type: 'string' },
                                      description: 'Optional sentence starters to help students'
                                    },
                                    wordTarget: { type: 'number', description: 'Optional target word count' },
                                    marks: { type: 'number', description: 'Mark allocation' }
                                  },
                                  required: ['prompt', 'guidance', 'marks']
                                },
                                {
                                  type: 'object',
                                  description: 'Code Example (for Computer Science) - code/pseudocode with explanation',
                                  properties: {
                                    language: { 
                                      type: 'string',
                                      enum: ['pseudocode', 'python', 'javascript'],
                                      description: 'Programming language'
                                    },
                                    code: { type: 'string', description: 'The actual code' },
                                    explanation: { type: 'string', description: 'What the code does' },
                                    lineHighlights: {
                                      type: 'array',
                                      items: { type: 'number' },
                                      description: 'Optional line numbers to highlight'
                                    }
                                  },
                                  required: ['language', 'code', 'explanation']
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
${avoidOverlapContext}

You MUST generate all 20 questions. If you generate fewer, the lesson will be rejected.`;

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