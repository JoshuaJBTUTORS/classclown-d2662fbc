
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
  // Only Flexible Classroom fields remain
  flexible_classroom_room_id?: string | null;
  flexible_classroom_session_data?: any;
  // LessonSpace integration fields
  lesson_space_room_id?: string | null;
  lesson_space_room_url?: string | null;
  lesson_space_space_id?: string | null;
  // Trial lesson fields
  lesson_type?: 'regular' | 'trial' | 'makeup';
  trial_booking_id?: string | null;
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
  }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  is_recurring?: boolean;
  subject?: string;
  tutor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  students?: {
    id: number;
    first_name: string;
    last_name: string;
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
