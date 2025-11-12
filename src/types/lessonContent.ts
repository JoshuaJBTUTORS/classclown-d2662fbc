export interface LessonStep {
  id: string;
  order: number;
  title: string;
  completed: boolean;
}

export interface TableContent {
  headers: string[];
  rows: string[][];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionContent {
  id: string;
  question: string;
  options: QuestionOption[];
  explanation?: string;
}

export interface DefinitionContent {
  term: string;
  definition: string;
  example?: string;
}

export interface ContentBlock {
  id: string;
  stepId: string;
  type: 'text' | 'table' | 'definition' | 'question' | 'diagram';
  data: TableContent | QuestionContent | DefinitionContent | string | any;
  visible: boolean;
  title?: string;
  teachingNotes?: string;
  prerequisites?: string[];
  deliveryGuidance?: string;
}

export interface LessonData {
  id: string;
  title: string;
  topic: string;
  yearGroup: string;
  steps: LessonStep[];
  content: ContentBlock[];
}

export interface ContentEvent {
  type: 'show_content' | 'next_step' | 'complete_step' | 'ask_question' | 'upsert_content' | 'move_to_step';
  contentId?: string;
  stepId?: string;
  questionId?: string;
  block?: ContentBlock;
  autoShow?: boolean;
}
