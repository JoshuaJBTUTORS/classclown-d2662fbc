
export interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  hourly_rate?: number;
  status: string;
  subjects?: string[];
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
