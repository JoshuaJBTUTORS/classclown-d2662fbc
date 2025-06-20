
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
import { AgoraRTCProvider } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { getTokens } = useAgora();
  
  const [lesson, setLesson] = useState<any>(null);
  const [agoraCredentials, setAgoraCredentials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Create client with type assertion to resolve compatibility issues
  const [agoraClient] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as any);

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

      console.log('Loading video room for lesson:', lessonId);

      // Fetch lesson details with all Agora fields
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          agora_channel_name,
          agora_token,
          agora_uid,
          agora_rtm_token,
          netless_room_uuid,
          netless_room_token,
          netless_app_identifier
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        console.error('Lesson fetch error:', lessonError);
        throw new Error('Lesson not found');
      }

      console.log('Lesson data loaded:', lessonData);
      setLesson(lessonData);

      // Get fresh tokens for the user - map admin/owner to tutor for Agora roles
      const agoraRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole || 'student');
      console.log('Requesting tokens with role:', agoraRole);
      
      const credentials = await getTokens(lessonId, agoraRole as 'tutor' | 'student');
      
      if (!credentials) {
        throw new Error('Failed to get video conference access');
      }

      console.log('Agora credentials obtained:', credentials);
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
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-gray-600">Loading video conference...</span>
        </div>
      </div>
    );
  }

  if (error || !lesson || !agoraCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">
              {error || 'Video conference not available'}
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/calendar')} variant="outline">
                Go Back to Calendar
              </Button>
              <Button onClick={loadVideoRoom} variant="default">
                Retry Loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map admin/owner roles to tutor for the video room UI
  const videoRoomRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student');

  // Prepare Netless credentials if available
  const netlessCredentials = agoraCredentials.netlessRoomUuid ? {
    roomUuid: agoraCredentials.netlessRoomUuid,
    roomToken: agoraCredentials.netlessRoomToken,
    appIdentifier: agoraCredentials.netlessAppIdentifier
  } : undefined;

  console.log('Rendering video room with credentials:', {
    appId: agoraCredentials.appId,
    channel: agoraCredentials.channelName,
    uid: agoraCredentials.uid,
    role: videoRoomRole,
    netless: netlessCredentials
  });

  return (
    <AgoraRTCProvider client={agoraClient}>
      <AgoraVideoRoom
        appId={agoraCredentials.appId}
        channel={agoraCredentials.channelName}
        token={agoraCredentials.rtcToken}
        uid={agoraCredentials.uid}
        userRole={videoRoomRole}
        lessonTitle={lesson.title}
        netlessCredentials={netlessCredentials}
        onLeave={handleLeaveRoom}
      />
    </AgoraRTCProvider>
  );
};

export default VideoRoom;
