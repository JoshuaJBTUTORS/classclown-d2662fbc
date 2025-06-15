
export interface RevisionSchedule {
  id: string;
  user_id: string;
  name: string;
  weekly_hours: number;
  selected_days: string[];
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RevisionSession {
  id: string;
  schedule_id: string;
  course_id: string;
  subject: string;
  session_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled';
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RevisionProgress {
  id: string;
  session_id: string;
  user_id: string;
  topics_covered: string[];
  confidence_level?: number;
  notes?: string;
  time_spent_minutes?: number;
  created_at: string;
}

export interface RevisionSetupData {
  selectedDays: string[];
  weeklyHours: number;
  selectedSubjects: string[];
  startDate: Date;
  endDate?: Date;
  name: string;
}
