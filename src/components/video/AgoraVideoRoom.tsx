
import React, { useState, useEffect, useCallback } from 'react';
import {
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRTCClient,
  useRemoteAudioTracks,
  useRemoteUsers,
} from 'agora-rtc-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { toast } from 'sonner';
import VideoRoomHeader from './VideoRoomHeader';
import EnhancedVideoControls from './EnhancedVideoControls';
import VideoPanel from './VideoPanel';
import NetlessWhiteboard from './AgoraWhiteboard';
import AgoraChatPanel from './AgoraChatPanel';
import { useAgora } from '@/hooks/useAgora';

interface AgoraVideoRoomProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  userRole: 'tutor' | 'student';
  lessonTitle: string;
  netlessCredentials?: {
    roomUuid: string;
    roomToken: string;
    appIdentifier: string;
  };
  onLeave: () => void;
}

const AgoraVideoRoom: React.FC<AgoraVideoRoomProps> = ({
  appId,
  channel,
  token,
  uid,
  userRole,
  lessonTitle,
  netlessCredentials,
  onLeave
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [rtmToken, setRtmToken] = useState<string>('');
  const [screenTrack, setScreenTrack] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');

  const { startRecording, stopRecording } = useAgora();
  const agoraEngine = useRTCClient();
  
  // Create local tracks following Agora SDK patterns
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isAudioEnabled);
  const { localCameraTrack } = useLocalCameraTrack(isVideoEnabled);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Publish local tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Join the channel following Agora documentation
  useJoin({
    appid: appId,
    channel: channel,
    token: token,
    uid: uid,
  }, isJoined);

  // Setup event listeners following Agora best practices
  useEffect(() => {
    if (!agoraEngine) return;

    const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      console.log('User published:', user.uid, mediaType);
      await agoraEngine.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        console.log('Remote video track available for user:', user.uid);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };

    const handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
      console.log('User unpublished:', user.uid, mediaType);
    };

    const handleConnectionStateChanged = (newState: string, reason: string) => {
      console.log('Connection state changed:', newState, reason);
      if (newState === 'CONNECTED') {
        setConnectionStatus('connected');
      } else if (newState === 'FAILED' || newState === 'DISCONNECTED') {
        setConnectionStatus('failed');
      }
    };

    // Set up event listeners
    agoraEngine.on('user-published', handleUserPublished);
    agoraEngine.on('user-unpublished', handleUserUnpublished);
    agoraEngine.on('connection-state-changed', handleConnectionStateChanged);

    return () => {
      agoraEngine.off('user-published', handleUserPublished);
      agoraEngine.off('user-unpublished', handleUserUnpublished);
      agoraEngine.off('connection-state-changed', handleConnectionStateChanged);
    };
  }, [agoraEngine]);

  // Initialize connection
  useEffect(() => {
    console.log('Initializing Agora Video Room with credentials:', {
      appId,
      channel,
      uid,
      userRole
    });
    
    // Auto-join when component mounts
    setIsJoined(true);
    setRtmToken(token); // Use RTC token as RTM token for now
    
    toast.success('Connecting to video conference...');

    return () => {
      // Cleanup when component unmounts
      if (screenTrack) {
        screenTrack.close();
      }
    };
  }, [appId, channel, token, uid]);

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      toast.success('Successfully joined video conference');
    } else if (connectionStatus === 'failed') {
      toast.error('Failed to connect to video conference');
    }
  }, [connectionStatus]);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.forEach((track) => {
      track.play();
    });
  }, [audioTracks]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      const newState = !prev;
      toast.success(newState ? 'Microphone unmuted' : 'Microphone muted');
      return newState;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => {
      const newState = !prev;
      toast.success(newState ? 'Camera turned on' : 'Camera turned off');
      return newState;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!agoraEngine) {
      toast.error('Video engine not ready');
      return;
    }

    try {
      if (!isScreenSharing) {
        // Start screen sharing using AgoraRTC
        const newScreenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });
        
        // Unpublish camera and publish screen
        if (localCameraTrack) {
          await agoraEngine.unpublish([localCameraTrack]);
        }
        await agoraEngine.publish([newScreenTrack as any]);
        
        setScreenTrack(newScreenTrack);
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } else {
        // Stop screen sharing
        if (screenTrack) {
          await agoraEngine.unpublish([screenTrack]);
          screenTrack.close();
          setScreenTrack(null);
        }
        
        // Re-publish camera
        if (localCameraTrack) {
          await agoraEngine.publish([localCameraTrack]);
        }
        
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [agoraEngine, localCameraTrack, screenTrack, isScreenSharing]);

  const toggleRecording = useCallback(async () => {
    if (userRole !== 'tutor') {
      toast.error('Only tutors can control recording');
      return;
    }

    try {
      if (!isRecording) {
        const success = await startRecording(channel);
        if (success) {
          setIsRecording(true);
        }
      } else {
        const success = await stopRecording(channel);
        if (success) {
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to toggle recording');
    }
  }, [userRole, isRecording, startRecording, stopRecording, channel]);

  const handleManageParticipants = useCallback(() => {
    toast.info('Participant management coming soon');
  }, []);

  const handleLeave = useCallback(async () => {
    try {
      // Clean up local tracks
      if (screenTrack) {
        screenTrack.close();
        setScreenTrack(null);
      }
      
      // Leave the channel
      setIsJoined(false);
      
      toast.success('Left video conference');
      onLeave();
    } catch (error) {
      console.error('Error leaving channel:', error);
      toast.error('Error leaving conference');
      onLeave();
    }
  }, [screenTrack, onLeave]);

  const totalParticipants = remoteUsers.length + 1;

  // Show connection status
  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to video conference...</p>
          <p className="text-sm text-gray-500 mt-2">Channel: {channel}</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to connect to video conference</p>
          <button 
            onClick={() => setIsJoined(true)}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <VideoRoomHeader
        lessonTitle={lessonTitle}
        participantCount={totalParticipants}
        onLeave={handleLeave}
        userRole={userRole}
        isRecording={isRecording}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Chat Panel */}
        <AgoraChatPanel
          rtmToken={rtmToken}
          channelName={channel}
          userId={uid.toString()}
          userName={userRole === 'tutor' ? 'Teacher' : 'Student'}
          userRole={userRole}
        />

        {/* Whiteboard Area */}
        <div className="flex-1 p-6">
          <NetlessWhiteboard 
            isReadOnly={userRole === 'student'} 
            userRole={userRole}
            roomUuid={netlessCredentials?.roomUuid}
            roomToken={netlessCredentials?.roomToken}
            appIdentifier={netlessCredentials?.appIdentifier}
            userId={uid.toString()}
          />
        </div>

        {/* Video Panel */}
        <VideoPanel
          localCameraTrack={localCameraTrack}
          remoteUsers={remoteUsers}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          userRole={userRole}
        />
      </div>

      {/* Enhanced Controls */}
      <EnhancedVideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        userRole={userRole}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={toggleRecording}
        onManageParticipants={handleManageParticipants}
        onLeave={handleLeave}
      />
    </div>
  );
};

export default AgoraVideoRoom;
