// Lesson Content Types for HeyCleo

export interface LessonData {
  topic: string;
  yearGroup: string;
  subject?: string;
  steps: LessonStep[];
  content: ContentBlock[];
}

export interface LessonStep {
  id: string;
  title: string;
  duration_minutes?: number;
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  stepId: string;
  data: any;
  isGenerating?: boolean;
}

export type ContentBlockType = 
  | 'text'
  | 'definition'
  | 'table'
  | 'diagram'
  | 'question'
  | 'worked_example'
  | 'quote_analysis';

export interface TextContent {
  content: string;
}

export interface DefinitionContent {
  term: string;
  definition: string;
  example?: string;
}

export interface TableContent {
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface DiagramContent {
  title: string;
  description: string;
  imageUrl?: string;
  prompt?: string;
}

export interface QuestionContent {
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation';
  options?: QuestionOption[];
  correctAnswer?: string;
  marks?: number;
  examBoard?: string;
  examDate?: string;
  assessmentObjective?: string;
  answerLines?: number;
  keywords?: string[];
  hint?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface WorkedExampleContent {
  title: string;
  problem: string;
  steps: WorkedExampleStep[];
}

export interface WorkedExampleStep {
  step: number;
  description: string;
  calculation?: string;
}

export interface QuoteAnalysisContent {
  quote: string;
  analysis: string;
  source?: string;
}

export interface ContentEvent {
  type: 'move_to_step' | 'show_content' | 'complete_step' | 'upsert_content' | 'lesson_complete';
  stepId?: string;
  contentId?: string;
  block?: ContentBlock;
  autoShow?: boolean;
  summary?: string;
}

export interface AIMarkingResult {
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
}
