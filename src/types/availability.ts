
export interface TutorAvailability {
  id?: string;
  tutor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string | null;
}

export interface TimeOffRequest {
  id?: string;
  tutor_id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status: TimeOffStatus;
  created_at?: string;
  updated_at?: string;
  organization_id?: string | null;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

export const weekDays: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const displayWeekDays: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};
