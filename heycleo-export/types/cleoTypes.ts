// Cleo Types for HeyCleo

export type ChatMode = 'voice' | 'text';

export interface CleoMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: ChatMode;
  duration_seconds?: number;
  created_at: string;
}

export interface ModeRecommendation {
  suggestedMode: ChatMode;
  reason: string;
  autoSwitch: boolean;
}

export interface CleoConversation {
  id: string;
  user_id: string;
  topic?: string;
  year_group?: string;
  learning_goal?: string;
  status: 'active' | 'completed' | 'paused';
  session_stage?: string;
  voice_duration_seconds?: number;
  text_message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CleoLessonPlan {
  id: string;
  topic: string;
  year_group: string;
  exam_board?: string;
  difficulty_tier?: 'foundation' | 'intermediate' | 'higher';
  subject_name?: string;
  learning_objectives: string[];
  teaching_sequence: TeachingStep[];
  status: 'generating' | 'ready' | 'error';
  created_at: string;
}

export interface TeachingStep {
  id: string;
  title: string;
  duration_minutes?: number;
  content_blocks?: ContentBlockRef[];
}

export interface ContentBlockRef {
  id: string;
  type: string;
}

export interface CleoLessonState {
  id: string;
  conversation_id: string;
  user_id: string;
  lesson_plan_id?: string;
  active_step: number;
  visible_content_ids: string[];
  completed_steps: string[];
  completion_percentage: number;
  last_step_title?: string;
  last_content_block_id?: string;
  paused_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceSessionQuota {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_minutes_allowed: number;
  minutes_used: number;
  minutes_remaining: number;
  bonus_minutes: number;
}

export interface GamificationStats {
  user_id: string;
  total_coins: number;
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  current_level: number;
  lessons_completed: number;
  questions_answered: number;
  questions_correct: number;
}

export interface MasteryLevel {
  name: string;
  minCoins: number;
  emoji: string;
  color: string;
}
