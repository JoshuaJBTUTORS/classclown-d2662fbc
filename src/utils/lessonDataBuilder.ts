import { LessonData, LessonStep, ContentBlock } from '@/types/lessonContent';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  objectives?: string[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
}

interface Course {
  id: string;
  title: string;
  subject?: string;
}

/**
 * Converts a lesson from the module system into the LessonData format
 * required by CleoInteractiveLearning
 */
export function buildLessonDataFromLesson(
  lesson: Lesson,
  module: Module,
  course: Course
): LessonData {
  // Determine year group from course subject
  const yearGroup = course.subject?.includes('GCSE') 
    ? 'GCSE' 
    : course.subject?.includes('A-Level') 
    ? 'A-Level' 
    : course.subject || 'General';

  // Create steps based on lesson objectives or use default structure
  const steps: LessonStep[] = lesson.objectives && lesson.objectives.length > 0
    ? lesson.objectives.map((objective, index) => ({
        id: `step-${index}`,
        order: index + 1,
        title: objective,
        completed: false,
      }))
    : [
        { id: 'intro', order: 1, title: 'Introduction', completed: false },
        { id: 'main', order: 2, title: 'Main Content', completed: false },
        { id: 'practice', order: 3, title: 'Practice', completed: false },
        { id: 'summary', order: 4, title: 'Summary', completed: false },
      ];

  // Create initial content blocks
  const content: ContentBlock[] = [];

  // Add introduction text if we have a description
  if (lesson.description) {
    content.push({
      id: 'intro-text',
      stepId: steps[0].id,
      type: 'text',
      data: lesson.description,
      visible: false,
    });
  }

  // Add main content text if available
  if (lesson.content) {
    content.push({
      id: 'main-content',
      stepId: steps.length > 1 ? steps[1].id : steps[0].id,
      type: 'text',
      data: lesson.content,
      visible: false,
    });
  }

  // If no content is available, add a placeholder that Cleo can work with
  if (content.length === 0) {
    content.push({
      id: 'intro-text',
      stepId: steps[0].id,
      type: 'text',
      data: `Welcome to ${lesson.title}. Let's explore this topic together through conversation.`,
      visible: false,
    });
  }

  // Make first content block visible by default
  if (content.length > 0) {
    content[0].visible = true;
  }

  return {
    id: lesson.id,
    title: lesson.title,
    topic: module.title,
    yearGroup,
    steps,
    content,
  };
}
