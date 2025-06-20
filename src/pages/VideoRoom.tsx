
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

      console.log('🧪 [TEST] Using FRESH official Agora token for correct channel');

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

      console.log('Lesson data loaded:', lessonData);
      setLesson(lessonData);

      // TEST: Use the FRESH official Agora token for the correct channel
      const freshOfficialToken = '007eJxSYAjb6fWJdZfXXmv2fd83C5WXr9z+XMgp48sHC5WXr9z+XMgp48sHC87nVRles38rMBhZmhoYJpslmRokG5iYWyRaGCeZJBukGRibpRoamZkbfJgTmtEQyMjQYl/OzMjAyMDCwMgA4jOBSWYwyQImtRlyUouL8/PiTU2STBJTLCzjDYxTTeJNUlOM4i3NDU3ijY0NLVOTTJIMjc3TGBgAAQAA///pTS1a';
      
      // Create test credentials with FRESH token for exact channel match
      const testCredentials = {
        appId: '29501c6b50c04f60a84c1ec705a7a67d', // Your Agora App ID
        channelName: `lesson_${lessonId.replace(/-/g, '_')}`, // This should be: lesson_54b4ad89_03e4_4ed2_9714_3319eb4b137f
        rtcToken: freshOfficialToken,
        uid: Math.floor(Math.random() * 1000000) + 1000,
        rtmToken: freshOfficialToken, // Using same token for RTM for testing
      };

      console.log('🧪 [TEST] Using FRESH official Agora token for exact channel:', {
        appId: testCredentials.appId.substring(0, 8) + '...',
        channelName: testCredentials.channelName,
        uid: testCredentials.uid,
        freshTokenLength: freshOfficialToken.length,
        tokenPrefix: freshOfficialToken.substring(0, 20) + '...',
        channelMatch: testCredentials.channelName === 'lesson_54b4ad89_03e4_4ed2_9714_3319eb4b137f'
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

  // Show loading state while either Agora or Netless credentials are loading
  if (isLoading || isLoadingNetless) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-gray-600 font-medium">🧪 Testing FRESH official Agora token...</p>
            <p className="text-sm text-gray-500 mt-1">Channel: {lesson?.title}</p>
            <p className="text-xs text-gray-400 mt-1">
              {isLoadingNetless ? 'Loading whiteboard...' : 'Fresh token for correct channel'}
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
              <p><strong>🧪 TEST MODE:</strong> Using FRESH official Agora token</p>
              <p><strong>Lesson:</strong> {lessonId}</p>
              <p><strong>Channel:</strong> lesson_54b4ad89_03e4_4ed2_9714_3319eb4b137f</p>
              {netlessError && <p><strong>Whiteboard:</strong> {netlessError}</p>}
            </div>
            <div className="space-y-3 mt-6">
              <Button onClick={handleRetry} className="w-full">
                Try Again
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

  console.log('🧪 [TEST] Rendering video room with FRESH official Agora token:', {
    appId: agoraCredentials.appId,
    channel: agoraCredentials.channelName,
    uid: agoraCredentials.uid,
    role: videoRoomRole,
    tokenValid: !!agoraCredentials.rtcToken,
    hasNetless: !!netlessCredentials,
    tokenIsFresh: true
  });

  return (
    <AgoraRTCProvider client={agoraClient}>
      <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded text-sm font-medium">
        🧪 TEST MODE: Using FRESH Official Agora Token
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
