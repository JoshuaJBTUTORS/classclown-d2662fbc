
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  tutor_id: string;
  start_time: string;
  end_time: string;
  is_group: boolean;
  status: string;
  subject?: string; // Add subject field
  is_recurring?: boolean;
  recurrence_interval?: string | null;
  recurrence_day?: string | null;
  recurrence_end_date?: string | null;
  // Enhanced video conference fields
  lesson_space_room_id?: string | null;
  lesson_space_room_url?: string | null;
  lesson_space_space_id?: string | null; // Add space ID field
  video_conference_provider?: 'lesson_space' | 'google_meet' | 'zoom' | 'agora' | 'external_agora' | null;
  video_conference_link?: string | null;
  // Additional Lesson Space fields
  lesson_space_session_id?: string | null;
  // Agora.io fields
  agora_channel_name?: string | null;
  agora_token?: string | null;
  agora_uid?: number | null;
  agora_rtm_token?: string | null;
  agora_whiteboard_token?: string | null;
  agora_recording_id?: string | null;
  agora_recording_status?: string | null;
  // Netless fields
  netless_room_uuid?: string | null;
  netless_room_token?: string | null;
  netless_app_identifier?: string | null;
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
