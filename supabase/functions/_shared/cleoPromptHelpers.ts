/**
 * Shared helper functions for Cleo lesson prompts
 * Used by both cleo-realtime-voice and cleo-realtime-session-token
 */

/**
 * Formats a single content block for display in the system prompt
 */
export function formatSingleBlock(block: any): string {
  const { id, type, data, title, teaching_notes } = block;
  let description = '';
  
  switch (type) {
    case 'text':
      const textPreview = (data?.content || '').substring(0, 100);
      description = `   • Text Block: "${textPreview}${textPreview.length >= 100 ? '...' : ''}"`;
      break;
      
    case 'definition':
      description = `   • Definition: "${data?.term || 'Unknown'}" - ${(data?.definition || '').substring(0, 60)}...`;
      if (data?.example) description += `\n      Example: ${data.example.substring(0, 60)}...`;
      break;
      
    case 'question':
      description = `   • Question: "${(data?.question || '').substring(0, 80)}..."`;
      if (data?.options) {
        description += `\n      Options: ${data.options.map((o: any) => o.text).slice(0, 2).join(', ')}...`;
      }
      break;
      
    case 'table':
      const headers = data?.headers || [];
      const rowCount = data?.rows?.length || 0;
      description = `   • Table: ${headers.join(', ')} (${rowCount} rows)`;
      break;
      
    case 'diagram':
      description = `   • Diagram: ${title || data?.title || 'Visual diagram'}`;
      break;
      
    case 'worked_example':
      description = `
   📐 WORKED EXAMPLE: ${title || 'Example'}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Question: "${data?.question || 'N/A'}"

   Steps to follow:
${data?.steps?.map((step: any, i: number) => `
     Step ${step.number}: ${step.title}
     Explanation: ${step.explanation}
     Work Shown: ${step.workShown}
`).join('') || '   No steps provided'}

   Final Answer: ${data?.finalAnswer || 'N/A'}

   Exam Context: ${data?.examContext || 'N/A'}
   Exam Tips: ${data?.examTips?.join('; ') || 'N/A'}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚠️ YOU MUST READ OUT THIS EXACT CONTENT - DO NOT MAKE UP YOUR OWN EXAMPLE`;
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
 * Fetches exam board context for a lesson by looking up via courses table
 */
export async function fetchExamBoardContext(
  supabase: any,
  lessonPlan: any,
  lessonId?: string,
  examBoards?: Record<string, string>,
  conversation?: any,
  educationLevel?: string
): Promise<{ contextString: string; specifications: string; examBoard: string; subjectName: string }> {
  let examBoardContext = '';
  let subjectName = '';
  let examBoard = '';
  let specifications = '';
  
  console.log('📚 fetchExamBoardContext START:', { 
    lessonPlanId: lessonPlan?.id,
    providedLessonId: lessonId,
    lessonPlanLessonId: lessonPlan?.lesson_id, 
    lessonPlanSubjectName: lessonPlan?.subject_name
  });
  
  // PRIORITY 1: Use provided lessonId (from CleoInteractiveLearning)
  const lookupLessonId = lessonId || lessonPlan?.lesson_id;
  
  // New simplified approach: Get exam board spec directly from course
  if (lookupLessonId) {
    console.log('📍 Looking up course and exam board spec from lesson_id:', lookupLessonId);
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
      .eq('id', lookupLessonId)
      .single();
    
    console.log('📍 Lesson data result:', lessonData);
    
    if (lessonData?.course_modules?.courses) {
      const course = lessonData.course_modules.courses;
      subjectName = course.subject;
      
      // If course has an exam board spec linked, use it directly
      if (course.exam_board_specifications) {
        const spec = course.exam_board_specifications;
        examBoard = spec.exam_board;
        specifications = spec.extracted_text || '';
        examBoardContext = ` for ${examBoard} ${subjectName}`;
        console.log('✅ Got exam board from course:', examBoard, 'Specs length:', specifications.length);
      } else {
        console.log('⚠️ No exam board spec linked to this course');
      }
    }
  } else if (lessonPlan?.subject_name) {
    // Fallback: Use subject_name from lesson plan if no lesson_id
    subjectName = lessonPlan.subject_name;
    console.log('✅ Using subject name from lesson plan (standalone):', subjectName);
    
    if (lessonPlan?.year_group) {
      examBoardContext = ` for ${lessonPlan.year_group}`;
    }
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
