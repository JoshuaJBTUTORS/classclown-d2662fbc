/**
 * Shared helper functions for Cleo lesson prompts
 * Used by both cleo-realtime-voice and cleo-realtime-session-token
 */

/**
 * Converts LaTeX notation to natural spoken English
 */
export function convertLatexToSpeech(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Remove delimiters first
  result = result.replace(/\$\$/g, '');
  result = result.replace(/\$/g, '');
  result = result.replace(/\\\[/g, '');
  result = result.replace(/\\\]/g, '');
  result = result.replace(/\\\(/g, '');
  result = result.replace(/\\\)/g, '');
  
  // Remove \left and \right
  result = result.replace(/\\left/g, '');
  result = result.replace(/\\right/g, '');
  
  // Fractions: \frac{a}{b} or \dfrac{a}{b} → "a over b"
  result = result.replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2');
  
  // Powers: x^2 → "x squared", x^3 → "x cubed", x^{n} → "x to the power of n"
  result = result.replace(/\^2(?![0-9])/g, ' squared');
  result = result.replace(/\^3(?![0-9])/g, ' cubed');
  result = result.replace(/\^\{([^}]+)\}/g, ' to the power of $1');
  result = result.replace(/\^([0-9]+)/g, ' to the power of $1');
  
  // Roots: \sqrt{x} → "square root of x", \sqrt[3]{x} → "cube root of x"
  result = result.replace(/\\sqrt\[3\]\{([^}]+)\}/g, 'cube root of $1');
  result = result.replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1');
  
  // Operations
  result = result.replace(/\\times/g, ' times ');
  result = result.replace(/\\div/g, ' divided by ');
  result = result.replace(/\\pm/g, ' plus or minus ');
  result = result.replace(/\\cdot/g, ' times ');
  
  // Percentages: 25\% → "25 percent"
  result = result.replace(/\\%/g, ' percent');
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Formats a single content block for display in the system prompt
 */
export function formatSingleBlock(block: any): string {
  const { id, type, data, title, teaching_notes } = block;
  let description = '';
  
  switch (type) {
    case 'text':
      const textContent = convertLatexToSpeech(data?.content || '');
      // Include full content for AI, not just preview
      description = `   • Text Block: "${textContent}"`;
      break;
      
    case 'definition':
      description = `   • Definition: ${convertLatexToSpeech(data?.term || 'Key Term')}`;
      description += `\n      Meaning: ${convertLatexToSpeech(data?.definition || '')}`;
      if (data?.example) description += `\n      Example: ${convertLatexToSpeech(data.example)}`;
      break;
      
    case 'question':
      const questionText = convertLatexToSpeech(data?.question || '');
      description = `   • Question: "${questionText.substring(0, 80)}..."`;
      if (data?.options) {
        const convertedOptions = data.options.map((o: any) => convertLatexToSpeech(o.text));
        description += `\n      Options: ${convertedOptions.slice(0, 2).join(', ')}...`;
      }
      break;
      
    case 'table':
      description = `   • Table: ${title || 'Data Table'}`;
      if (data?.headers) {
        const convertedHeaders = data.headers.map((h: string) => convertLatexToSpeech(h));
        description += `\n      Columns: ${convertedHeaders.join(', ')}`;
      }
      if (data?.rows && Array.isArray(data.rows)) {
        description += `\n      Rows: ${data.rows.length}`;
        data.rows.forEach((row: any[], idx: number) => {
          const convertedRow = row.map((cell: any) => convertLatexToSpeech(String(cell)));
          description += `\n         Row ${idx + 1}: ${convertedRow.join(' | ')}`;
        });
      }
      break;
      
    case 'diagram':
      description = `   • Diagram: ${title || data?.title || 'Visual diagram'}`;
      break;
      
    case 'worked_example':
      description = `   • Worked Example: ${title || 'Step-by-step solution'}`;
      if (data?.question) {
        description += `\n      Problem: ${convertLatexToSpeech(data.question)}`;
      }
      if (data?.steps && Array.isArray(data.steps)) {
        description += `\n      Steps:`;
        data.steps.forEach((step: string, idx: number) => {
          description += `\n         ${idx + 1}. ${convertLatexToSpeech(step)}`;
        });
      }
      if (data?.answer) {
        description += `\n      ✅ Answer: ${convertLatexToSpeech(data.answer)}`;
      }
      break;
      
    default:
      description = `   • ${type}: ${title || id}`;
  }
  
  if (title && type !== 'diagram') {
    description = `   • ${title} (${type})\n      ${description.substring(5)}`;
  }
  
  if (teaching_notes) {
    description += `\n      💡 Teaching Note: ${teaching_notes}`;
  }
  
  description += `\n      [ID: ${id}]\n`;
  
  return description;
}

