
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/message';

export const messageService = {
  // Conversation methods
  getConversations: async (): Promise<Conversation[]> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) throw new Error('User not authenticated');
    
    // First, get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Get all conversations where user is participant
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user_profile:profiles(
            id, 
            first_name, 
            last_name, 
            avatar_url,
            user_roles:user_roles(role)
          )
        )
      `)
      .eq('participants.user_id', userData.user.id)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter conversations based on role restrictions
    let filteredData = data;
    
    if (userRoleData?.role === 'tutor') {
      // Tutors should only see conversations with admins/owners
      filteredData = data.filter((conv) => {
        // Allow group conversations (handled by createConversation)
        if (conv.is_group) return true;
        
        // For 1:1, check if the other participant is admin/owner
        const otherParticipant = conv.participants?.find(
          p => p.user_id !== userData.user.id
        );
        
        return otherParticipant?.user_profile?.user_roles?.[0]?.role === 'admin' || 
               otherParticipant?.user_profile?.user_roles?.[0]?.role === 'owner';
      });
    } else if (userRoleData?.role === 'admin' || userRoleData?.role === 'owner') {
      // Admins/owners should only see conversations with tutors
      filteredData = data.filter((conv) => {
        // Allow group conversations (handled by createConversation)
        if (conv.is_group) return true;
        
        // For 1:1, check if the other participant is a tutor
        const otherParticipant = conv.participants?.find(
          p => p.user_id !== userData.user.id
        );
        
        return otherParticipant?.user_profile?.user_roles?.[0]?.role === 'tutor';
      });
    } else if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      // Students and parents should not see any conversations
      filteredData = [];
    }
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return (filteredData as unknown) as Conversation[];
  },

  getConversationById: async (id: string): Promise<Conversation> => {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) throw new Error('User not authenticated');
    
    // First, get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Block students and parents from accessing messages
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      throw new Error('You do not have permission to view this conversation');
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          *,
          user_profile:profiles(
            id, 
            first_name, 
            last_name, 
            avatar_url,
            user_roles:user_roles(role)
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Check if user is participant in conversation
    const isParticipant = data.participants.some(
      (p) => p.user_id === userData.user.id
    );
    
    if (!isParticipant) {
      throw new Error('You do not have permission to view this conversation');
    }
    
    // Check role-based restrictions for 1:1 chats
    if (!data.is_group) {
      // Get the other participant
      const otherParticipant = data.participants.find(
        (p) => p.user_id !== userData.user.id
      );
      
      const otherUserRole = otherParticipant?.user_profile?.user_roles?.[0]?.role;
      
      if (userRoleData?.role === 'tutor') {
        // Tutors can only chat with admins/owners
        if (otherUserRole !== 'admin' && otherUserRole !== 'owner') {
          throw new Error('You do not have permission to view this conversation');
        }
      } else if (userRoleData?.role === 'admin' || userRoleData?.role === 'owner') {
        // Admins/owners can only chat with tutors
        if (otherUserRole !== 'tutor') {
          throw new Error('You do not have permission to view this conversation');
        }
      }
    }
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return (data as unknown) as Conversation;
  },

  createConversation: async (userIds: string[], title?: string): Promise<Conversation> => {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    const currentUserId = userData.user.id;
    
    // Get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUserId)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Block students and parents from creating conversations
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      throw new Error('You do not have permission to create conversations');
    }
    
    // For each recipient, check their role to enforce restrictions
    for (const userId of userIds) {
      if (userId === currentUserId) continue;
      
      const { data: recipientRoleData, error: recipientRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();
        
      if (recipientRoleError) throw recipientRoleError;
      
      // Apply role restrictions
      if (userRoleData?.role === 'tutor') {
        // Tutors can only message admins/owners
        if (recipientRoleData?.role !== 'admin' && recipientRoleData?.role !== 'owner') {
          throw new Error('Tutors can only send messages to administrators');
        }
      } else if (userRoleData?.role === 'admin' || userRoleData?.role === 'owner') {
        // Admins/owners can only message tutors
        if (recipientRoleData?.role !== 'tutor') {
          throw new Error('Administrators can only send messages to tutors');
        }
      }
    }
    
    // Ensure current user is included in the conversation
    if (!userIds.includes(currentUserId)) {
      userIds.push(currentUserId);
    }
    
    // Start a transaction
    const { data, error } = await supabase
      .rpc('create_conversation', { 
        p_user_ids: userIds,
        p_title: title || null,
        p_is_group: userIds.length > 2,
        p_first_message: null
      });
    
    if (error) throw error;
    return (data as unknown) as Conversation;
  },

  // Message methods
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Block students and parents from viewing messages
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      throw new Error('You do not have permission to view messages');
    }
    
    // Check if user is participant in conversation
    const { count, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id);
    
    if (participantError) throw participantError;
    
    if (!count) {
      throw new Error('You do not have permission to view these messages');
    }
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles(id, first_name, last_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return (data as unknown) as Message[];
  },

  sendMessage: async (conversationId: string, content: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Block students and parents from sending messages
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      throw new Error('You do not have permission to send messages');
    }
    
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
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return (data as unknown) as Message;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) throw userRoleError;
    
    // Block students and parents from marking messages as read
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      throw new Error('You do not have permission to update message status');
    }
    
    // Update the read_until timestamp in conversation_participants
    const { error } = await supabase
      .from('conversation_participants')
      .update({ read_until: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id);
    
    if (error) throw error;
  },

  // Helper to get the count of unread messages - fixed query to use message_status table
  getUnreadMessageCount: async (): Promise<number> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');
    
    // Get current user's role
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_primary', true)
      .single();
      
    if (userRoleError) return 0; // Just return 0 on error
    
    // Return 0 for students and parents
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      return 0;
    }
    
    // Query message_status table for unread messages count
    const { count, error } = await supabase
      .from('message_status')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);
    
    if (error) return 0; // Just return 0 on error
    return count || 0;
  }
};
