
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{lessonTitle}</h1>
          <p className="text-sm text-gray-300">
            {userRole === 'tutor' ? 'Teaching' : 'Attending'} • Channel: {channel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>{remoteUsers.length + 1} participants</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Local Video */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">
                You ({userRole === 'tutor' ? 'Teacher' : 'Student'})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {isVideoEnabled && localCameraTrack ? (
                  <LocalVideoTrack
                    track={localCameraTrack}
                    play={true}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-gray-700 rounded-full p-8">
                      <Video className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <Card key={user.uid} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">
                  Participant {user.uid}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <RemoteUser user={user} />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty slots when no remote users */}
          {remoteUsers.length === 0 && (
            <Card className="bg-gray-800 border-gray-700 border-dashed">
              <CardContent className="p-8 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>Waiting for others to join...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleLeave}
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoRoom;
