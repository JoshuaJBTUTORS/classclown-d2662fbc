
import React, { useState, useEffect } from 'react';
import {
  LocalVideoTrack,
  RemoteUser,
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
import VideoCard from './VideoCard';
import VideoControls from './VideoControls';

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

      {/* Video Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {/* Local Video */}
          <VideoCard
            userName={`You (${userRole === 'tutor' ? 'Teacher' : 'Student'})`}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isLocal={true}
          >
            {isVideoEnabled && localCameraTrack && (
              <LocalVideoTrack
                track={localCameraTrack}
                play={true}
                className="w-full h-full object-cover"
              />
            )}
          </VideoCard>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <VideoCard
              key={user.uid}
              userName={`Participant ${user.uid}`}
              isAudioEnabled={user.hasAudio}
              isVideoEnabled={user.hasVideo}
            >
              <RemoteUser user={user} />
            </VideoCard>
          ))}

          {/* Empty slots for better visual balance */}
          {Array.from({ length: Math.max(0, 6 - totalParticipants) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100"
            >
              <div className="text-center text-gray-400">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">+</span>
                </div>
                <p className="text-sm">Waiting for participant</p>
              </div>
            </div>
          ))}
        </div>
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
