
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNetlessCredentials } from '@/hooks/useNetlessCredentials';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import AgoraVideoRoom from '@/components/video/AgoraVideoRoom';
import VideoRoomLoading from '@/components/video/VideoRoomLoading';
import VideoRoomError from '@/components/video/VideoRoomError';
import { AgoraRTCProvider } from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  
  // Create Agora client following SDK documentation
  const [agoraClient] = useState(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as any
  );

  const {
    lesson,
    agoraCredentials,
    isLoading,
    error,
    isRegenerating,
    videoRoomRole,
    handleRetry,
    handleRegenerateTokens,
    handleLeaveRoom
  } = useVideoRoom(lessonId || '');
  
  // Use Netless credentials hook
  const { 
    credentials: netlessCredentials, 
    isLoading: isLoadingNetless, 
    error: netlessError,
    regenerateToken: regenerateNetlessToken
  } = useNetlessCredentials(lessonId || '', videoRoomRole);

  // Show loading state while either Agora or Netless credentials are loading
  if (isLoading || isLoadingNetless) {
    return (
      <VideoRoomLoading 
        lessonTitle={lesson?.title} 
        isLoadingNetless={isLoadingNetless}
      />
    );
  }

  if (error || !lesson || !agoraCredentials) {
    return (
      <VideoRoomError
        error={error}
        lessonId={lessonId}
        videoRoomRole={videoRoomRole}
        netlessError={netlessError}
        isRegenerating={isRegenerating}
        onRetry={handleRetry}
        onRegenerateTokens={handleRegenerateTokens}
        onRegenerateNetlessToken={regenerateNetlessToken}
        onGoBack={handleLeaveRoom}
      />
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
