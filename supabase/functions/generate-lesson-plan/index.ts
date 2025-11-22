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

    // Generate lesson plan using Lovable AI (Gemini 2.5 Pro - better JSON schema adherence)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
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
              
              : `🚀 SUPER SYSTEM PROMPT (ULTRA-COMPRESSED + STRICT)

SYSTEM — FOLLOW ALL INSTRUCTIONS EXACTLY.

You are an expert curriculum designer generating concise, exam-board-aligned lesson plans${examBoard ? ` for ${examBoard} ${subjectName}` : ''} using the specification below:
${learningGoal ? `\nLearning Goal: ${learningGoal}` : ''}
${examBoardSpecs ? `

EXAM BOARD SPECIFICATION:
${examBoardSpecs}

🎯 CORE RULES (NON-NEGOTIABLE)

Align EVERYTHING with the Assessment Objectives (AOs) in the spec.
Use terminology, question formats, and marking logic specific to ${examBoard}.
Reference topics directly from the specification.
Include exam-technique tips tied to marking criteria.
KEEP IT SHORT: 15–20 minutes total, 3–4 teaching steps.
` : examBoard ? `

⚠️ EXAM BOARD CONTEXT: This lesson is for ${examBoard} ${subjectName}, but detailed specifications are not available.
- Use general GCSE/11+ best practices for ${examBoard}
- Keep content broad and applicable to the ${examBoard} curriculum
- When discussing exam techniques, mention "${examBoard}" specifically but avoid specification details
- Example: "In your ${examBoard} exam, you'll need to..." rather than specific paper structures
` : ''}

📘 REQUIRED LESSON PLAN STRUCTURE

Learning Objectives: 3–4 measurable, AO-aligned goals.
Teaching Sequence: 3–4 steps, each with 2–3 content blocks.
Content Blocks: Must only use the approved JSON block types below.

🔧 APPROVED CONTENT BLOCK TYPES (STRICT JSON)

TEXT BLOCK
{ "type": "text", "title": "Title", "data": "Plain text only.\\nUse **bold**.\\n• Bullet points\\n• No HTML" }

TABLE BLOCK
{ "type": "table", "title": "Title", "data": { "headers": ["A","B"], "rows": [["1","2"],["3","4"]] } }

DEFINITION BLOCK
{ "type": "definition", "title": "Title", "data": { "term": "Term", "definition": "Meaning", "example": "Short example" } }

QUESTION BLOCK (MCQ/Short)
{ "type": "question", "title": "Title", "data": { "question": "Q", "options":[{"text":"A","isCorrect":false},{"text":"B","isCorrect":true}], "explanation":"Reason" } }

DIAGRAM BLOCK
{ "type": "diagram", "title": "Title", "data": { "description": "What it shows", "elements": ["A","B","C"] } }

WORKED EXAMPLE BLOCK
{
  "type": "worked_example",
  "title": "Title",
  "data": {
    "question": "Exam-style Q",
    "examContext": "How it appears in ${examBoard}",
    "steps":[
      { "number":1, "title":"Step", "explanation":"Why", "workShown":"Working" }
    ],
    "finalAnswer":"Answer",
    "examTips":["Tip 1"]
  }
}

QUOTE ANALYSIS BLOCK (English Literature ONLY)
{
  "type": "quote_analysis",
  "title": "Key Quote Analysis",
  "data": {
    "quote": "exact quote",
    "source": "Act/Scene ONLY",
    "context": "brief explanation",
    "thematicLinks": ["Theme1","Theme2"],
    "keyWords": ["word1","word2"],
    "techniques": ["Technique1","Technique2"],
    "examTips": ["Tip 1","Tip 2"]
  }
}

📝 FORMATTING RULES

Plain text only.
Use **bold** for emphasis.
Use "•" for bullets.
Use numbered lists when needed.
No HTML tags.
Keep content short, exam-focused, and clean.${
  // Detect if this is a Maths lesson
  subjectName?.toLowerCase().includes('math') ? `

🧮 MATHEMATICS — MANDATORY STRUCTURE

STEP 1: Introduction & Explanation (1 content block)
- 1 TEXT block: Clear, concise explanation of the concept
- Keep it simple and focused (2-3 paragraphs max)
- Use examples to illustrate key points

