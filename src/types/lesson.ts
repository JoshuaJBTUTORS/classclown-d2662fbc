
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: string;
  subject?: string;
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_day?: string | null;
  recurrence_end_date?: string | null;
  // Enhanced video conference fields
  lesson_space_room_id?: string | null;
  lesson_space_room_url?: string | null;
  lesson_space_space_id?: string | null;
  video_conference_provider?: string | null;
  video_conference_link?: string | null;
  // Additional Lesson Space fields
  lesson_space_session_id?: string | null;
  // New attendance tracking fields
  attendance_completed?: boolean;
  homework_assigned?: boolean;
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
    lesson_space_url?: string;
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

// New interface for lesson attendance
export interface LessonAttendance {
  id: string;
  lesson_id: string;
  student_id: number;
  attendance_status: 'attended' | 'absent' | 'late';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
  };
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
