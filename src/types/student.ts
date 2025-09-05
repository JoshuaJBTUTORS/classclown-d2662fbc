
export interface Student {
  id: number | string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  grade?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'trial' | string;
  created_at?: string | null;
  updated_at?: string;
  subjects?: string | string[];
  student_id?: string;
  name?: string;
  joinedDate?: string;
  parent_id: string | null; // Can be null for standalone students
  user_id?: string; // Optional - for students with login accounts
  // Add computed fields for display purposes
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}
