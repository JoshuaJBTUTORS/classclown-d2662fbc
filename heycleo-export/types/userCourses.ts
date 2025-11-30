export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  is_auto_generated: boolean;
  source: 'onboarding' | 'manual' | 'recommendation';
  last_accessed_at?: string;
  progress_percentage: number;
  created_at: string;
}

export interface CourseEnrollment {
  courseId: string;
  wasCreated: boolean;
  course: any;
}