/**
 * Formats all content blocks from a lesson plan for the system prompt
 */
export function formatContentBlocksForPrompt(lessonPlan: any): string {
  if (!lessonPlan?.teaching_sequence) return '';
  
  let contentLibrary = '\n\nPRE-GENERATED CONTENT AVAILABLE:\n';
  contentLibrary += 'When you call move_to_step, the following content will be displayed automatically:\n\n';
  
  lessonPlan.teaching_sequence.forEach((step: any) => {
    if (!step.content_blocks || step.content_blocks.length === 0) return;
    
    contentLibrary += `\n📚 ${step.title} [ID: ${step.id}]:\n`;
    
    step.content_blocks.forEach((block: any) => {
      contentLibrary += formatSingleBlock(block);
    });
  });
  
  return contentLibrary;
}

/**
 * Fetches exam board specifications from database
 */
async function fetchExamBoardSpecifications(
  supabase: any,
  examBoard: string,
  subjectName: string
): Promise<string> {
  try {
    // Query the exam_board_specifications table with subject join
    const { data, error } = await supabase
      .from('exam_board_specifications')
      .select(`
        extracted_text,
        subjects!inner(name)
      `)
      .eq('exam_board', examBoard)
      .eq('subjects.name', subjectName)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.log(`No exam board specification found for ${examBoard} ${subjectName}`);
      return '';
    }
    
    return data.extracted_text || '';
  } catch (error) {
    console.error('Error fetching exam board specification:', error);
    return '';
  }
}

/**
 * Fetches exam board context for a lesson
 */
export async function fetchExamBoardContext(
  supabase: any,
  lessonPlan: any,
  examBoards: Record<string, string>,
  conversation: any,
  educationLevel?: string
): Promise<{ contextString: string; specifications: string; examBoard: string; subjectName: string }> {
  let examBoardContext = '';
  let subjectName = '';
  let examBoard = '';
  
  console.log('📚 fetchExamBoardContext START:', { 
    lessonPlanId: lessonPlan?.id,
    lessonId: lessonPlan?.lesson_id, 
    lessonPlanSubjectName: lessonPlan?.subject_name,
    examBoardsKeys: Object.keys(examBoards || {}),
    examBoards: examBoards,
    educationLevel 
  });
  
  // Step 1: Get course title (e.g., "GCSE Maths") from course_lessons
  if (lessonPlan?.lesson_id) {
    console.log('📍 Step 1: Looking up course title from lesson_id:', lessonPlan.lesson_id);
    const { data: lessonData } = await supabase
      .from('course_lessons')
      .select(`
        id,
        module_id,
        course_modules!inner(
          course_id,
          courses!inner(title)
        )
      `)
      .eq('id', lessonPlan.lesson_id)
      .single();
    
    console.log('📍 Lesson data result:', lessonData);
    
    if (lessonData?.course_modules?.courses?.title) {
      subjectName = lessonData.course_modules.courses.title;
      console.log('✅ Got course title:', subjectName);
    }
  } else if (lessonPlan?.subject_name) {
    // Fallback: Use subject_name from lesson plan if no lesson_id
    subjectName = lessonPlan.subject_name;
    console.log('✅ Using subject name from lesson plan:', subjectName);
  }

  // Step 2: Look up exam board (subjectName now contains full course title)
  console.log('📍 Step 2: Looking up exam board from lesson plan:', lessonPlan?.exam_board);
  
  // Get exam board directly from lesson plan
  if (lessonPlan?.exam_board) {
    examBoard = lessonPlan.exam_board;
    examBoardContext = ` for ${examBoard} ${subjectName}`;
    console.log('✅ Found exam board:', examBoard, 'Context:', examBoardContext);
  } else if (lessonPlan?.year_group) {
    examBoardContext = ` for ${lessonPlan.year_group}`;
    console.log('⚠️ No exam board found, using year_group fallback:', examBoardContext);
  }

  // Step 3: Fetch detailed specifications if exam board and course title are available
  let specifications = '';
  console.log('📍 Step 3: Fetching specifications. examBoard:', examBoard, 'courseTitle:', subjectName);
  if (examBoard && subjectName) {
    specifications = await fetchExamBoardSpecifications(supabase, examBoard, subjectName);
    console.log('📄 Specifications fetched, length:', specifications?.length || 0);
  }

  console.log('✅ fetchExamBoardContext RETURN:', {
    contextString: examBoardContext,
    examBoard,
    subjectName,
    hasSpecifications: !!specifications,
    specificationsLength: specifications?.length || 0
  });

  return {
    contextString: examBoardContext,
    specifications: specifications,
    examBoard: examBoard,
    subjectName: subjectName
  };
}
