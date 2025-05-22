
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Plus, User, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageTitle from '@/components/ui/PageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/messageService';
import { formatDistanceToNow } from 'date-fns';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Fetch conversations
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getConversations,
    enabled: !!profile?.id,
  });

  // Function to get conversation title/name
  const getConversationName = (conversation: any) => {
    if (conversation.title) return conversation.title;
    
    // For 1:1 conversations, show the other participant's name
    if (!conversation.is_group && conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.user_id !== profile?.id
      );
      if (otherParticipant?.user_profile) {
        return `${otherParticipant.user_profile.first_name || ''} ${otherParticipant.user_profile.last_name || ''}`.trim() || 'User';
      }
    }
    
    return 'Unnamed conversation';
  };
  
  // Function to get conversation avatar
  const getConversationAvatar = (conversation: any) => {
    if (conversation.is_group) {
      return null; // No avatar for group chats
    }
    
    // For 1:1 conversations, show the other participant's avatar
    if (conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.user_id !== profile?.id
      );
      if (otherParticipant?.user_profile) {
        return otherParticipant.user_profile.avatar_url;
      }
    }
    
    return null;
  };
  
  // Function to get conversation initials (for avatar fallback)
  const getConversationInitials = (conversation: any) => {
    const name = getConversationName(conversation);
    if (!name || name === 'Unnamed conversation') {
      return conversation.is_group ? 'GC' : 'U';
    }
    
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Messages" subtitle="Communicate with students and tutors" />
        
        <Button onClick={() => navigate('/messages/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error loading messages</h3>
          <p className="text-gray-500 mb-6">
            There was a problem loading your conversations. Please try again.
          </p>
          <Button onClick={() => navigate('.')}>
            Refresh
          </Button>
        </div>
      ) : conversations?.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-gray-500 mb-6">
            Start a conversation with a student or tutor
          </p>
          <Button onClick={() => navigate('/messages/new')}>
            Start a New Conversation
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations?.map((conversation: any) => (
            <Card 
              key={conversation.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/messages/${conversation.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    {conversation.is_group ? (
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    ) : getConversationAvatar(conversation) ? (
                      <AvatarImage src={getConversationAvatar(conversation)} alt={getConversationName(conversation)} />
                    ) : (
                      <AvatarFallback>
                        {getConversationInitials(conversation)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {getConversationName(conversation)}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {conversation.last_message_at && 
                      formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
