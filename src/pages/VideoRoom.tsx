import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import AgoraVideoRoom from '@/components/video/AgoraVideoRoom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AgoraRTCProvider } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { getTokens, regenerateTokens } = useAgora();
  
  const [lesson, setLesson] = useState<any>(null);
  const [agoraCredentials, setAgoraCredentials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
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

      console.log('🧪 [TEST] Using updated official Agora token for testing');

      // Fetch lesson details
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

      // TEST: Use the updated official Agora token
      const officialToken = '007eJxSYBC+9+tEwQPhvMMP9C/kJbUu8GX88jBkT1W9l/lHFofWjusKDEaWpgaGyWZJpgbJBibmFokWxkkmyQZpBsZmqYZGZuYGf2aFZjQEMjLMy/FmYmRgZGBhYGQA8ZnAJDOYZAGTIAAIAAD//2YiIOY=';
      
      // Create test credentials with updated official token
      const testCredentials = {
        appId: '29501c6b50c04f60a84c1ec705a7a67d', // Your Agora App ID
        channelName: `lesson_${lessonId.replace(/-/g, '_')}`,
        rtcToken: officialToken,
        uid: Math.floor(Math.random() * 1000000) + 1000,
        rtmToken: officialToken, // Using same token for RTM for testing
        netlessRoomUuid: lessonData.netless_room_uuid,
        netlessRoomToken: lessonData.netless_room_token,
        netlessAppIdentifier: lessonData.netless_app_identifier
      };

      console.log('🧪 [TEST] Using updated official Agora credentials:', {
        appId: testCredentials.appId.substring(0, 8) + '...',
        channelName: testCredentials.channelName,
        uid: testCredentials.uid,
        officialTokenLength: officialToken.length,
        tokenPrefix: officialToken.substring(0, 20) + '...'
      });
      
      setAgoraCredentials(testCredentials);
    } catch (error: any) {
      console.error('Error loading video room:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleRegenerateTokens = async () => {
    if (!lessonId) return;
    
    setIsRegenerating(true);
    try {
      const agoraRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole || 'student');
      
      const credentials = await regenerateTokens(lessonId, agoraRole as 'tutor' | 'student');
      
      if (credentials) {
        setAgoraCredentials(credentials);
        setError(null);
        
        // Refresh lesson data to get updated tokens
        await loadVideoRoom();
      }
    } catch (error) {
      console.error('Error regenerating tokens:', error);
    } finally {
      setIsRegenerating(false);
    }
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
            <p className="text-gray-600 font-medium">🧪 Testing with updated official Agora token...</p>
            <p className="text-sm text-gray-500 mt-1">Channel: {lesson?.title}</p>
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
            <p className="text-red-600 mb-4">
              {error || 'Video conference not available'}
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>🧪 TEST MODE:</strong> Using updated official Agora token</p>
              <p><strong>Lesson:</strong> {lessonId}</p>
            </div>
            <div className="space-y-3 mt-6">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/calendar')} variant="outline" className="w-full">
                Go Back to Calendar
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

  console.log('🧪 [TEST] Rendering video room with updated official Agora token:', {
    appId: agoraCredentials.appId,
    channel: agoraCredentials.channelName,
    uid: agoraCredentials.uid,
    role: videoRoomRole,
    tokenValid: !!agoraCredentials.rtcToken,
    hasNetless: !!netlessCredentials
  });

  return (
    <AgoraRTCProvider client={agoraClient}>
      <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-sm font-medium">
        🧪 TEST MODE: Using Updated Official Agora Token
      </div>
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
