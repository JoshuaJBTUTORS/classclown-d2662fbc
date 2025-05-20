
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
  };
  homework_assigned?: boolean;
  color?: string; // Added color property to fix TypeScript error
  is_recurring_instance?: boolean; // Added is_recurring_instance property to fix TypeScript error
}
