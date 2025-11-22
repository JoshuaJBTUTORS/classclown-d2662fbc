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

export interface WorkedExampleStep {
  step_number: number;
  explanation: string;
  calculation?: string;
  visual_note?: string;
}

export interface WorkedExampleContent {
  problem: string;
  steps: WorkedExampleStep[];
  key_technique: string;
}

export interface WritingBoxContent {
  prompt: string;
  guidance: string;
  sentenceStarters?: string[];
  wordTarget?: number;
  marks?: number;
}

export interface CodeExampleContent {
  language: 'pseudocode' | 'python' | 'javascript';
  code: string;
  explanation: string;
  lineHighlights?: number[];
}

export interface ContentBlock {
  id: string;
  stepId: string;
  type: 'text' | 'table' | 'definition' | 'question' | 'diagram' | 'worked_example' | 'writing_box' | 'code_example';
  data: TableContent | QuestionContent | DefinitionContent | WorkedExampleContent | WritingBoxContent | CodeExampleContent | string | any;
  visible: boolean;
  title?: string;
  teachingNotes?: string;
  prerequisites?: string[];
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
  type: 'show_content' | 'next_step' | 'complete_step' | 'ask_question' | 'upsert_content' | 'move_to_step' | 'lesson_complete';
  contentId?: string;
  stepId?: string;
  questionId?: string;
  block?: ContentBlock;
  autoShow?: boolean;
  summary?: string;
}

export interface ExamQuestion {
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation';
  marks: number;
  marking_scheme: string;
  correct_answer: string;
  keywords: string[];
}

export interface ExamGenerationResponse {
  success: boolean;
  pdfData?: string;
  questionsGenerated?: number;
  totalMarks?: number;
  error?: string;
}
