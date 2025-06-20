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
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  // Enhanced debugging and error handling
  useEffect(() => {
    console.log('🔍 [DEBUG] Agora connection parameters:', {
      appId,
      channel,
      uid,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...',
      userRole,
      isJoined,
      connectionStatus
    });

    // Validate parameters
    if (!appId || appId.length !== 32) {
      console.error('❌ [ERROR] Invalid App ID:', { appId, length: appId?.length });
      setConnectionError(`Invalid App ID format (length: ${appId?.length}, expected: 32)`);
      setConnectionStatus('failed');
      return;
    }

    if (!token || token.length < 10) {
      console.error('❌ [ERROR] Invalid token:', { tokenLength: token?.length });
      setConnectionError('Invalid or missing token');
      setConnectionStatus('failed');
      return;
    }

    if (!channel) {
      console.error('❌ [ERROR] Missing channel name');
      setConnectionError('Missing channel name');
      setConnectionStatus('failed');
      return;
    }

    // Extract App ID from token for verification
    if (token && token.length >= 35) {
      const tokenAppId = token.substring(3, 35);
      if (tokenAppId !== appId) {
        console.error('❌ [ERROR] App ID mismatch:', {
          providedAppId: appId,
          tokenAppId,
          match: tokenAppId === appId
        });
        setConnectionError(`App ID mismatch: token contains ${tokenAppId.substring(0, 8)}... but using ${appId.substring(0, 8)}...`);
        setConnectionStatus('failed');
        return;
      } else {
        console.log('✅ [SUCCESS] App ID matches token');
      }
    }
  }, [appId, channel, token, uid]);

  // Setup event listeners with enhanced error handling
  useEffect(() => {
    if (!agoraEngine) return;

    const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      console.log('👤 [USER] User published:', user.uid, mediaType);
      try {
        await agoraEngine.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          console.log('📹 [VIDEO] Remote video track available for user:', user.uid);
        }
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      } catch (error) {
        console.error('❌ [ERROR] Failed to subscribe to user:', error);
      }
    };

    const handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
      console.log('👤 [USER] User unpublished:', user.uid, mediaType);
    };

    const handleConnectionStateChanged = (newState: string, reason: string) => {
      console.log('🔄 [CONNECTION] State changed:', { newState, reason });
      
      if (newState === 'CONNECTED') {
        setConnectionStatus('connected');
        setConnectionError(null);
        console.log('✅ [SUCCESS] Successfully connected to Agora');
      } else if (newState === 'FAILED' || newState === 'DISCONNECTED') {
        setConnectionStatus('failed');
        setConnectionError(`Connection ${newState.toLowerCase()}: ${reason}`);
        console.log('❌ [ERROR] Connection failed:', { newState, reason });
      }
    };

    const handleError = (error: any) => {
      console.error('❌ [AGORA-ERROR] SDK Error:', error);
      setConnectionError(`Agora SDK Error: ${error.message || error.code || 'Unknown error'}`);
      setConnectionStatus('failed');
      
      // Specific error handling
      if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
        setConnectionError('Invalid App ID - cannot connect to Agora servers. Please verify your Agora App ID is correct.');
      } else if (error.code === 'INVALID_VENDOR_KEY') {
        setConnectionError('Invalid vendor key - App ID not found in Agora system');
      } else if (error.code === 'TOKEN_EXPIRED') {
        setConnectionError('Token has expired - please refresh the page');
      }
    };

    // Set up event listeners
    agoraEngine.on('user-published', handleUserPublished);
    agoraEngine.on('user-unpublished', handleUserUnpublished);
    agoraEngine.on('connection-state-changed', handleConnectionStateChanged);
    agoraEngine.on('error', handleError);

    return () => {
      agoraEngine.off('user-published', handleUserPublished);
      agoraEngine.off('user-unpublished', handleUserUnpublished);
      agoraEngine.off('connection-state-changed', handleConnectionStateChanged);
      agoraEngine.off('error', handleError);
    };
  }, [agoraEngine]);

  // Initialize connection
  useEffect(() => {
    console.log('🚀 [INIT] Initializing Agora Video Room with credentials:', {
      appId: appId?.substring(0, 8) + '...',
      channel,
      uid,
      userRole,
      tokenValid: !!token && token.length > 10
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
      toast.error(`Failed to connect: ${connectionError || 'Unknown error'}`);
    }
  }, [connectionStatus, connectionError]);

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

  const handleRetryConnection = useCallback(() => {
    console.log('🔄 [RETRY] Attempting to reconnect...');
    setConnectionStatus('connecting');
    setConnectionError(null);
    setIsJoined(false);
    
    // Wait a moment then try to rejoin
    setTimeout(() => {
      setIsJoined(true);
    }, 1000);
  }, []);

  const totalParticipants = remoteUsers.length + 1;

  // Show connection status with detailed error information
  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Connecting to video conference...</p>
          <p className="text-sm text-gray-500 mt-2">Channel: {channel}</p>
          <p className="text-xs text-gray-400 mt-1">App ID: {appId?.substring(0, 8)}...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Connection Failed
            </h3>
            <p className="text-red-600 mb-4">
              {connectionError || 'Failed to connect to video conference'}
            </p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Channel:</strong> {channel}</p>
              <p><strong>App ID:</strong> {appId?.substring(0, 8)}...</p>
              <p><strong>UID:</strong> {uid}</p>
              <p><strong>Token Length:</strong> {token?.length}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleRetryConnection}
              className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 font-medium"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => onLeave()}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 font-medium ml-3"
            >
              Go Back
            </button>
          </div>
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
