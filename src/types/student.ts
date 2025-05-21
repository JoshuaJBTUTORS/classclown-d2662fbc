
export interface Student {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  grade?: string;
  notes?: string;
  status: 'active' | 'inactive' | string;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
  parent_first_name?: string;
  parent_last_name?: string;
  subjects?: string | string[];
  student_id?: string;
  name?: string;
  joinedDate?: string;
}
