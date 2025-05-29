
import { supabase } from '@/integrations/supabase/client';

export interface AIAssessment {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  exam_board?: string;
  year?: number;
  paper_type?: string;
  total_marks: number;
  time_limit_minutes?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation';
  marks_available: number;
  correct_answer: string;
  marking_scheme: any;
  keywords: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentSession {
  id: string;
  assessment_id: string;
  student_id?: number;
  user_id: string;
  started_at: string;
  completed_at?: string;
  total_marks_achieved: number;
  total_marks_available: number;
  time_taken_minutes?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface StudentResponse {
  id: string;
  session_id: string;
  question_id: string;
  student_answer?: string;
  marks_awarded: number;
  ai_feedback?: string;
  marking_breakdown: any;
  confidence_score?: number;
  submitted_at: string;
  marked_at?: string;
}

export const aiAssessmentService = {
  // Expose Supabase client for direct operations
  supabase,
  
  // Get published assessments
  async getPublishedAssessments(): Promise<AIAssessment[]> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'draft' | 'published' | 'archived'
    }));
  },

  // Get all assessments (for admin use)
  async getAllAssessments(): Promise<AIAssessment[]> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'draft' | 'published' | 'archived'
    }));
  },

  // Get assessment by ID
  async getAssessmentById(id: string): Promise<AIAssessment | null> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return {
      ...data,
      status: data.status as 'draft' | 'published' | 'archived'
    };
  },

  // Get questions for an assessment
  async getAssessmentQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('position');

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      question_type: item.question_type as 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation',
      keywords: Array.isArray(item.keywords) ? item.keywords.map(k => String(k)) : []
    }));
  },

  // Create a new assessment
  async createAssessment(assessment: Partial<AIAssessment>): Promise<AIAssessment> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'draft' | 'published' | 'archived'
    };
  },

  // Update assessment
  async updateAssessment(id: string, updates: Partial<AIAssessment>): Promise<AIAssessment> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'draft' | 'published' | 'archived'
    };
  },

  // Delete assessment
  async deleteAssessment(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_assessments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Create a new assessment question
  async createQuestion(question: Partial<AssessmentQuestion>): Promise<AssessmentQuestion> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .insert(question)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      question_type: data.question_type as 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation',
      keywords: Array.isArray(data.keywords) ? data.keywords.map(k => String(k)) : []
    };
  },

  // Update a question
  async updateQuestion(id: string, updates: Partial<AssessmentQuestion>): Promise<AssessmentQuestion> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      question_type: data.question_type as 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation',
      keywords: Array.isArray(data.keywords) ? data.keywords.map(k => String(k)) : []
    };
  },

  // Delete a question
  async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Create a new assessment session
  async createAssessmentSession(assessmentId: string, studentId?: number): Promise<AssessmentSession> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        user_id: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'in_progress' | 'completed' | 'abandoned'
    };
  },

  // Get user's session for an assessment
  async getUserSession(assessmentId: string): Promise<AssessmentSession | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? {
      ...data,
      status: data.status as 'in_progress' | 'completed' | 'abandoned'
    } : null;
  },

  // Submit answer for a question
  async submitAnswer(sessionId: string, questionId: string, answer: string): Promise<void> {
    const { error } = await supabase
      .from('student_responses')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        student_answer: answer,
      });

    if (error) throw error;
  },

  // Get responses for a session
  async getSessionResponses(sessionId: string): Promise<StudentResponse[]> {
    const { data, error } = await supabase
      .from('student_responses')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  },

  // Complete assessment session
  async completeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Mark answers using AI
  async markAnswers(sessionId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('ai-mark-assessment', {
      body: { sessionId }
    });

    if (error) throw error;
    return data;
  }
};
