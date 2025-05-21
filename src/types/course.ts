
export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'archived';
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
