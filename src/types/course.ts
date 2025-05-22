
export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'archived';
  subject?: string;
  difficulty_level?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'pdf' | 'text' | 'quiz';
  content_url?: string;
  content_text?: string;
  position: number;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: string;
  student_id: number;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  completed_at?: string;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  explanation?: string;
  position: number;
  created_at: string;
  updated_at: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  student_id: number;
  lesson_id: string;
  score: number;
  total_questions: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