STEP 2: Worked Examples (2 content blocks)
- 2 WORKED_EXAMPLE blocks: Fully worked solutions
- Show complete working with step-by-step breakdown
- Include examContext, clear steps with workShown, finalAnswer
- Add examTips for each example

STEP 3: Guided Practice (2 content blocks)
- 2 QUESTION blocks with extensive guidance
- teaching_notes MUST say: "Guide student through this step-by-step. Ask them what to do first, then second, etc."
- Include detailed explanation field showing full working
- These are collaborative - Cleo solves WITH the student

STEP 4: Independent Practice (3-4 content blocks)
- 3-4 QUESTION blocks: Exam-style questions
- teaching_notes MUST say: "Student completes independently. Provide hints only if stuck."
- Real GCSE-style questions appropriate for ${examBoard || 'GCSE'}
- Vary difficulty: 1-2 easier, 1-2 harder, 1 challenging

⚠️ CRITICAL MATHS RULES:
- Total blocks: 8-9 (1 explanation + 2 worked + 2 guided + 3-4 solo)
- Steps: Exactly 4 steps following the structure above
- NO mixing of content types within steps
- teaching_notes must clearly distinguish between "guided" and "solo" questions
- All questions must be exam-relevant and mark-scheme aligned

📐 LATEX FORMATTING FOR ALL MATHEMATICAL CONTENT

CRITICAL: Use LaTeX syntax for ALL mathematical expressions in Maths lessons.

Inline math: Use $...$ for expressions like $x^2$, $\\\\frac{2}{3}$
Display math: Use $$...$$ for equations like $$ax^2 + bx + c = 0$$

Common LaTeX patterns you MUST use:
- Fractions: $\\\\frac{numerator}{denominator}$ → Example: $\\\\frac{2}{3}$ NOT "2/3"
- Powers: $x^2$, $x^{10}$ → Example: $x^2$ NOT "x²"
- Square roots: $\\\\sqrt{x}$, $\\\\sqrt{16}$ → Example: $\\\\sqrt{16}$ NOT "√16"
- Multiplication: $\\\\times$ → Example: $2 \\\\times 3$ NOT "2 × 3" or "2 * 3"
- Division: $\\\\div$ → Example: $10 \\\\div 2$ NOT "10 ÷ 2"
- Greek letters: $\\\\pi$, $\\\\theta$, $\\\\alpha$

⚠️ DOUBLE BACKSLASHES IN JSON:
Since this is JSON, you MUST escape backslashes. Use \\\\\\\\frac NOT \\\\frac
Example: "question": "Solve $\\\\\\\\frac{x}{2} = 5$"

NEVER use plain text for math:
❌ WRONG: "Calculate 2/3 + 1/5"
✅ CORRECT: "Calculate $\\\\\\\\frac{2}{3} + \\\\\\\\frac{1}{5}$"

❌ WRONG: "x squared equals 16"
✅ CORRECT: "$x^2 = 16$"

Apply LaTeX to: question fields, workShown fields, explanation fields, finalAnswer, text blocks with math

⚠️ CRITICAL - DEFINITION BLOCKS IN MATHS:
- The "example" field MUST be PLAIN TEXT without LaTeX delimiters
- Do NOT use $...$ in the example field
- Only use LaTeX in the "definition" field if showing a formula` : ''
}${
  // Detect if this is an English Literature lesson
  subjectName?.toLowerCase().includes('english') && subjectName?.toLowerCase().includes('literature') ? `

📚 ENGLISH LITERATURE — MANDATORY STRUCTURE

STEP 1: Context & Theme Introduction (2 content blocks)
- 1 TEXT block: Brief context about the scene/section/chapter
- 1 TEXT block: Introduction to the key themes
- Keep concise - this is scene-setting

STEP 2: Quote Analysis (2-3 content blocks)
- 2-3 QUOTE_ANALYSIS blocks: Literary quotes for deep analysis
- Each block must include: quote, source (Act/Chapter/Scene), context, thematicLinks, keyWords, techniques array
- Focus on quotes that exemplify the themes

STEP 3: Making Notes (2 content blocks)
- 1 TEXT block: Guidance on what notes to make
- 1 DEFINITION block: Key literary term or concept
- Pause for students to write down key insights

