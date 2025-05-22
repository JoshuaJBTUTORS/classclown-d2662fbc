
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const MessageDetail: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  
  // This would typically fetch conversation details from an API
  // For now, we'll use a placeholder
  const isLoading = false;
  const conversation = {
    id: conversationId,
    title: 'Example Conversation',
    participants: [
      { id: '1', name: 'Jane Doe', avatarUrl: '' },
      { id: '2', name: 'John Smith', avatarUrl: '' }
    ],
    messages: [] // Empty for now
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // This would typically send the message to an API
    console.log('Sending message:', newMessage);
    
    // Clear input after sending
    setNewMessage('');
  };
  
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
          <CardTitle>{conversation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 h-[500px]">
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {conversation.messages.length === 0 ? (
                <div className="text-center text-gray-500 p-6">
                  <p>No messages in this conversation yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                conversation.messages.map((message, index) => (
                  <div key={index}>
                    {/* Message rendering will go here */}
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim()}>
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
