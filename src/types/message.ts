
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
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    organization_id?: string;
  } | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  deleted_at?: string | null;
  sender_profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface MessageStatus {
  id: string;
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at?: string | null;
}
