
export interface CourseNote {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseNoteRequest {
  course_id: string;
  lesson_id?: string;
  title: string;
  content?: string;
}

export interface UpdateCourseNoteRequest {
  title: string;
  content?: string;
}
