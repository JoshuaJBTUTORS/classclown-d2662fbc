
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/message';

// Define a more flexible interface that can handle Supabase error responses
interface ParticipantWithRole {
  user_id: string;
  conversation_id: string;
  id: string;
  joined_at: string;
  read_until?: string | null;
  user_profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    organization_id?: string;
  } | { error: boolean } | null;
  userRole?: string | null;
}

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
    
    // If user is student or parent, they shouldn't see any conversations
    if (userRoleData?.role === 'student' || userRoleData?.role === 'parent') {
      return [];
    }
    
    // Get all conversations where user is participant
    const { data, error } = await supabase
      .from('conversations')
      .select('*, participants:conversation_participants(id, user_id, read_until, joined_at)')
      .eq('participants.user_id', userData.user.id)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    
    // For each conversation, fetch the participant profiles separately
    // since the direct join relationship doesn't exist in the database
    let filteredData = data || [];
    
    // For each conversation, we'll enhance with role information and filter based on roles
    const enhancedData = await Promise.all(filteredData.map(async (conv) => {
      // For each participant, get their role and profile
      if (conv.participants) {
        const participantsWithRoles = await Promise.all(conv.participants.map(async (p) => {
          // Get the user's profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', p.user_id)
            .single();
          
          // Get the user's role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', p.user_id)
            .eq('is_primary', true)
            .single();
            
          // Create a new object with all the original properties plus userRole and profile
          return {
            ...p,
            user_profile: profileError ? { error: true } : profileData,
            userRole: roleData?.role || null
          } as ParticipantWithRole;
        }));
        
        return {
          ...conv,
          participants: participantsWithRoles
        };
      }
      return conv;
    }));
    
    // Now filter based on role restrictions
    let roleFilteredConversations;
    
    if (userRoleData?.role === 'tutor') {
      // Tutors should only see conversations with admins/owners
      roleFilteredConversations = enhancedData.filter((conv) => {
        // Allow group conversations 
        if (conv.is_group) return true;
        
        // For 1:1, check if the other participant is admin/owner
        const otherParticipant = conv.participants?.find(
          p => p.user_id !== userData.user.id
        ) as ParticipantWithRole;
        
        return otherParticipant?.userRole === 'admin' || 
              otherParticipant?.userRole === 'owner';
      });
    } else if (userRoleData?.role === 'admin' || userRoleData?.role === 'owner') {
      // Admins/owners should only see conversations with tutors
      roleFilteredConversations = enhancedData.filter((conv) => {
        // Allow group conversations
        if (conv.is_group) return true;
        
        // For 1:1, check if the other participant is a tutor
        const otherParticipant = conv.participants?.find(
          p => p.user_id !== userData.user.id
        ) as ParticipantWithRole;
        
        return otherParticipant?.userRole === 'tutor';
      });
    } else {
      roleFilteredConversations = [];
    }
    
    // Cast to Conversation[] type to satisfy TypeScript
    return roleFilteredConversations as unknown as Conversation[];
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
    
    // Get the conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*, participants:conversation_participants(id, user_id, read_until, joined_at)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Check if user is participant in conversation
    const isParticipant = conversation.participants.some(
      (p) => p.user_id === userData.user.id
    );
    
    if (!isParticipant) {
      throw new Error('You do not have permission to view this conversation');
    }
    
    // Fetch profiles for all participants
    const participantsWithRoles = await Promise.all(conversation.participants.map(async (p) => {
      // Get the participant's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', p.user_id)
        .single();
      
      // For participants, fetch their role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', p.user_id)
        .eq('is_primary', true)
        .single();
          
      // Create a new object with all the original properties plus userRole
      return {
        ...p,
        user_profile: profileError ? { error: true } : profileData,
        userRole: roleData?.role || null
      } as ParticipantWithRole;
    }));
    
    const conversationWithRoles = {
      ...conversation,
      participants: participantsWithRoles
    };
    
    // Check role-based restrictions for 1:1 chats
    if (!conversation.is_group) {
      // Get the other participant
      const otherParticipant = conversationWithRoles.participants.find(
        p => p.user_id !== userData.user.id
      ) as ParticipantWithRole;
      
      const otherUserRole = otherParticipant?.userRole;
      
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
    
    // Cast to Conversation type to satisfy TypeScript
    return conversationWithRoles as unknown as Conversation;
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
    
    // Get the messages
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // For each message, fetch the sender profile separately
    const messagesWithProfiles = await Promise.all(data.map(async (message) => {
      // Get the sender's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('id', message.sender_id)
        .single();
      
      return {
        ...message,
        sender_profile: profileError ? null : profileData
      };
    }));
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return messagesWithProfiles as unknown as Message[];
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
      .select()
      .single();
    
    if (error) throw error;
    
    // Update the last_message_at field in the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
    
    // Fetch the sender profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', userData.user.id)
      .single();
    
    // Convert to unknown first to avoid TypeScript errors with deep types
    return {
      ...data,
      sender_profile: profileError ? null : profileData
    } as unknown as Message;
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
