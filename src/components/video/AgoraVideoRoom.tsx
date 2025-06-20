import React, { useState, useEffect, useCallback } from 'react';
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
  // State management
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Agora client and tracks
  const [agoraClient, setAgoraClient] = useState<any>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const [screenTrack, setScreenTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [rtmToken, setRtmToken] = useState<string>('');
  
  const { startRecording, stopRecording } = useAgora();

  // Debug logging utility
  const addDebugLog = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
    console.log('🐛 [AGORA-DEBUG]', logMessage);
    setDebugLogs(prev => [...prev.slice(-10), logMessage]); // Keep last 10 logs
  }, []);

  // Connection timeout handler
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      const timeout = setTimeout(() => {
        addDebugLog('❌ CONNECTION TIMEOUT after 10 seconds');
        setConnectionStatus('failed');
        setConnectionError('Connection timeout - Unable to connect to Agora servers after 10 seconds');
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [connectionStatus, addDebugLog]);

  // Initialize Agora client and connect
  useEffect(() => {
    let mounted = true;
    
    const initializeAgora = async () => {
      try {
        addDebugLog('🚀 STARTING Agora initialization', {
          appId: appId?.substring(0, 8) + '...',
          channel,
          uid,
          userRole,
          tokenLength: token?.length,
          tokenPrefix: token?.substring(0, 15) + '...'
        });

        // Validate parameters immediately
        if (!appId || appId.length !== 32) {
          throw new Error(`Invalid App ID format. Length: ${appId?.length}, Expected: 32`);
        }

        if (!token || token.length < 50) {
          throw new Error(`Invalid token format. Length: ${token?.length}, Expected: >50`);
        }

        if (!channel) {
          throw new Error('Missing channel name');
        }

        addDebugLog('✅ Parameters validated');

        // Create Agora client with enhanced configuration
        const client = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8',
          role: userRole === 'tutor' ? 'host' : 'audience'
        });

        if (!mounted) return;
        setAgoraClient(client);
        addDebugLog('✅ Agora client created', { mode: 'rtc', codec: 'vp8', role: userRole });

        // Set up comprehensive event listeners BEFORE joining
        client.on('connection-state-changed', (newState: string, reason: string) => {
          addDebugLog('🔄 Connection state changed', { newState, reason });
          
          if (newState === 'CONNECTED') {
            setConnectionStatus('connected');
            setConnectionError(null);
            addDebugLog('✅ Successfully connected to Agora');
            toast.success('Connected to video conference');
          } else if (newState === 'FAILED' || newState === 'DISCONNECTED') {
            setConnectionStatus('failed');
            const errorMsg = `Connection ${newState.toLowerCase()}: ${reason}`;
            setConnectionError(errorMsg);
            addDebugLog('❌ Connection failed', { newState, reason });
            toast.error(`Connection failed: ${reason}`);
          } else if (newState === 'CONNECTING') {
            setConnectionStatus('connecting');
            addDebugLog('🔄 Connection in progress...');
          }
        });

        client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
          addDebugLog('👤 User published', { uid: user.uid, mediaType });
          try {
            await client.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
              addDebugLog('📹 Remote video track subscribed', { uid: user.uid });
            }
            if (mediaType === 'audio') {
              user.audioTrack?.play();
              addDebugLog('🔊 Remote audio track playing', { uid: user.uid });
            }

            // Update remote users
            setRemoteUsers(prev => {
              const existing = prev.find(u => u.uid === user.uid);
              if (existing) {
                return prev.map(u => u.uid === user.uid ? user : u);
              } else {
                return [...prev, user];
              }
            });
          } catch (error) {
            addDebugLog('❌ Failed to subscribe to user', { uid: user.uid, error: error.message });
          }
        });

        client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
          addDebugLog('👤 User unpublished', { uid: user.uid, mediaType });
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('user-left', (user: any) => {
          addDebugLog('👤 User left', { uid: user.uid });
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('error', (error: any) => {
          addDebugLog('❌ Agora SDK Error', { 
            code: error.code, 
            message: error.message,
            details: error 
          });
          
          let userFriendlyError = `Agora Error: ${error.message || error.code || 'Unknown error'}`;
          
          // Specific error handling
          if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER') {
            userFriendlyError = 'Invalid App ID - cannot connect to Agora servers';
          } else if (error.code === 'INVALID_VENDOR_KEY') {
            userFriendlyError = 'Invalid App ID - not found in Agora system';
          } else if (error.code === 'TOKEN_EXPIRED') {
            userFriendlyError = 'Token has expired - please refresh';
          } else if (error.code === 'INVALID_TOKEN') {
            userFriendlyError = 'Invalid token format or configuration';
          }
          
          setConnectionError(userFriendlyError);
          setConnectionStatus('failed');
          toast.error(userFriendlyError);
        });

        addDebugLog('✅ Event listeners set up');

        // Create local tracks
        try {
          const [audioTrack, videoTrack] = await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
          ]);

          if (!mounted) {
            audioTrack?.close();
            videoTrack?.close();
            return;
          }

          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);
          addDebugLog('✅ Local tracks created');
        } catch (trackError) {
          addDebugLog('⚠️ Failed to create local tracks', { error: trackError.message });
          // Continue without local tracks - user can enable them later
        }

        // Join the channel with detailed logging
        addDebugLog('🔗 Attempting to join channel...', {
          appId: appId.substring(0, 8) + '...',
          channel,
          token: token.substring(0, 15) + '...',
          uid
        });

        const joinResult = await client.join(appId, channel, token, uid);
        
        if (!mounted) return;
        
        addDebugLog('✅ Successfully joined channel', { result: joinResult });

        // Publish local tracks if available
        if (localAudioTrack || localVideoTrack) {
          const tracksToPublish = [localAudioTrack, localVideoTrack].filter(Boolean);
          if (tracksToPublish.length > 0) {
            await client.publish(tracksToPublish);
            addDebugLog('✅ Local tracks published', { trackCount: tracksToPublish.length });
          }
        }

        setRtmToken(token); // Use RTC token as RTM token
        addDebugLog('🎉 Agora initialization complete');

      } catch (error: any) {
        if (!mounted) return;
        
        addDebugLog('❌ CRITICAL: Agora initialization failed', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
        
        setConnectionStatus('failed');
        setConnectionError(`Initialization failed: ${error.message}`);
        toast.error(`Failed to connect: ${error.message}`);
      }
    };

    initializeAgora();

    return () => {
      mounted = false;
      // Cleanup will be handled by handleLeave
    };
  }, [appId, channel, token, uid, userRole, addDebugLog]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      const newState = !prev;
      if (localAudioTrack) {
        localAudioTrack.setEnabled(newState);
      }
      toast.success(newState ? 'Microphone unmuted' : 'Microphone muted');
      return newState;
    });
  }, [localAudioTrack]);

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(prev => {
      const newState = !prev;
      if (localVideoTrack) {
        localVideoTrack.setEnabled(newState);
      }
      toast.success(newState ? 'Camera turned on' : 'Camera turned off');
      return newState;
    });
  }, [localVideoTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (!agoraClient) {
      toast.error('Video engine not ready');
      return;
    }

    try {
      if (!isScreenSharing) {
        const newScreenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });
        
        if (localVideoTrack) {
          await agoraClient.unpublish([localVideoTrack]);
        }
        await agoraClient.publish([newScreenTrack]);
        
        setScreenTrack(newScreenTrack);
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
      } else {
        if (screenTrack) {
          await agoraClient.unpublish([screenTrack]);
          screenTrack.close();
          setScreenTrack(null);
        }
        
        if (localVideoTrack) {
          await agoraClient.publish([localVideoTrack]);
        }
        
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [agoraClient, localVideoTrack, screenTrack, isScreenSharing]);

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
      addDebugLog('🚪 Leaving channel and cleaning up...');
      
      // Stop local tracks
      if (localAudioTrack) {
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      if (localVideoTrack) {
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (screenTrack) {
        screenTrack.close();
        setScreenTrack(null);
      }
      
      // Leave channel
      if (agoraClient) {
        await agoraClient.leave();
        addDebugLog('✅ Left Agora channel');
      }
      
      toast.success('Left video conference');
      onLeave();
    } catch (error) {
      addDebugLog('❌ Error during cleanup', { error: error.message });
      toast.error('Error leaving conference');
      onLeave();
    }
  }, [agoraClient, localAudioTrack, localVideoTrack, screenTrack, onLeave, addDebugLog]);

  const handleRetryConnection = useCallback(() => {
    addDebugLog('🔄 Manual retry requested');
    setConnectionStatus('connecting');
    setConnectionError(null);
    setDebugLogs([]);
    
    // Force remount by changing a key prop would be better, but for now:
    window.location.reload();
  }, [addDebugLog]);

  const totalParticipants = remoteUsers.length + 1;

  // Show detailed connection status
  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium mb-4">Connecting to video conference...</p>
          
          <div className="bg-white rounded-lg p-4 text-sm text-left">
            <h4 className="font-semibold mb-2">Connection Details:</h4>
            <div className="space-y-1 text-gray-600">
              <p><strong>Channel:</strong> {channel}</p>
              <p><strong>App ID:</strong> {appId?.substring(0, 8)}...</p>
              <p><strong>UID:</strong> {uid}</p>
              <p><strong>Token:</strong> {token?.substring(0, 15)}...</p>
              <p><strong>Role:</strong> {userRole}</p>
            </div>
            
            {debugLogs.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold mb-2">Debug Logs:</h5>
                <div className="bg-gray-100 rounded p-2 max-h-32 overflow-y-auto text-xs">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Connection will timeout after 10 seconds if unsuccessful
          </p>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Connection Failed
            </h3>
            <p className="text-red-600 mb-4">
              {connectionError || 'Failed to connect to video conference'}
            </p>
            
            <div className="bg-white rounded p-4 text-sm text-left">
              <h4 className="font-semibold mb-2">Connection Attempted:</h4>
              <div className="space-y-1 text-gray-600">
                <p><strong>Channel:</strong> {channel}</p>
                <p><strong>App ID:</strong> {appId?.substring(0, 8)}... (Length: {appId?.length})</p>
                <p><strong>UID:</strong> {uid}</p>
                <p><strong>Token Length:</strong> {token?.length}</p>
                <p><strong>Role:</strong> {userRole}</p>
              </div>
              
              {debugLogs.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-semibold mb-2">Debug Logs:</h5>
                  <div className="bg-gray-100 rounded p-2 max-h-40 overflow-y-auto text-xs">
                    {debugLogs.map((log, index) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))}
                  </div>
                </div>
              )}
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

  // Successfully connected - render the video room
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Debug indicator */}
      <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-800 px-3 py-2 rounded text-sm font-medium">
        🐛 DEBUG MODE: Connection Successful
      </div>

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
          localCameraTrack={localVideoTrack}
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
