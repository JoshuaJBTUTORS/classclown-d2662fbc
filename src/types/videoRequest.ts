export interface VideoRequest {
  id: string;
  calendar_entry_id: string;
  tutor_id: string;
  request_date: string;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  denial_reason?: string | null;
  release_form_accepted: boolean;
  release_form_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TutorActiveAssignment {
  id: string;
  tutor_id: string;
  calendar_entry_id: string;
  video_request_id: string;
  assigned_at: string;
  can_request_next: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReleaseSchedule {
  id: string;
  week_number: number;
  year: number;
  release_date: string;
  videos_released: number;
  total_videos: number;
  status: 'pending' | 'released' | 'incomplete';
  created_at: string;
}
