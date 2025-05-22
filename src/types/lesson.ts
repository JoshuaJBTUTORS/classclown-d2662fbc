
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
  tutor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  students?: {
    id: number;
    first_name: string;
    last_name: string;
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
    };
  }[];
  // New property to cache recurring instances to improve performance
  cached_recurring_instances?: CalendarEvent[];
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

// New interface to improve type safety in the calendar component
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    description?: string;
    status: string;
    tutor?: any;
    students?: any[];
    isRecurring?: boolean;
    isRecurringInstance?: boolean;
    sourceId?: string; // Original lesson ID for recurring instances
  };
}