STEP 4: Exam Practice (1-2 content blocks)
- 1-2 QUESTION blocks: Essay-style questions (NO options field)
- CRITICAL: For essay questions, include: marks, assessmentObjectives, themesFocus, textReferences, successCriteria, planningPrompts
- Example question structure: "How does [author] present [theme] in this extract?"

⚠️ CRITICAL ENGLISH LITERATURE RULES:
- Total blocks: 7-9 blocks across 4 steps
- Steps: Exactly 4 steps following the structure above
- Focus on ANALYSIS and INTERPRETATION, not just comprehension
- Link everything back to exam assessment objectives

### CRITICAL: Content Block JSON Structure for English Literature

**TEXT BLOCK:**
{
  "type": "text",
  "title": "Act 2 Context",
  "data": "Act 2 of Macbeth takes place immediately after Macbeth has decided to murder King Duncan..."
}
CRITICAL: The data field is a PLAIN STRING, not an object.

**TABLE BLOCK:**
{
  "type": "table",
  "title": "Themes in Act 2",
  "data": {
    "headers": ["Theme", "Example Quote", "Analysis"],
    "rows": [
      ["Ambition", "Is this a dagger which I see before me", "Macbeth's ambition manifests as hallucination"]
    ]
  }
}
CRITICAL: The data field MUST be an object with "headers" (array) and "rows" (array of arrays).

**QUESTION BLOCK (Essay Style):**
{
  "type": "question",
  "title": "Exam Practice Question",
  "data": {
    "id": "q1",
    "question": "How does Shakespeare present the theme of ambition in Act 2 of Macbeth?",
    "marks": 20,
    "examBoard": "AQA",
    "assessmentObjectives": ["AO1: Textual references", "AO2: Language/structure analysis", "AO3: Context"],
    "themesFocus": ["Ambition", "Power", "Consequences"],
    "textReferences": ["Act 2, Scene 1 - Dagger soliloquy", "Act 2, Scene 2 - After the murder"],
    "successCriteria": ["Embed short, relevant quotations", "Analyze language and structural choices"],
    "exampleParagraph": "Shakespeare presents ambition as a destructive force...",
    "planningPrompts": ["What is your main argument?", "Which 3-4 quotes best support this?"]
  }
}
CRITICAL: The data field MUST be an object. DO NOT include "options" field for essay questions.

**QUOTE ANALYSIS BLOCK — STRICT JSON OUTPUT ONLY**

📝 SYSTEM — When generating quote analysis, you MUST return a VALID JSON object and NOTHING else.

STRICT RULES:
- Return ONLY valid JSON. No markdown codeblocks.
- Field names MUST match EXACTLY (case-sensitive).
- "source" is ALWAYS the Act/Scene, NEVER the speaker.
- "thematicLinks" MUST be an array of strings ["Theme1", "Theme2"]
- "techniques" MUST be an array of strings ["Metaphor", "Imagery"]
- "examTips" MUST be an array of short strings
- No extra fields. No missing fields.

EXAMPLE:
{
  "type": "quote_analysis",
  "title": "Dagger Soliloquy Analysis",
  "data": {
    "quote": "Is this a dagger which I see before me, the handle toward my hand?",
    "source": "Macbeth, Act 2, Scene 1",
    "context": "Macbeth hallucinates a dagger before murdering King Duncan",
    "thematicLinks": ["Ambition", "Guilt", "Supernatural"],
    "keyWords": ["dagger", "see", "handle"],
    "techniques": ["Rhetorical question", "Supernatural imagery", "Symbolism"],
    "examTips": ["Embed quotes smoothly", "Link to context of regicide"]
  }
}

**DEFINITION BLOCK:**
{
  "type": "definition",
  "title": "Key Literary Term",
  "data": {
    "term": "Soliloquy",
    "definition": "A speech in which a character speaks their thoughts aloud, typically when alone on stage",
    "example": "Macbeth's dagger speech in Act 2 Scene 1 is a famous soliloquy revealing his inner conflict"
  }
}
CRITICAL: The data field MUST be an object with "term", "definition", and "example" fields.

