
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import AgoraVideoRoom from '@/components/video/AgoraVideoRoom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { getTokens } = useAgora();
  
  const [lesson, setLesson] = useState<any>(null);
  const [agoraCredentials, setAgoraCredentials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }
    
    loadVideoRoom();
  }, [user, lessonId]);

  const loadVideoRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        throw new Error('Lesson not found');
      }

      // Check if lesson has Agora room
      if (!lessonData.agora_channel_name || !lessonData.agora_token) {
        throw new Error('Video conference room not available');
      }

      setLesson(lessonData);

      // Get fresh tokens for the user - map admin/owner to tutor for Agora roles
      const agoraRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole || 'student');
      const credentials = await getTokens(lessonId, agoraRole as 'tutor' | 'student');
      
      if (!credentials) {
        throw new Error('Failed to get video conference access');
      }

      setAgoraCredentials(credentials);
    } catch (error: any) {
      console.error('Error loading video room:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    navigate('/calendar');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading video conference...</span>
        </div>
      </div>
    );
  }

  if (error || !lesson || !agoraCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Video conference not available'}
            </p>
            <Button onClick={() => navigate('/calendar')} variant="outline">
              Go Back to Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map admin/owner roles to tutor for the video room UI
  const videoRoomRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student');

  return (
    <AgoraVideoRoom
      appId={agoraCredentials.appId}
      channel={agoraCredentials.channelName}
      token={agoraCredentials.rtcToken}
      uid={agoraCredentials.uid}
      userRole={videoRoomRole}
      lessonTitle={lesson.title}
      onLeave={handleLeaveRoom}
    />
  );
};

export default VideoRoom;
