// Question Tracking Service for HeyCleo

import { supabase } from '@/integrations/supabase/client';

interface QuestionAnswerRecord {
  conversation_id: string;
  question_id: string;
  question_text: string;
  answer_id: string;
  answer_text: string;
  is_correct: boolean;
  time_taken_seconds?: number;
  step_id: string;
}

class CleoQuestionTrackingService {
  async recordQuestionAnswer(record: QuestionAnswerRecord): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user logged in, cannot record question answer');
      return;
    }

    const { error } = await supabase
      .from('cleo_question_answers')
      .insert({
        user_id: user.id,
        conversation_id: record.conversation_id,
        question_id: record.question_id,
        question_text: record.question_text,
        answer_id: record.answer_id,
        answer_text: record.answer_text,
        is_correct: record.is_correct,
        time_taken_seconds: record.time_taken_seconds,
        step_id: record.step_id,
      });

    if (error) {
      console.error('Error recording question answer:', error);
      throw error;
    }

    // Update gamification stats
    await this.updateGamificationStats(user.id, record.is_correct);
  }

  private async updateGamificationStats(userId: string, isCorrect: boolean): Promise<void> {
    // Get current stats
    const { data: stats, error: fetchError } = await supabase
      .from('user_gamification_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching gamification stats:', fetchError);
      return;
    }

    const currentStats = stats || {
      questions_answered: 0,
      questions_correct: 0,
      total_coins: 0,
    };

    const coinsToAdd = isCorrect ? 2 : 0;

    const { error: updateError } = await supabase
      .from('user_gamification_stats')
      .upsert({
        user_id: userId,
        questions_answered: currentStats.questions_answered + 1,
        questions_correct: currentStats.questions_correct + (isCorrect ? 1 : 0),
        total_coins: currentStats.total_coins + coinsToAdd,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating gamification stats:', updateError);
    }
  }

  async getConversationStats(conversationId: string): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    averageTimeSeconds: number;
  }> {
    const { data, error } = await supabase
      .from('cleo_question_answers')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error fetching conversation stats:', error);
      return { totalQuestions: 0, correctAnswers: 0, averageTimeSeconds: 0 };
    }

    const totalQuestions = data.length;
    const correctAnswers = data.filter(q => q.is_correct).length;
    const timesWithValues = data.filter(q => q.time_taken_seconds != null);
    const averageTimeSeconds = timesWithValues.length > 0
      ? timesWithValues.reduce((sum, q) => sum + (q.time_taken_seconds || 0), 0) / timesWithValues.length
      : 0;

    return { totalQuestions, correctAnswers, averageTimeSeconds };
  }
}

export const cleoQuestionTrackingService = new CleoQuestionTrackingService();
