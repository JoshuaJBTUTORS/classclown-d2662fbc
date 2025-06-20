
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import AgoraVideoRoom from '@/components/video/AgoraVideoRoom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
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
  const [retryCount, setRetryCount] = useState(0);
  
  // Create Agora client following SDK documentation
  const [agoraClient] = useState(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as any
  );

  useEffect(() => {
    if (!user || !lessonId) {
      navigate('/auth');
      return;
    }
    
    loadVideoRoom();
  }, [user, lessonId, retryCount]);

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

      // Get fresh tokens for the user
      const agoraRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole || 'student');
      console.log('Requesting tokens with role:', agoraRole);
      
      const credentials = await getTokens(lessonId, agoraRole as 'tutor' | 'student');
      
      if (!credentials) {
        throw new Error('Failed to get video conference access. Please check Agora configuration.');
      }

      // Validate credentials
      if (!credentials.appId || !credentials.channelName || !credentials.rtcToken) {
        throw new Error('Invalid video conference credentials received');
      }

      console.log('Agora credentials obtained:', {
        appId: credentials.appId,
        channelName: credentials.channelName,
        uid: credentials.uid,
        hasToken: !!credentials.rtcToken
      });
      
      setAgoraCredentials(credentials);
    } catch (error: any) {
      console.error('Error loading video room:', error);
      setError(error.message);
      
      // Show specific error messages
      if (error.message.includes('Agora credentials not configured')) {
        setError('Video conferencing is not properly configured. Please contact support.');
      } else if (error.message.includes('Lesson not found')) {
        setError('This lesson could not be found or you do not have permission to access it.');
      } else {
        setError(error.message);
      }
      
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleLeaveRoom = () => {
    navigate('/calendar');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-gray-600 font-medium">Loading video conference...</p>
            <p className="text-sm text-gray-500 mt-1">Setting up your connection</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson ||  !agoraCredentials) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connection Error
            </h3>
            <p className="text-gray-600 mb-6">
              {error || 'Video conference not available'}
            </p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/calendar')} variant="outline" className="w-full">
                Go Back to Calendar
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                Retry attempt: {retryCount}
              </p>
            )}
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

  console.log('Rendering video room with real Agora credentials:', {
    appId: agoraCredentials.appId,
    channel: agoraCredentials.channelName,
    uid: agoraCredentials.uid,
    role: videoRoomRole,
    hasNetless: !!netlessCredentials
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
