
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
import { toast } from 'sonner';
import VideoRoomHeader from './VideoRoomHeader';
import VideoControls from './VideoControls';
import VideoPanel from './VideoPanel';
import Whiteboard from './Whiteboard';

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
  const [isJoined, setIsJoined] = useState(false);

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

    return () => {
      // Cleanup when component unmounts
      setIsJoined(false);
    };
  }, []);

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

  const handleLeave = () => {
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Whiteboard Area */}
        <div className="flex-1 p-6">
          <Whiteboard isReadOnly={userRole === 'student'} />
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

      {/* Controls */}
      <VideoControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
      />
    </div>
  );
};

export default AgoraVideoRoom;
