
export interface Parent {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  billing_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParentWithStudents extends Parent {
  students: Array<{
    id: number | string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    grade?: string;
    notes?: string;
    status: 'active' | 'inactive' | string;
    created_at?: string;
    updated_at?: string;
    subjects?: string | string[];
    student_id?: string;
    name?: string;
    joinedDate?: string;
    parent_id: string;
    user_id?: string;
  }>;
}
