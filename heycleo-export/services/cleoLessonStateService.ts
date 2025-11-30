// Lesson State Service for HeyCleo

import { supabase } from '@/integrations/supabase/client';

export interface LessonState {
  id?: string;
  conversation_id: string;
  user_id?: string;
  lesson_plan_id?: string;
  active_step: number;
  visible_content_ids: string[];
  completed_steps: string[];
  completion_percentage: number;
  last_step_title?: string;
  last_content_block_id?: string;
  last_cleo_message?: string;
  paused_at?: string;
  completed_at?: string;
}

export interface ResumeState {
  isResuming: boolean;
  activeStep: number;
  visibleContentIds: string[];
  completedSteps: string[];
  lastStepTitle?: string;
  lastContentBlockId?: string;
}

class CleoLessonStateService {
  async getState(conversationId: string): Promise<LessonState | null> {
    const { data, error } = await supabase
      .from('cleo_lesson_state')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No state found - that's okay
        return null;
      }
      console.error('Error fetching lesson state:', error);
      return null;
    }

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      user_id: data.user_id,
      lesson_plan_id: data.lesson_plan_id,
      active_step: data.active_step,
      visible_content_ids: data.visible_content_ids as string[],
      completed_steps: data.completed_steps as string[],
      completion_percentage: data.completion_percentage,
      last_step_title: data.last_step_title,
      last_content_block_id: data.last_content_block_id,
      last_cleo_message: data.last_cleo_message,
      paused_at: data.paused_at,
      completed_at: data.completed_at,
    };
  }

  async saveState(state: Partial<LessonState> & { conversation_id: string }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user logged in, cannot save lesson state');
      return;
    }

    const { error } = await supabase
      .from('cleo_lesson_state')
      .upsert({
        conversation_id: state.conversation_id,
        user_id: user.id,
        lesson_plan_id: state.lesson_plan_id,
        active_step: state.active_step ?? 0,
        visible_content_ids: state.visible_content_ids ?? [],
        completed_steps: state.completed_steps ?? [],
        completion_percentage: state.completion_percentage ?? 0,
        last_step_title: state.last_step_title,
        last_content_block_id: state.last_content_block_id,
        last_cleo_message: state.last_cleo_message,
        paused_at: state.paused_at,
        completed_at: state.completed_at,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'conversation_id',
      });

    if (error) {
      console.error('Error saving lesson state:', error);
      throw error;
    }
  }

  async markPaused(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('cleo_lesson_state')
      .update({
        paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error marking lesson as paused:', error);
    }
  }

  async markCompleted(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('cleo_lesson_state')
      .update({
        completed_at: new Date().toISOString(),
        completion_percentage: 100,
        paused_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error marking lesson as completed:', error);
    }
  }

  async clearPause(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('cleo_lesson_state')
      .update({
        paused_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error clearing pause:', error);
    }
  }

  async deleteState(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('cleo_lesson_state')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error deleting lesson state:', error);
    }
  }
}

export const cleoLessonStateService = new CleoLessonStateService();
