export type ContentStatus = 'planned' | 'assigned' | 'uploaded' | 'approved' | 'rejected' | 'downloaded' | 'archived';
export type VideoFormat = 'tiktok_reel' | 'youtube_short' | 'instagram_reel';
export type VideoType = 'educational' | 'motivational';
export type Subject = 'Maths' | 'English' | 'Science';

export interface ContentCalendar {
  id: string;
  month: number;
  week_number?: number | null;
  video_number?: number | null;
  subject?: Subject | string | null;
  title: string;
  hook?: string;
  summary?: string;
  talking_points?: string[];
  lighting_requirements?: string;
  audio_requirements?: string;
  quality_requirements?: string;
  video_format?: VideoFormat;
  max_duration_seconds?: number;
  status: ContentStatus;
  video_type?: VideoType;
  is_open_assignment?: boolean;
  assigned_tutor_id?: string | null;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  submission_deadline?: string | null;
  resubmission_deadline?: string | null;
  is_available_for_claim?: boolean;
  current_request_id?: string | null;
  release_schedule_id?: string | null;
}

export interface ContentVideo {
  id: string;
  calendar_entry_id: string;
  tutor_id: string;
  video_url: string;
  thumbnail_url?: string;
  file_size_mb?: number;
  duration_seconds?: number;
  title: string;
  description?: string;
  upload_date?: string;
  status: ContentStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  download_count: number;
  last_downloaded_at?: string;
  downloaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContentTutor {
  id: string;
  tutor_id: string;
  subjects: Subject[];
  is_active: boolean;
  joined_date?: string;
  total_videos_contributed: number;
  total_approved: number;
  total_rejected: number;
  average_approval_time_hours?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VideoReplacementSuggestion {
  id: string;
  calendar_entry_id: string;
  tutor_id: string;
  original_topic: string;
  suggested_topic: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at?: string;
  updated_at?: string;
}
