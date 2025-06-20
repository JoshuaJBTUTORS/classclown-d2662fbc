
import React, { useState, useEffect } from 'react';
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
import AgoraWhiteboard from './AgoraWhiteboard';
import AgoraChatPanel from './AgoraChatPanel';
import { useAgora } from '@/hooks/useAgora';

interface AgoraVideoRoomProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  userRole: 'tutor' | 'student';
  lessonTitle: string;
  onLeave: () => void;
}

const AgoraVideoRoom: React.FC<AgoraVideoRoomProps> = ({
  appId,
  channel,
  token,
  uid,
  userRole,
  lessonTitle,
  onLeave
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [rtmToken, setRtmToken] = useState<string>('');
  const [screenTrack, setScreenTrack] = useState<any>(null);

  const { startRecording, stopRecording } = useAgora();
  const agoraEngine = useRTCClient();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isAudioEnabled);
  const { localCameraTrack } = useLocalCameraTrack(isVideoEnabled);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Publish local tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Join the channel
  useJoin({
    appid: appId,
    channel: channel,
    token: token,
    uid: uid,
  }, isJoined);

  useEffect(() => {
    // Auto-join when component mounts
    setIsJoined(true);
    toast.success('Joined video conference');

    // For demo purposes, we'll use the RTC token as RTM token
    // In production, you'd get a separate RTM token from your backend
    setRtmToken(token);

    return () => {
      // Cleanup when component unmounts
      setIsJoined(false);
      if (screenTrack) {
        screenTrack.close();
      }
    };
  }, [token]);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.map((track) => track.play());
  }, [audioTracks]);

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.success(isAudioEnabled ? 'Microphone muted' : 'Microphone unmuted');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    toast.success(isVideoEnabled ? 'Camera turned off' : 'Camera turned on');
  };

  const toggleScreenShare = async () => {
    if (!agoraEngine) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing using AgoraRTC directly
        const newScreenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });
        
        if (localCameraTrack) {
          await agoraEngine.unpublish([localCameraTrack]);
        }
        await agoraEngine.publish([newScreenTrack]);
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
  };

  const toggleRecording = async () => {
    if (userRole !== 'tutor') return;

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
  };

  const handleManageParticipants = () => {
    // This would open a participant management dialog
    toast.info('Participant management coming soon');
  };

  const handleLeave = () => {
    if (screenTrack) {
      screenTrack.close();
    }
    setIsJoined(false);
    toast.success('Left video conference');
    onLeave();
  };

  const totalParticipants = remoteUsers.length + 1;

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
          <AgoraWhiteboard 
            isReadOnly={userRole === 'student'} 
            userRole={userRole}
            roomToken="demo-whiteboard-token"
            roomUuid="demo-whiteboard-room"
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
