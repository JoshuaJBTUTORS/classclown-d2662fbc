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
  questions_pdf_url?: string;
  answers_pdf_url?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_extraction_data?: any;
  ai_confidence_score?: number;
  processing_error?: string;
  is_ai_generated?: boolean;
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
  image_url?: string;
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
  attempt_number?: number;
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

export interface AssessmentScore {
  total_marks_achieved: number;
  total_marks_available: number;
  percentage_score: number;
  questions_answered: number;
  total_questions: number;
}

export interface UserAssessmentStats {
  best_score: number;
  total_possible: number;
  percentage_score: number;
  completed_sessions: number;
  last_attempt_date: string;
}

// Helper function to convert database row to AIAssessment
const mapToAIAssessment = (row: any): AIAssessment => ({
  id: row.id,
  title: row.title,
  description: row.description,
  subject: row.subject,
  exam_board: row.exam_board,
  year: row.year,
  paper_type: row.paper_type,
  total_marks: row.total_marks,
  time_limit_minutes: row.time_limit_minutes,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  status: row.status as 'draft' | 'published' | 'archived',
  questions_pdf_url: row.questions_pdf_url,
  answers_pdf_url: row.answers_pdf_url,
  processing_status: row.processing_status as 'pending' | 'processing' | 'completed' | 'failed',
  ai_extraction_data: row.ai_extraction_data,
  ai_confidence_score: row.ai_confidence_score,
  processing_error: row.processing_error,
  is_ai_generated: row.is_ai_generated,
});

