export interface TopicInput {
  topic_name: string;
  description?: string;
  difficulty?: string;
  marks_per_question?: number;
}

export interface CurriculumInput {
  subject: string;
  exam_board: string;
  year: number;
  topics: TopicInput[];
}

export interface GenerationSettings {
  questions_per_topic: number;
  question_types?: string[];
  time_per_question?: number;
}

export interface BulkCreationResult {
  success: boolean;
  results?: {
    total: number;
    successful: number;
    failed: number;
    assessments: Array<{
      id: string;
      title: string;
      questions_count: number;
      total_marks: number;
    }>;
    errors: Array<{
      topic: string;
      error: string;
    }>;
  };
  error?: string;
  rid?: string;
}

export interface BulkProgressUpdate {
  current: number;
  total: number;
  currentTopic: string;
  successful: number;
  failed: number;
}
