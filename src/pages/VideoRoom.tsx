
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgora } from '@/hooks/useAgora';
import { useNetlessCredentials } from '@/hooks/useNetlessCredentials';
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

  // Map admin/owner roles to video room role
  const videoRoomRole = (userRole === 'admin' || userRole === 'owner') ? 'tutor' : (userRole as 'tutor' | 'student');
  
  // Use Netless credentials hook
  const { 
    credentials: netlessCredentials, 
    isLoading: isLoadingNetless, 
    error: netlessError,
    regenerateToken: regenerateNetlessToken
  } = useNetlessCredentials(lessonId || '', videoRoomRole);

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

      console.log('🔄 Loading video room credentials for lesson:', lessonId);

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          agora_channel_name,
          agora_token,
          agora_uid,
          agora_rtm_token
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lessonData) {
        console.error('Lesson fetch error:', lessonError);
        throw new Error('Lesson not found');
      }

      console.log('📚 Lesson data loaded:', lessonData.title);
      setLesson(lessonData);

      // Get tokens using the proper agora-integration edge function
      console.log('🔑 Fetching Agora credentials via edge function...');
      const credentials = await getTokens(lessonId, videoRoomRole);
      
      if (!credentials) {
        throw new Error('Failed to get Agora credentials from edge function');
      }

      console.log('✅ Agora credentials received:', {
        appId: credentials.appId?.substring(0, 8) + '...',
        channelName: credentials.channelName,
        uid: credentials.uid,
        hasRtcToken: !!credentials.rtcToken,
        hasNetless: !!credentials.netlessRoomUuid,
        tokenLength: credentials.rtcToken?.length
      });
      
      setAgoraCredentials(credentials);
    } catch (error: any) {
      console.error('❌ Error loading video room:', error);
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
      console.log('🔄 Regenerating tokens via edge function...');
      const credentials = await regenerateTokens(lessonId, videoRoomRole);
      
      if (credentials) {
        setAgoraCredentials(credentials);
        setError(null);
        toast.success('Credentials regenerated successfully');
        
        // Refresh lesson data to get updated tokens
        await loadVideoRoom();
      }
    } catch (error: any) {
      console.error('❌ Error regenerating tokens:', error);
      toast.error('Failed to regenerate credentials');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLeaveRoom = () => {
    navigate('/calendar');
  };

  // Show loading state while either Agora or Netless credentials are loading
  if (isLoading || isLoadingNetless) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-gray-600 font-medium">Connecting to video conference...</p>
            <p className="text-sm text-gray-500 mt-1">Lesson: {lesson?.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {isLoadingNetless ? 'Loading whiteboard...' : 'Getting credentials from Agora...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson || !agoraCredentials) {
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
              <p><strong>Lesson:</strong> {lessonId}</p>
              <p><strong>User Role:</strong> {videoRoomRole}</p>
              {netlessError && <p><strong>Whiteboard:</strong> {netlessError}</p>}
            </div>
            <div className="space-y-3 mt-6">
              <Button onClick={handleRetry} className="w-full" disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Regenerating...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
              <Button onClick={handleRegenerateTokens} variant="outline" className="w-full" disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Regenerating Tokens...
                  </>
                ) : (
                  'Regenerate Tokens'
                )}
              </Button>
              {netlessError && (
                <Button onClick={regenerateNetlessToken} variant="outline" className="w-full">
                  Fix Whiteboard
                </Button>
              )}
              <Button onClick={() => navigate('/calendar')} variant="outline" className="w-full">
                Go Back to Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🎉 Rendering video room with edge function credentials:', {
    appId: agoraCredentials.appId?.substring(0, 8) + '...',
    channel: agoraCredentials.channelName,
    uid: agoraCredentials.uid,
    role: videoRoomRole,
    tokenValid: !!agoraCredentials.rtcToken,
    hasNetless: !!netlessCredentials,
    usingEdgeFunction: true
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
