
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/messageService';
import { formatDistanceToNow } from 'date-fns';

const MessageDetail: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch conversation details
  const { 
    data: conversation, 
    isLoading: conversationLoading,
    error: conversationError
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationId ? messageService.getConversationById(conversationId) : Promise.reject('No conversation ID'),
    enabled: !!conversationId && !!profile?.id,
  });
  
  // Fetch messages
  const { 
    data: messages, 
    isLoading: messagesLoading,
    error: messagesError
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationId ? messageService.getMessages(conversationId) : Promise.reject('No conversation ID'),
    enabled: !!conversationId && !!profile?.id,
  });
  
  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId && profile?.id) {
      messageService.markAsRead(conversationId).catch((error) => {
        console.error("Error marking conversation as read:", error);
      });
    }
  }, [conversationId, profile?.id]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error("No conversation ID");
      return messageService.sendMessage(conversationId, content);
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "An error occurred while sending your message",
        variant: "destructive"
      });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate(newMessage);
  };
  
  // Helper function to get conversation name
  const getConversationName = () => {
    if (!conversation) return '';
    
    if (conversation.title) return conversation.title;
    
    // For 1:1 conversations, show the other participant's name
    if (!conversation.is_group && conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p) => p.user_id !== profile?.id
      );
      if (otherParticipant?.user_profile) {
        return `${otherParticipant.user_profile.first_name || ''} ${otherParticipant.user_profile.last_name || ''}`.trim() || 'User';
      }
    }
    
    return 'Conversation';
  };
  
  const isLoading = conversationLoading || messagesLoading;
  const error = conversationError || messagesError;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/messages')} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back to Messages
          </Button>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex items-start gap-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  {i % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full" />}
                  <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'} rounded-lg`} />
                  {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/messages')} 
            className="mr-2"
          >
            <ChevronLeft className="mr-1" />
            Back to Messages
          </Button>
        </div>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Error loading conversation</h3>
            <p className="text-gray-500 mb-6">
              There was a problem loading this conversation. Please try again.
            </p>
            <Button onClick={() => navigate('/messages')}>
              Return to Messages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/messages')} 
          className="mr-2"
        >
          <ChevronLeft className="mr-1" />
          Back to Messages
        </Button>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{getConversationName()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 h-[500px]">
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {messages?.length === 0 ? (
                <div className="text-center text-gray-500 p-6">
                  <p>No messages in this conversation yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                messages?.map((message) => {
                  const isCurrentUser = message.sender_id === profile?.id;
                  const senderName = message.sender_profile ? 
                    `${message.sender_profile.first_name || ''} ${message.sender_profile.last_name || ''}`.trim() : 
                    'User';
                    
                  return (
                    <div 
                      key={message.id} 
                      className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[70%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                        {!isCurrentUser && (
                          <p className="text-xs font-medium mb-1">{senderName}</p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {`${profile?.first_name?.substring(0, 1) || ''}${profile?.last_name?.substring(0, 1) || ''}`.toUpperCase() || 'ME'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageDetail;