// Helper function to convert database row to AssessmentQuestion
const mapToAssessmentQuestion = (row: any): AssessmentQuestion => ({
  id: row.id,
  assessment_id: row.assessment_id,
  question_number: row.question_number,
  question_text: row.question_text,
  question_type: row.question_type as 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation',
  marks_available: row.marks_available,
  correct_answer: row.correct_answer,
  marking_scheme: row.marking_scheme,
  keywords: Array.isArray(row.keywords) ? row.keywords.map(k => String(k)) : [],
  position: row.position,
  image_url: row.image_url,
  created_at: row.created_at,
  updated_at: row.updated_at
});

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

    if (error) {
      console.error('Error fetching published assessments:', error);
      throw error;
    }
    return (data || []).map(mapToAIAssessment);
  },

  // Get all assessments (for admin use)
  async getAllAssessments(): Promise<AIAssessment[]> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all assessments:', error);
      throw error;
    }
    return (data || []).map(mapToAIAssessment);
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
      console.error('Error fetching assessment:', error);
      throw error;
    }
    return mapToAIAssessment(data);
  },

  // Get questions for an assessment
  async getAssessmentQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('position');

    if (error) {
      console.error('Error fetching assessment questions:', error);
      throw error;
    }
    return (data || []).map(mapToAssessmentQuestion);
  },

  // Create a new assessment with text content
  async createAssessment(assessment: Omit<AIAssessment, 'id' | 'created_at' | 'updated_at' | 'status' | 'created_by'>): Promise<AIAssessment> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('ai_assessments')
      .insert({
        ...assessment,
        status: 'draft',
        created_by: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToAIAssessment(data);
  },

  // Update assessment
  async updateAssessment(id: string, updates: Partial<Omit<AIAssessment, 'id' | 'created_at' | 'updated_at'>>): Promise<AIAssessment> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToAIAssessment(data);
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
  async createQuestion(question: Omit<AssessmentQuestion, 'id' | 'created_at' | 'updated_at'>): Promise<AssessmentQuestion> {
    // First, get the next available question number and position for this assessment
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('assessment_questions')
      .select('question_number, position')
      .eq('assessment_id', question.assessment_id)
      .order('question_number', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing questions:', fetchError);
      throw fetchError;
    }

    // Calculate next question number and position
    const nextQuestionNumber = existingQuestions && existingQuestions.length > 0 
      ? existingQuestions[0].question_number + 1 
      : 1;
    
    const nextPosition = existingQuestions && existingQuestions.length > 0 
      ? existingQuestions[0].position + 1 
      : 1;

    // Create the question with calculated numbers
    const questionData = {
      ...question,
      question_number: nextQuestionNumber,
      position: nextPosition,
    };

    console.log('Creating question with data:', questionData);

    const { data, error } = await supabase
      .from('assessment_questions')
      .insert(questionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      throw error;
    }
    
    return mapToAssessmentQuestion(data);
  },

  // Update a question
  async updateQuestion(id: string, updates: Partial<Omit<AssessmentQuestion, 'id' | 'created_at' | 'updated_at'>>): Promise<AssessmentQuestion> {
    const { data, error } = await supabase
      .from('assessment_questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapToAssessmentQuestion(data);
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

  // Mark a single question using AI
  async markSingleQuestion(sessionId: string, questionId: string, answer: string): Promise<{
    marks: number;
    maxMarks: number;
    feedback: string;
    confidence: number;
  }> {
    console.log('🔄 Calling ai-mark-assessment edge function...');
    console.log('Parameters:', { sessionId, questionId, answerLength: answer.length });

    try {
      const { data, error } = await supabase.functions.invoke('ai-mark-assessment', {
        body: { sessionId, questionId, studentAnswer: answer }
      });

      console.log('📡 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Check if it's a function not found error
        if (error.message && error.message.includes('not found')) {
          throw new Error('The AI marking service is not available. Please ensure the edge function is deployed.');
        }
        
        throw new Error(error.message || 'Failed to mark question');
      }

      if (!data) {
        throw new Error('No response received from marking service');
      }

      if (!data.success) {
        throw new Error(data.error || 'Marking failed');
      }

      console.log('✅ Question marked successfully:', data);
      return data;
    } catch (error: any) {
      console.error('💥 Error in markSingleQuestion:', error);
      
      // Provide more specific error messages
      if (error.name === 'FunctionsError') {
        throw new Error('The AI marking service is currently unavailable. Please try again later.');
      }
      
      if (error.message && error.message.includes('not found')) {
        throw new Error('The AI marking service is not deployed. Please contact support.');
      }
      
      throw error;
    }
  },

  // Calculate session score
  async calculateSessionScore(sessionId: string): Promise<AssessmentScore> {
    const { data, error } = await supabase.rpc('calculate_session_score', {
      session_id_param: sessionId
    });

    if (error) throw error;
    return data[0] || {
      total_marks_achieved: 0,
      total_marks_available: 0,
      percentage_score: 0,
      questions_answered: 0,
      total_questions: 0
    };
  },

  // Get user's best score for an assessment
  async getUserBestScore(assessmentId: string, userId: string): Promise<UserAssessmentStats | null> {
    const { data, error } = await supabase.rpc('get_user_best_assessment_score', {
      assessment_id_param: assessmentId,
      user_id_param: userId
    });

    if (error) throw error;
    return data[0] || null;
  },

  // Complete assessment session with score calculation
  async completeSessionWithScore(sessionId: string): Promise<AssessmentScore> {
    // First calculate the score
    const score = await this.calculateSessionScore(sessionId);
    
    // Update the session with the calculated scores
    const { error } = await supabase
      .from('assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_marks_achieved: score.total_marks_achieved,
        total_marks_available: score.total_marks_available,
      })
      .eq('id', sessionId);

    if (error) throw error;
    return score;
  },

  // Get all user sessions for an assessment (for retry functionality)
  async getUserAssessmentSessions(assessmentId: string, userId: string): Promise<AssessmentSession[]> {
    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false });

    if (error) throw error;
    return (data || []).map(session => ({
      ...session,
      status: session.status as 'in_progress' | 'completed' | 'abandoned'
    }));
  },

  // Generate exam from existing assessments by subject
  async generateExamFromSubject(subject: string): Promise<AIAssessment> {
    // Get all published assessments with the selected subject
    const { data: assessments, error: assessmentsError } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('status', 'published')
      .eq('subject', subject);

    if (assessmentsError) throw assessmentsError;
    if (!assessments || assessments.length === 0) {
      throw new Error(`No published assessments found for subject: ${subject}`);
    }

    // Get questions from all assessments
    const allQuestions: AssessmentQuestion[] = [];
    for (const assessment of assessments) {
      const questions = await this.getAssessmentQuestions(assessment.id);
      if (questions.length >= 2) {
        // Randomly select 2 questions from this assessment
        const shuffled = questions.sort(() => 0.5 - Math.random());
        allQuestions.push(...shuffled.slice(0, 2));
      } else if (questions.length > 0) {
        // If less than 2 questions, take all available
        allQuestions.push(...questions);
      }
    }

    if (allQuestions.length === 0) {
      throw new Error(`No questions found in ${subject} assessments`);
    }

    // Calculate total marks
    const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks_available, 0);

    // Create the exam assessment
    const examTitle = `${subject} Exam - ${new Date().toLocaleDateString()}`;
    const examAssessment = await this.createAssessment({
      title: examTitle,
      description: `Combined exam generated from ${assessments.length} ${subject} assessments`,
      subject: subject,
      total_marks: totalMarks,
      time_limit_minutes: Math.max(60, allQuestions.length * 3), // 3 minutes per question, minimum 60 minutes
    });

    // Create questions for the exam with proper numbering
    for (let i = 0; i < allQuestions.length; i++) {
      const originalQuestion = allQuestions[i];
      await this.createQuestion({
        assessment_id: examAssessment.id,
        question_number: i + 1,
        question_text: originalQuestion.question_text,
        question_type: originalQuestion.question_type,
        marks_available: originalQuestion.marks_available,
        correct_answer: originalQuestion.correct_answer,
        marking_scheme: originalQuestion.marking_scheme,
        keywords: originalQuestion.keywords,
        position: i + 1,
        image_url: originalQuestion.image_url,
      });
    }

    return examAssessment;
  },

  // Mark all answers in a session using AI
  async markAnswers(sessionId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('ai-mark-assessment', {
      body: { sessionId }
    });

    if (error) throw error;
    return data;
  },

  // Bulk create assessments from curriculum
  async bulkCreateAssessments(
    curriculum: any,
    settings: any,
    onProgress?: (progress: any) => void
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('bulk-generate-assessments', {
      body: {
        curriculum,
        generation_settings: settings
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate assessments');
    }

    return data;
  }
};
