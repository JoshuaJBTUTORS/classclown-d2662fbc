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
 * Fetches exam board specifications from storage
 */
async function fetchExamBoardSpecifications(
  supabase: any,
  examBoard: string,
  subjectName: string
): Promise<string> {
  try {
    // Normalize subject name for file path (e.g., "English Language" -> "English-Language")
    const normalizedSubject = subjectName.replace(/\s+/g, '-');
    const filePath = `${examBoard}/${normalizedSubject}.txt`;
    
    // Fetch the specification file from storage
    const { data, error } = await supabase
      .storage
      .from('exam-board-specifications')
      .download(filePath);
    
    if (error || !data) {
      console.log(`No exam board specification found for ${examBoard} ${subjectName}`);
      return '';
    }
    
    // Convert blob to text
    const text = await data.text();
    return text;
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
): Promise<{ contextString: string; specifications: string }> {
  let examBoardContext = '';
  let subjectName = '';
  let examBoard = '';
  
  if (lessonPlan?.lesson_id) {
    const { data: lessonData } = await supabase
      .from('course_lessons')
      .select(`
        id,
        module_id,
        course_modules!inner(
          course_id,
          courses!inner(subject)
        )
      `)
      .eq('id', lessonPlan.lesson_id)
      .single();
    
    if (lessonData?.course_modules?.courses?.subject) {
      subjectName = lessonData.course_modules.courses.subject;
    }
  }

  // Look up exam board
  if (subjectName && examBoards[subjectName.toLowerCase()]) {
    examBoard = examBoards[subjectName.toLowerCase()];
    examBoardContext = ` for ${examBoard} ${subjectName}`;
  } else if (lessonPlan?.year_group) {
    examBoardContext = ` for ${lessonPlan.year_group}`;
  }

  // Fetch detailed specifications if exam board and subject are available
  let specifications = '';
  if (examBoard && subjectName) {
    specifications = await fetchExamBoardSpecifications(supabase, examBoard, subjectName);
  }

  return {
    contextString: examBoardContext,
    specifications: specifications
  };
}
