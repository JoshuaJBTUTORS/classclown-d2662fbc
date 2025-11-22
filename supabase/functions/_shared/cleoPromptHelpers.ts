/**
 * Shared helper functions for Cleo lesson prompts
 * Used by both cleo-realtime-voice and cleo-realtime-session-token
 */

/**
 * Formats a single content block for display in the system prompt
 */
export function formatSingleBlock(block: any): string {
  const { id, type, title, teaching_notes } = block;
  
  // Concise metadata-only format to keep prompt size minimal
  let description = `   • ${type.toUpperCase()}`;
  if (title) description += `: "${title}"`;
  description += ` [ID: ${id}]`;
  
  if (teaching_notes) {
    description += `\n      💡 ${teaching_notes}`;
  }
  
  description += '\n';
  return description;
}

/**
 * Formats all content blocks from a lesson plan for the system prompt
 */
export function formatContentBlocksForPrompt(lessonPlan: any): string {
  if (!lessonPlan?.teaching_sequence) return '';
  
  let contentLibrary = '\n\n📚 CONTENT BLOCKS (displayed when you call move_to_step):\n';
  
  lessonPlan.teaching_sequence.forEach((step: any) => {
    if (!step.content_blocks || step.content_blocks.length === 0) return;
    
    contentLibrary += `\n${step.title} [${step.id}] — ${step.content_blocks.length} blocks:\n`;
    step.content_blocks.forEach((block: any) => {
      contentLibrary += formatSingleBlock(block);
    });
  });
  
  contentLibrary += `\n💡 TEACHING APPROACH:\n`;
  contentLibrary += `- Content blocks are shown automatically when you move to each step\n`;
  contentLibrary += `- Reference what's displayed, don't duplicate content in your speech\n`;
  contentLibrary += `- Use teaching notes (💡) to guide your explanations\n`;
  contentLibrary += `- For worked examples & questions: walk through what's shown on screen\n`;
  
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
