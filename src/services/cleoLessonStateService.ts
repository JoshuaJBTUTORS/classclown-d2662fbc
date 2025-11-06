import { supabase } from '@/integrations/supabase/client';

export interface LessonState {
  id?: string;
  conversation_id: string;
  user_id?: string;
  lesson_plan_id?: string;
  active_step: number;
  visible_content_ids: string[];
  completed_steps: string[];
  paused_at?: string;
  completed_at?: string;
  completion_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export const cleoLessonStateService = {
  async saveLessonState(state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('cleo_lesson_state')
      .upsert({
        conversation_id: state.conversation_id,
        user_id: user.id,
        lesson_plan_id: state.lesson_plan_id,
        active_step: state.active_step,
        visible_content_ids: state.visible_content_ids,
        completed_steps: state.completed_steps,
        completion_percentage: state.completion_percentage,
        paused_at: state.paused_at,
        completed_at: state.completed_at,
      }, {
        onConflict: 'conversation_id'
      });

    if (error) throw error;
  },

  async loadLessonState(conversationId: string): Promise<LessonState | null> {
    const { data, error } = await supabase
      .from('cleo_lesson_state')
      .select('*')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      visible_content_ids: (Array.isArray(data.visible_content_ids) ? data.visible_content_ids : []) as string[],
      completed_steps: (Array.isArray(data.completed_steps) ? data.completed_steps : []) as string[],
    };
  },

  async pauseLesson(conversationId: string, state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Save state with paused_at timestamp
    await this.saveLessonState({
      ...state,
      paused_at: new Date().toISOString(),
    });

    // Update conversation - fetch current value and increment
    const { data: conversation } = await supabase
      .from('cleo_conversations')
      .select('total_pauses')
      .eq('id', conversationId)
      .single();

    const { error } = await supabase
      .from('cleo_conversations')
      .update({
        last_paused_at: new Date().toISOString(),
        total_pauses: (conversation?.total_pauses || 0) + 1,
      })
      .eq('id', conversationId);

    if (error) throw error;
  },

  async resumeLesson(conversationId: string): Promise<LessonState | null> {
    const state = await this.loadLessonState(conversationId);
    
    if (state) {
      // Increment resume count - fetch current value and increment
      const { data: conversation } = await supabase
        .from('cleo_conversations')
        .select('resume_count')
        .eq('id', conversationId)
        .single();

      const { error } = await supabase
        .from('cleo_conversations')
        .update({
          resume_count: (conversation?.resume_count || 0) + 1,
        })
        .eq('id', conversationId);

      if (error) throw error;

      // Clear paused_at
      await this.saveLessonState({
        ...state,
        paused_at: undefined,
      });
    }

    return state;
  },

  async completeLesson(conversationId: string, state: Omit<LessonState, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Save final state with completion
    await this.saveLessonState({
      ...state,
      completed_at: new Date().toISOString(),
      completion_percentage: 100,
    });

    // Update conversation status
    const { error } = await supabase
      .from('cleo_conversations')
      .update({
        status: 'completed',
      })
      .eq('id', conversationId);

    if (error) throw error;
  },

  async getLessonProgress(conversationId: string): Promise<number> {
    const state = await this.loadLessonState(conversationId);
    return state?.completion_percentage || 0;
  },

  async clearLessonState(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('cleo_lesson_state')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) throw error;
  },
};
