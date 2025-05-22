
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Plus } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // This would typically fetch conversations from an API
  const conversations = []; // Empty for now, will be populated with real data
  const isLoading = false; // Set to true when fetching data

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
      ) : conversations.length === 0 ? (
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
          {/* Conversations will be rendered here once we have the data */}
          <p className="text-center text-gray-500 p-4">
            Conversations will appear here once the messaging system is fully implemented
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
