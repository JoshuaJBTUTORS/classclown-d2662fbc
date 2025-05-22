
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TutorAvailability {
  id: string;
  tutor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeOffStatus {
  status: 'pending' | 'approved' | 'rejected';
}

export interface TimeOffRequest {
  id: string;
  tutor_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
