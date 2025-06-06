
export interface YearGroup {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrialBooking {
  id: string;
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  year_group_id: string;
  subject_id: string;
  tutor_id?: string;
  preferred_date?: string;
  preferred_time?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  lesson_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data - simplified to match what we actually query
  year_group?: { id: string; display_name: string; };
  subject?: { id: string; name: string; };
  tutor?: { id: string; first_name: string; last_name: string; };
}

export interface TutorAvailabilitySlot {
  tutor_id: string;
  tutor_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  normal_hourly_rate: number;
}
