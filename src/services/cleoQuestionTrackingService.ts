import { supabase } from '@/integrations/supabase/client';

export interface QuestionAnswer {
  id?: string;
  conversation_id: string;
  user_id?: string;
  question_id: string;
  question_text: string;
  answer_id: string;
  answer_text: string;
  is_correct: boolean;
  time_taken_seconds?: number;
  step_id: string;
  answered_at?: string;
  created_at?: string;
}

export interface QuestionStats {
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_rate: number;
  average_time_seconds: number;
  total_time_seconds: number;
}

export const cleoQuestionTrackingService = {
  async recordQuestionAnswer(data: Omit<QuestionAnswer, 'id' | 'user_id' | 'answered_at' | 'created_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('cleo_question_answers')
      .insert({
        conversation_id: data.conversation_id,
        user_id: user.id,
        question_id: data.question_id,
        question_text: data.question_text,
        answer_id: data.answer_id,
        answer_text: data.answer_text,
        is_correct: data.is_correct,
        time_taken_seconds: data.time_taken_seconds,
        step_id: data.step_id,
        answered_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async getQuestionHistory(conversationId: string): Promise<QuestionAnswer[]> {
    const { data, error } = await supabase
      .from('cleo_question_answers')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('answered_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getQuestionStats(conversationId: string): Promise<QuestionStats> {
    const history = await this.getQuestionHistory(conversationId);

    const totalQuestions = history.length;
    const correctAnswers = history.filter(q => q.is_correct).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const timeTaken = history
      .filter(q => q.time_taken_seconds != null)
      .map(q => q.time_taken_seconds || 0);
    
    const totalTimeSeconds = timeTaken.reduce((sum, time) => sum + time, 0);
    const averageTimeSeconds = timeTaken.length > 0 ? totalTimeSeconds / timeTaken.length : 0;

    return {
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      incorrect_answers: incorrectAnswers,
      accuracy_rate: Math.round(accuracyRate),
      average_time_seconds: Math.round(averageTimeSeconds),
      total_time_seconds: totalTimeSeconds,
    };
  },

  async getStepQuestionStats(conversationId: string, stepId: string): Promise<QuestionStats> {
    const { data, error } = await supabase
      .from('cleo_question_answers')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('step_id', stepId);

    if (error) throw error;

    const history = data || [];
    const totalQuestions = history.length;
    const correctAnswers = history.filter(q => q.is_correct).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const timeTaken = history
      .filter(q => q.time_taken_seconds != null)
      .map(q => q.time_taken_seconds || 0);
    
    const totalTimeSeconds = timeTaken.reduce((sum, time) => sum + time, 0);
    const averageTimeSeconds = timeTaken.length > 0 ? totalTimeSeconds / timeTaken.length : 0;

    return {
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      incorrect_answers: incorrectAnswers,
      accuracy_rate: Math.round(accuracyRate),
      average_time_seconds: Math.round(averageTimeSeconds),
      total_time_seconds: totalTimeSeconds,
    };
  },
};
