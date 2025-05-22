
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/message';

export const messageService = {
  // Conversation methods
  getConversations: async (): Promise<Conversation[]> => {
    // This fetches conversations the current user is part of
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user_profile:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('participants.user_id', user.user.id)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data as unknown as Conversation[];
  },

  getConversationById: async (id: string): Promise<Conversation> => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user_profile:profiles(id, first_name, last_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as unknown as Conversation;
  },

  createConversation: async (userIds: string[], title?: string): Promise<Conversation> => {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const currentUserId = userData.user.id;
    
    // Ensure current user is included in the conversation
    if (!userIds.includes(currentUserId)) {
      userIds.push(currentUserId);
    }
    
    // Start a transaction
    const { data, error } = await supabase
      .rpc('create_conversation', { 
        user_ids: userIds,
        conversation_title: title || null,
        is_group_chat: userIds.length > 2
      });
    
    if (error) throw error;
    return data as unknown as Conversation;
  },

  // Message methods
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as unknown as Message[];
  },

  sendMessage: async (conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userData.user.id,
        content,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      })
      .select(`
        *,
        sender_profile:profiles(id, first_name, last_name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    
    // Update the last_message_at field in the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    return data as unknown as Message;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Update the read_until timestamp in conversation_participants
    const { error } = await supabase
      .from('conversation_participants')
      .update({ read_until: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id);
    
    if (error) throw error;
  },

  // Helper to get the count of unread messages
  getUnreadMessageCount: async (): Promise<number> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('is_read', false)
      .neq('sender_id', userData.user.id);
    
    if (error) throw error;
    return count || 0;
  }
};
