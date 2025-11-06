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
