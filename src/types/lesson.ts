
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_day?: string | null;
  recurrence_end_date?: string | null;
  // Enhanced video conference fields
  lesson_space_room_id?: string | null;
  lesson_space_room_url?: string | null;
  video_conference_provider?: string | null;
  video_conference_link?: string | null;
  // Additional Lesson Space fields
  lesson_space_space_id?: string | null;
  lesson_space_session_id?: string | null;
  tutor?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  students?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    attendance_status?: string;
    feedback?: string;
    lesson_space_url?: string; // Individual student URL for Lesson Space
  }[];
  completed?: boolean;
  completion_date?: string | null;
  homework?: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    attachment_url?: string | null;
    attachment_type?: string | null;
  };
  homework_assigned?: boolean;
  color?: string;
  is_recurring_instance?: boolean;
  parent?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  lesson_students?: {
    student: {
      id: number;
      first_name: string;
      last_name: string;
      parent_first_name?: string;
      parent_last_name?: string;
      email?: string;
    };
    lesson_space_url?: string;
  }[];
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: number;
  submission_text: string | null;
  attachment_url: string | null;
  status: string;
  grade: string | null;
  feedback: string | null;
  submitted_at: string;
}
