
import { LessonSubject } from '@/constants/subjects';

export interface Course {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'archived';
  subject?: LessonSubject;
  difficulty_level?: string;
  price?: number; // Price in pence (e.g., 1299 for £12.99)
  stripe_price_id?: string; // Stripe Price ID for subscriptions
  created_at: string;
  updated_at: string;
}

// Form interface for creating/editing courses - allows empty strings for form handling
export interface CourseFormData {
  title: string;
  description: string;
  subject: string; // Allows empty string for form placeholder
  difficulty_level?: string;
  cover_image_url: string;
  stripe_price_id?: string; // Add Stripe Price ID to form
  status?: 'draft' | 'published' | 'archived';
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
  content_type: 'video' | 'pdf' | 'text' | 'quiz' | 'ai-assessment';
  content_url?: string;
  content_text?: string;
  position: number;
  duration_minutes?: number;
  is_preview?: boolean; // New field to mark preview lessons
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

export interface CoursePurchase {
  id: string;
  user_id: string;
  course_id: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  amount_paid: number;
  currency: string;
  purchase_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}
