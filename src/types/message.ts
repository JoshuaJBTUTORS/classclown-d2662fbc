
export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_message_at: string;
  is_group: boolean;
  participants: ConversationParticipant[];
  messages?: Message[];
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  read_until?: string;
  user_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    organization_id?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  deleted_at?: string;
  sender_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface MessageStatus {
  id: string;
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at?: string;
}