⚠️ VALIDATION RULES:
- NEVER generate the data field as a plain string for table, question, quote_analysis, or definition blocks
- ALWAYS structure data as shown in the examples above
- For TEXT blocks, data IS a plain string (not an object)
- For QUOTE_ANALYSIS blocks, "techniques" MUST be a string array, NOT objects
- For all other blocks, data MUST be a properly structured object` : ''
}

✔️ Output Requirements

Produce a full lesson plan using ONLY the approved block types.
All JSON must be valid.
No extra fields.
No explanations outside the lesson content.
{
  type: "question",
  title: "Exam Practice Question",
  data: {
    question: "How does Shakespeare present the theme of ambition in Macbeth?",
    marks: 20,
    assessmentObjectives: ["AO1: Textual references", "AO2: Language/structure analysis", "AO3: Context"],
    themesFocus: ["Ambition", "Power", "Consequences"],
    textReferences: ["Act 1 Scene 5 - Lady Macbeth's soliloquy", "Act 2 Scene 1 - Dagger soliloquy"],
    successCriteria: [
      "Embed short, relevant quotations",
      "Analyze language and structural choices",
      "Link to historical/social context",
      "Develop a clear argument throughout"
    ],
    exampleParagraph: "Shakespeare presents ambition as a destructive force through...",
    planningPrompts: ["What is your main argument?", "Which 3-4 quotes best support this?", "How does context link to your points?"]
  }
}` : ''
}`
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
                  minItems: isExamPractice ? 2 : (subjectName?.toLowerCase().includes('math') ? 4 : 3),
                  maxItems: isExamPractice ? 2 : (subjectName?.toLowerCase().includes('math') ? 4 : 4),
                  description: isExamPractice
                    ? 'EXACTLY 2 steps: (1) Worked Example, (2) 20 Practice Questions'
                     : subjectName?.toLowerCase().includes('math')
                       ? 'EXACTLY 4 steps for Maths: (1) Explanation, (2) 2 Worked Examples, (3) 2 Guided Practice, (4) 3-4 Independent Practice'
                       : subjectName?.toLowerCase().includes('english') && subjectName?.toLowerCase().includes('literature')
                         ? 'EXACTLY 4 steps for English Literature: (1) Context & Theme Introduction, (2) Quote Analysis, (3) Making Notes, (4) Exam Practice'
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
                               enum: ['table', 'definition', 'question', 'diagram', 'text', 'worked_example', 'quote_analysis']
                             },
                            title: { type: 'string' },
                             data: {
                              oneOf: [
                                {
                                  type: 'string',
                                  description: 'Text content (PLAIN TEXT ONLY - no HTML tags. Use **bold** for emphasis, \\n for line breaks, • for bullets). For text blocks, data is a plain string, NOT an object.'
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
                                   description: 'Definition - term, definition (can use LaTeX), and plain-text example WITHOUT LaTeX delimiters',
                                   properties: {
                                     term: { type: 'string' },
                                     definition: { type: 'string', description: 'Technical definition, can include LaTeX formulas' },
                                     example: { type: 'string', description: 'Plain text example WITHOUT LaTeX $...$. Use regular text: "angle A", "side b"' }
                                   },
                                   required: ['term', 'definition']
                                 },
                                 {
                                   type: 'object',
                                   description: 'Question - Multiple choice OR Essay question',
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
                                       },
                                       description: 'Options for multiple choice. Omit for essay questions.'
                                     },
                                     explanation: { type: 'string' },
                                     marks: { type: 'number', description: 'For essay questions: number of marks' },
                                     examBoard: { type: 'string', description: 'For essay questions: exam board (optional)' },
                                     assessmentObjectives: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'For essay questions: Assessment Objectives being tested'
                                     },
                                     themesFocus: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'For essay questions: Themes to explore'
                                     },
                                     textReferences: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'For essay questions: Key quotes or scenes to reference'
                                     },
                                     successCriteria: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'For essay questions: What makes a strong answer'
                                     },
                                     exampleParagraph: { type: 'string', description: 'For essay questions: Model paragraph (optional)' },
                                     planningPrompts: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'For essay questions: Planning questions to help structure answer'
                                     }
                                   },
                                   required: ['question']
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
                                   description: 'Worked Example - step-by-step solution showing method and reasoning',
                                   properties: {
                                     question: { type: 'string', description: 'The problem or question being solved' },
                                     examContext: { type: 'string', description: 'Optional: exam board context (e.g., "AQA GCSE Paper 1, 4 marks")' },
                                     steps: {
                                       type: 'array',
                                       items: {
                                         type: 'object',
                                         properties: {
                                           number: { type: 'number', description: 'Step number (1, 2, 3...)' },
                                           title: { type: 'string', description: 'Brief step title (e.g., "Subtract 5 from both sides")' },
                                           explanation: { type: 'string', description: 'Why we do this step' },
                                           workShown: { type: 'string', description: 'The actual mathematical/logical work. Use \\n for line breaks.' }
                                         },
                                         required: ['number', 'title', 'explanation']
                                       }
                                     },
                                     finalAnswer: { type: 'string', description: 'The final answer with units if applicable' },
                                     examTips: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'Optional: exam-specific tips for this type of question'
                                     }
                                   },
                                   required: ['question', 'steps', 'finalAnswer']
                                 },
                                 {
                                   type: 'object',
                                   description: 'Quote Analysis - for English Literature',
                                   properties: {
                                     quote: { type: 'string', description: 'The literary quote to analyze' },
                                     source: { type: 'string', description: 'Source (e.g., "Act 3, Scene 2")' },
                                     context: { type: 'string', description: 'Context of the quote in the text' },
                                     thematicLinks: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'Themes connected to this quote'
                                     },
                                     keyWords: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'Key words/phrases for analysis'
                                     },
                                     techniques: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'Literary techniques used (array of strings, e.g., ["Metaphor", "Imagery"])'
                                     },
                                     examTips: {
                                       type: 'array',
                                       items: { type: 'string' },
                                       description: 'Optional: exam-specific tips for analyzing this quote'
                                     }
                                   },
                                   required: ['quote', 'source', 'context', 'thematicLinks', 'keyWords', 'techniques']
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
    console.log('AI response status:', aiResponse.status);

    // Validate response structure
    if (!aiData.choices || !Array.isArray(aiData.choices) || aiData.choices.length === 0) {
      console.error('Invalid AI response:', JSON.stringify(aiData).substring(0, 500));
      throw new Error(`AI API error: ${aiData.error?.message || 'No choices returned'}`);
    }

    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No lesson plan generated - AI returned no tool calls');
    }

    const planData = JSON.parse(toolCall.function.arguments);
    
    // Helper: Repair worked example string data
    function repairWorkedExampleString(dataStr: string): any {
      try {
        if (typeof dataStr === 'object') return dataStr;
        return JSON.parse(dataStr);
      } catch (e) {
        console.error('Failed to parse worked_example data:', e);
        return null;
      }
    }
    
    // Helper: Repair text block string data
    function repairTextBlockString(data: any): string | null {
      try {
        if (typeof data === 'string') return data;
        if (data && typeof data === 'object' && data.text) return data.text;
        if (data && typeof data === 'object' && data.content) return data.content;
        return null;
      } catch (e) {
        return null;
      }
    }
    
    // Helper: Repair table block string data
    function repairTableBlockString(data: any): {headers: string[], rows: string[][]} | null {
      try {
        if (data && data.headers && Array.isArray(data.headers) && data.rows && Array.isArray(data.rows)) {
          return data;
        }
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.headers && parsed.rows) return parsed;
          } catch {}
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    
    // Helper: Repair question block string data
    function repairQuestionBlockString(data: any): any | null {
      try {
        if (data && data.id && data.question) return data;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.id && parsed.question) return parsed;
          } catch {}
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    
    // Helper: Repair definition block string data
    function repairDefinitionString(data: any): any | null {
      try {
        if (data && data.term && data.definition) return data;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.term && parsed.definition) return parsed;
          } catch {}
          
          // Try extracting from plain text
          const termMatch = data.match(/^([^:]+):/);
          const term = termMatch ? termMatch[1].trim() : 'Key Term';
          const definition = termMatch ? data.substring(termMatch[0].length).trim() : data;
          
          return { term, definition, example: '' };
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    
    // Parse and repair content blocks with validation
    const invalidBlocks: string[] = [];
    
    planData.steps.forEach((step: any, stepIndex: number) => {
      if (!step.content_blocks) return;
      
      step.content_blocks = step.content_blocks.filter((block: any, blockIndex: number) => {
        const blockId = `Step ${stepIndex + 1}, Block ${blockIndex + 1} (${block.type})`;
        
        // Handle text blocks
        if (block.type === 'text') {
          const repaired = repairTextBlockString(block.data);
          if (repaired) {
            block.data = repaired;
            return true;
          } else {
            console.error(`❌ Invalid text block: ${blockId}`);
            invalidBlocks.push(blockId);
            return false;
          }
        }
        
        // Handle table blocks
        if (block.type === 'table') {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn(`⚠️ Failed to parse table data: ${blockId}`, e);
            }
          }
          
          const repaired = repairTableBlockString(block.data);
          if (repaired) {
            block.data = repaired;
            return true;
          } else {
            console.error(`❌ Invalid table block: ${blockId}`, block.data);
            invalidBlocks.push(blockId);
            return false;
          }
        }
        
        // Handle question blocks
        if (block.type === 'question') {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn(`⚠️ Failed to parse question data: ${blockId}`, e);
            }
          }
          
          const repaired = repairQuestionBlockString(block.data);
          if (repaired) {
            block.data = repaired;
            return true;
          } else {
            console.error(`❌ Invalid question block: ${blockId}`, block.data);
            invalidBlocks.push(blockId);
            return false;
          }
        }
        
        // Handle definition blocks
        if (block.type === 'definition') {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn(`⚠️ Failed to parse definition data: ${blockId}`, e);
            }
          }
          
          const repaired = repairDefinitionString(block.data);
          if (repaired) {
            block.data = repaired;
            // Remove LaTeX from examples
            if (block.data.example?.includes('$')) {
              block.data.example = block.data.example.replace(/\$/g, '');
            }
            return true;
          } else {
            console.error(`❌ Invalid definition block: ${blockId}`, block.data);
            invalidBlocks.push(blockId);
            return false;
          }
        }
        
        // Handle worked_example blocks
        if (block.type === 'worked_example') {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn(`⚠️ Failed to parse worked_example data: ${blockId}`, e);
            }
          }
          
          if (typeof block.data === 'string') {
            console.warn('⚠️ Repairing stringified worked_example data');
            block.data = repairWorkedExampleString(block.data);
          }
          
          if (!block.data || !block.data.question || !block.data.steps) {
            console.error(`❌ Malformed worked_example: ${blockId}`, block.data);
            invalidBlocks.push(blockId);
            return false;
          }
          return true;
        }
        
        // Handle quote_analysis blocks
        if (block.type === 'quote_analysis') {
          if (block.data && typeof block.data === 'string') {
            try {
              block.data = JSON.parse(block.data);
            } catch (e) {
              console.warn(`⚠️ Failed to parse quote_analysis data: ${blockId}`, e);
            }
          }
          
          if (!block.data || !block.data.quote || !block.data.source) {
            console.error(`❌ Invalid quote_analysis block: ${blockId}`, block.data);
            invalidBlocks.push(blockId);
            return false;
          }
          return true;
        }
        
        // Handle other block types - try parsing if string
        if (block.data && typeof block.data === 'string') {
          try {
            block.data = JSON.parse(block.data);
          } catch (e) {
            console.warn(`⚠️ Failed to parse ${block.type} data: ${blockId}`, e);
          }
        }
        
        return true; // Keep other block types
      });
    });
    
    // Log summary of invalid blocks
    if (invalidBlocks.length > 0) {
      console.error(`❌ ${invalidBlocks.length} invalid blocks removed:`, invalidBlocks);
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
              model: 'google/gemini-2.5-pro',
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
          console.log('Retry response:', JSON.stringify(retryData).substring(0, 500));
          
          if (!retryData.choices || !Array.isArray(retryData.choices) || retryData.choices.length === 0) {
            throw new Error(`Retry failed: ${retryData.error?.message || 'No choices returned'}`);
          }
          
          const retryToolCall = retryData.choices[0]?.message?.tool_calls?.[0];
          
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

    // Validate Maths lesson structure
    const isMaths = subjectName?.toLowerCase().includes('math');
    if (isMaths && !isExamPractice) {
      console.log('🧮 Validating Maths lesson structure...');
      const steps = planData.steps;
      
      // Check we have exactly 4 steps
      if (steps.length !== 4) {
        console.warn(`⚠️ Maths lesson has ${steps.length} steps, expected 4`);
      } else {
        console.log('✓ Maths lesson has 4 steps');
      }
      
      // Validate step 1: 1 text block (explanation)
      const step1Blocks = steps[0]?.content_blocks || [];
      const hasExplanation = step1Blocks.some((b: any) => b.type === 'text');
      if (!hasExplanation) {
        console.warn('⚠️ Maths Step 1 missing explanation text block');
      } else {
        console.log('✓ Step 1 has explanation');
      }
      
      // Validate step 2: 2 worked examples
      const step2Blocks = steps[1]?.content_blocks || [];
      const workedExamples = step2Blocks.filter((b: any) => b.type === 'worked_example');
      if (workedExamples.length !== 2) {
        console.warn(`⚠️ Maths Step 2 has ${workedExamples.length} worked examples, expected 2`);
      } else {
        console.log('✓ Step 2 has 2 worked examples');
      }
      
      // Validate step 3: 2 guided questions
      const step3Blocks = steps[2]?.content_blocks || [];
      const guidedQuestions = step3Blocks.filter((b: any) => b.type === 'question');
      if (guidedQuestions.length !== 2) {
        console.warn(`⚠️ Maths Step 3 has ${guidedQuestions.length} guided questions, expected 2`);
      } else {
        console.log('✓ Step 3 has 2 guided questions');
      }
      
      // Validate step 4: 3-4 solo questions
      const step4Blocks = steps[3]?.content_blocks || [];
      const soloQuestions = step4Blocks.filter((b: any) => b.type === 'question');
      if (soloQuestions.length < 3 || soloQuestions.length > 4) {
        console.warn(`⚠️ Maths Step 4 has ${soloQuestions.length} solo questions, expected 3-4`);
      } else {
        console.log(`✓ Step 4 has ${soloQuestions.length} solo questions`);
      }
      
      console.log('🧮 Maths lesson structure validation complete');
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

    // Final validation: ensure all blocks have valid data structures
    console.log('Running final validation on content blocks...');
    const finalValidationErrors: string[] = [];
    
    planData.steps.forEach((step: any, stepIndex: number) => {
      if (!step.content_blocks || step.content_blocks.length === 0) {
        finalValidationErrors.push(`Step ${stepIndex + 1} (${step.id}) has no content blocks`);
        return;
      }
      
      step.content_blocks.forEach((block: any, blockIndex: number) => {
        const blockId = `Step ${stepIndex + 1}, Block ${blockIndex + 1} (${block.type})`;
        
        if (!block.type || !block.data) {
          finalValidationErrors.push(`${blockId}: Missing type or data`);
          return;
        }
        
        // Type-specific validation
        switch (block.type) {
          case 'text':
            if (typeof block.data !== 'string' || block.data.length === 0) {
              finalValidationErrors.push(`${blockId}: Invalid text data`);
            }
            break;
          case 'table':
            if (!block.data.headers || !block.data.rows) {
              finalValidationErrors.push(`${blockId}: Missing headers or rows`);
            }
            break;
          case 'question':
            if (!block.data.id || !block.data.question) {
              finalValidationErrors.push(`${blockId}: Missing id or question`);
            }
            break;
          case 'worked_example':
            if (!block.data.question || !block.data.steps) {
              finalValidationErrors.push(`${blockId}: Missing question or steps`);
            }
            break;
          case 'definition':
            if (!block.data.term || !block.data.definition) {
              finalValidationErrors.push(`${blockId}: Missing term or definition`);
            }
            break;
          case 'quote_analysis':
            if (!block.data.quote || !block.data.source) {
              finalValidationErrors.push(`${blockId}: Missing quote or source`);
            }
            break;
        }
      });
    });
    
    if (finalValidationErrors.length > 0) {
      console.error('❌ Lesson plan failed final validation:', finalValidationErrors);
      return new Response(
        JSON.stringify({ 
          error: 'Generated lesson plan contains invalid content blocks',
          details: finalValidationErrors
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✓ Final validation passed - all content blocks are valid');

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