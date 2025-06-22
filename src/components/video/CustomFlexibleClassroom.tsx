
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Users, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack 
} from 'agora-rtc-sdk-ng';
import FastboardWhiteboard from './FastboardWhiteboard';

interface CustomFlexibleClassroomProps {
  appId: string;
  rtcToken: string;
  rtmToken: string;
  channelName: string;
  uid: number;
  userName: string;
  userRole: 'teacher' | 'student';
  lessonTitle?: string;
  onClose: () => void;
}

const CustomFlexibleClassroom: React.FC<CustomFlexibleClassroomProps> = ({
  appId,
  rtcToken,
  rtmToken,
  channelName,
  uid,
  userName,
  userRole,
  lessonTitle,
  onClose
}) => {
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWhiteboard, setShowWhiteboard] = useState(true);

  const localVideoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      console.log('Initializing Agora RTC with:', {
        appId: appId.substring(0, 8) + '...',
        channelName,
        uid,
        userRole
      });

      // Create Agora client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(agoraClient);

      // Set up event listeners
      agoraClient.on('user-published', handleUserPublished);
      agoraClient.on('user-unpublished', handleUserUnpublished);
      agoraClient.on('user-joined', handleUserJoined);
      agoraClient.on('user-left', handleUserLeft);

      // Join the channel
      await agoraClient.join(appId, channelName, rtcToken, uid);
      console.log('Successfully joined channel');

      // Create and publish local tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish tracks
      await agoraClient.publish([videoTrack, audioTrack]);
      console.log('Successfully published local tracks');

      setIsJoined(true);
      setIsLoading(false);
      toast.success('Connected to classroom');

    } catch (error: any) {
      console.error('Failed to initialize Agora:', error);
      toast.error(`Failed to join classroom: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    if (!client) return;

    await client.subscribe(user, mediaType);
    console.log('Subscribed to user:', user.uid, mediaType);

    if (mediaType === 'video' && user.videoTrack) {
      const remoteVideoContainer = document.getElementById(`remote-${user.uid}`);
      if (remoteVideoContainer) {
        user.videoTrack.play(remoteVideoContainer);
      }
    }

    if (mediaType === 'audio' && user.audioTrack) {
      user.audioTrack.play();
    }

    setRemoteUsers(prev => {
      const existingIndex = prev.findIndex(u => u.uid === user.uid);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = user;
        return updated;
      }
      return [...prev, user];
    });
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
    console.log('User unpublished:', user.uid, mediaType);
  };

  const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
    console.log('User joined:', user.uid);
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    console.log('User left:', user.uid);
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };

  const toggleVideo = async () => {
    if (!localVideoTrack) return;

    if (isVideoEnabled) {
      await localVideoTrack.setEnabled(false);
      setIsVideoEnabled(false);
      toast.info('Camera turned off');
    } else {
      await localVideoTrack.setEnabled(true);
      setIsVideoEnabled(true);
      toast.info('Camera turned on');
    }
  };

  const toggleAudio = async () => {
    if (!localAudioTrack) return;

    if (isAudioEnabled) {
      await localAudioTrack.setEnabled(false);
      setIsAudioEnabled(false);
      toast.info('Microphone muted');
    } else {
      await localAudioTrack.setEnabled(true);
      setIsAudioEnabled(true);
      toast.info('Microphone unmuted');
    }
  };

  const cleanup = async () => {
    try {
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (client && isJoined) {
        await client.leave();
      }
      console.log('Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const handleLeave = async () => {
    await cleanup();
    onClose();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-white text-lg">Connecting to Classroom...</div>
          <div className="text-gray-400 text-sm">Initializing Audio & Video</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Leave
          </Button>
          <h1 className="text-white font-semibold">{lessonTitle || 'Classroom'}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">
            <Users className="h-4 w-4 inline mr-1" />
            {remoteUsers.length + 1} participants
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local Video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <div
                  ref={localVideoRef}
                  className="w-full h-full"
                  style={{ minHeight: '200px' }}
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {userName} ({userRole})
                </div>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Remote Videos */}
              {remoteUsers.map(user => (
                <div key={user.uid} className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <div
                    id={`remote-${user.uid}`}
                    className="w-full h-full"
                    style={{ minHeight: '200px' }}
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    User {user.uid}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-12 h-12 p-0"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-12 h-12 p-0"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className="rounded-full w-12 h-12 p-0"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Whiteboard Section */}
        {showWhiteboard && (
          <div className="w-1/3 min-w-[400px] border-l border-gray-700">
            <div className="h-full">
              <FastboardWhiteboard
                userRole={userRole === 'teacher' ? 'tutor' : 'student'}
                userId={uid.toString()}
                isReadOnly={userRole === 'student'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFlexibleClassroom;
