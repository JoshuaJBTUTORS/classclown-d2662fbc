
export interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  hourly_rate?: number;
  normal_hourly_rate?: number;
  absence_hourly_rate?: number;
  status: string;
  subjects?: string[];
  specialities?: string[];
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
  title?: string | null;
  name?: string;
  rating?: number | null;
  joined_date?: string;
  education?: string | null;
  availability?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  tutor_id?: string;
}
