import { supabase } from '@/integrations/supabase/client';

export interface AssessmentSummary {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  exam_board?: string;
  year?: number;
  paper_type?: string;
  total_marks: number;
  time_limit_minutes?: number;
  status: string;
}

export interface AssessmentAssignment {
  id: string;
  assessment_id: string;
  assigned_to: string;
  assigned_by: string;
  due_date?: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'reviewed';
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  assessment?: AssessmentSummary;
  assigned_to_profile?: { first_name: string; last_name: string; };
  assigned_by_profile?: { first_name: string; last_name: string; };
}

export const assessmentAssignmentService = {
  // Assign assessment to students
  async assignAssessment(
    assessmentId: string,
    studentIds: string[],
    dueDate?: string,
    notes?: string
  ): Promise<AssessmentAssignment[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const assignments = studentIds.map(studentId => ({
      assessment_id: assessmentId,
      assigned_to: studentId,
      assigned_by: user.user!.id,
      due_date: dueDate,
      notes,
      status: 'assigned' as const,
    }));

    const { data, error } = await supabase
      .from('assessment_assignments')
      .insert(assignments)
      .select();

    if (error) throw error;
    return data as AssessmentAssignment[];
  },

  // Get all assignments for a student
  async getStudentAssignments(userId?: string): Promise<AssessmentAssignment[]> {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');
      targetUserId = user.user.id;
    }

    const { data, error } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        ai_assessments (
          id, title, description, subject, exam_board, year, 
          paper_type, total_marks, time_limit_minutes, status
        )
      `)
      .eq('assigned_to', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(row => ({
      ...row,
      assessment: row.ai_assessments as AssessmentSummary,
    })) as AssessmentAssignment[];
  },

  // Get assignment by ID
  async getAssignmentById(assignmentId: string): Promise<AssessmentAssignment | null> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        ai_assessments (
          id, title, description, subject, exam_board, year, 
          paper_type, total_marks, time_limit_minutes, status
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return {
      ...data,
      assessment: data.ai_assessments as AssessmentSummary,
    } as AssessmentAssignment;
  },

  // Start an assignment (mark as in_progress)
  async startAssignment(assignmentId: string): Promise<AssessmentAssignment> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .update({ status: 'in_progress' })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data as AssessmentAssignment;
  },

  // Submit an assignment
  async submitAssignment(assignmentId: string): Promise<AssessmentAssignment> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .update({ 
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data as AssessmentAssignment;
  },

  // Get all pending submissions (for admin)
  async getAllPendingSubmissions(): Promise<AssessmentAssignment[]> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        ai_assessments (
          id, title, description, subject, exam_board, year, 
          paper_type, total_marks, time_limit_minutes, status
        )
      `)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(row => ({
      ...row,
      assessment: row.ai_assessments as AssessmentSummary,
    })) as AssessmentAssignment[];
  },

  // Get all assignments (for admin)
  async getAllAssignments(): Promise<AssessmentAssignment[]> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .select(`
        *,
        ai_assessments (
          id, title, description, subject, exam_board, year, 
          paper_type, total_marks, time_limit_minutes, status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(row => ({
      ...row,
      assessment: row.ai_assessments as AssessmentSummary,
    })) as AssessmentAssignment[];
  },

  // Mark assignment as reviewed
  async markAsReviewed(assignmentId: string): Promise<AssessmentAssignment> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('assessment_assignments')
      .update({ 
        status: 'reviewed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.user.id,
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data as AssessmentAssignment;
  },

  // Delete assignment
  async deleteAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;
  },

  // Get assignments for a specific assessment
  async getAssignmentsForAssessment(assessmentId: string): Promise<AssessmentAssignment[]> {
    const { data, error } = await supabase
      .from('assessment_assignments')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as AssessmentAssignment[];
  },
};
