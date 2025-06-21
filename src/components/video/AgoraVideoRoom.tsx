import React, { useState, useRef, useEffect } from 'react';
import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteAudioTracks,
  useRemoteUsers,
} from 'agora-rtc-react';
import VideoRoomHeader from './VideoRoomHeader';
import VerticalVideoGrid from './VerticalVideoGrid';
import AgoraChatPanel from './AgoraChatPanel';
import FastboardWhiteboard from './FastboardWhiteboard';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Users, 
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Circle,
  Square
} from 'lucide-react';

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
  } | null;
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
  onLeave,
}) => {
  const [calling, setCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(userRole === 'tutor');
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Validate UID to ensure it's a valid number
  const validUid = Math.max(1, Math.floor(Math.abs(uid))) || Math.floor(Math.random() * 1000000) + 1000;

  console.log('AgoraVideoRoom - Using UID:', validUid, 'Original UID:', uid);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Only publish tracks if we're joined and tracks are ready
  const tracksToPublish = [];
  if (isJoined && localMicrophoneTrack && micOn) {
    tracksToPublish.push(localMicrophoneTrack);
  }
  if (isJoined && localCameraTrack && cameraOn) {
    tracksToPublish.push(localCameraTrack);
  }

  usePublish(tracksToPublish);

  const joinState = useJoin({
    appid: appId,
    channel: channel,
    token: token,
    uid: validUid,
  }, calling);

  // Track join state
  useEffect(() => {
    if (joinState && !isJoined) {
      console.log('Successfully joined Agora channel');
      setIsJoined(true);
    }
  }, [joinState, isJoined]);

  useEffect(() => {
    console.log('AgoraVideoRoom - Netless credentials:', {
      hasCredentials: !!netlessCredentials,
      roomUuid: netlessCredentials?.roomUuid ? netlessCredentials.roomUuid.substring(0, 8) + '...' : 'undefined',
      appIdentifier: netlessCredentials?.appIdentifier ? netlessCredentials.appIdentifier.substring(0, 8) + '...' : 'undefined',
      hasRoomToken: !!netlessCredentials?.roomToken,
      usingCorrectNetlessAppId: 'TORbYEt7EfCzGuPZ97oCJA/9M23Doi-qTMNAg'
    });
  }, [netlessCredentials]);

  useEffect(() => {
    audioTracks.map((track, index) => {
      console.log(`Playing audio track ${index}`);
      track.play();
    });
  }, [audioTracks]);

  useEffect(() => {
    console.log('Starting to join Agora room...');
    setCalling(true);
    return () => {
      console.log('Leaving Agora room...');
      setCalling(false);
      setIsJoined(false);
    };
  }, []);

  const toggleMic = () => setMicOn(prev => !prev);
  const toggleCamera = () => setCameraOn(prev => !prev);
  const toggleChat = () => setChatOpen(prev => !prev);
  const toggleParticipants = () => setParticipantsOpen(prev => !prev);
  const toggleScreenShare = () => setIsScreenSharing(prev => !prev);
  const toggleRecording = () => setIsRecording(prev => !prev);

  const handleLeave = () => {
    setCalling(false);
    setIsJoined(false);
    onLeave();
  };

  const totalParticipants = remoteUsers.length + 1;

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <VideoRoomHeader 
        lessonTitle={lessonTitle} 
        onLeave={handleLeave}
        participantCount={totalParticipants}
        userRole={userRole}
        isRecording={isRecording}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Video Grid */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-white text-sm font-medium">Participants ({totalParticipants})</h3>
          </div>
          <div className="flex-1">
            <VerticalVideoGrid
              localCameraTrack={localCameraTrack}
              remoteUsers={remoteUsers}
              isAudioEnabled={micOn}
              isVideoEnabled={cameraOn}
              userRole={userRole}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Whiteboard Area */}
          <div className="flex-1 flex">
            {netlessCredentials ? (
              <FastboardWhiteboard
                isReadOnly={userRole === 'student'}
                userRole={userRole}
                roomUuid={netlessCredentials.roomUuid}
                roomToken={netlessCredentials.roomToken}
                appIdentifier={netlessCredentials.appIdentifier}
                userId={validUid.toString()}
              />
            ) : (
              <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center m-4">
                <div className="text-center p-6">
                  <p className="text-gray-600 mb-2">Whiteboard Unavailable</p>
                  <p className="text-gray-500 text-sm">No whiteboard credentials available for this lesson</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-3">
              {/* Basic Controls */}
              <Button
                variant={micOn ? "default" : "destructive"}
                size="lg"
                onClick={toggleMic}
                className="rounded-full w-12 h-12 p-0"
              >
                {micOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant={cameraOn ? "default" : "destructive"}
                size="lg"
                onClick={toggleCamera}
                className="rounded-full w-12 h-12 p-0"
              >
                {cameraOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>

              {/* Screen Share */}
              <Button
                variant={isScreenSharing ? "default" : "ghost"}
                size="lg"
                onClick={toggleScreenShare}
                className="rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900"
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </Button>

              <div className="w-px h-8 bg-gray-200 mx-1" />
              
              {/* Chat */}
              <Button
                variant={chatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              
              {/* Participants */}
              <Button
                variant={participantsOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleParticipants}
              >
                <Users className="h-4 w-4 mr-2" />
                ({totalParticipants})
              </Button>

              {/* Tutor-only Controls */}
              {userRole === 'tutor' && (
                <>
                  <div className="w-px h-8 bg-gray-200 mx-1" />
                  
                  {/* Recording */}
                  <Button
                    variant={isRecording ? "destructive" : "ghost"}
                    size="lg"
                    onClick={toggleRecording}
                    className="rounded-full w-12 h-12 p-0"
                  >
                    {isRecording ? (
                      <Square className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </Button>
                </>
              )}

              <div className="w-px h-8 bg-gray-200 mx-2" />

              {/* Leave Button */}
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

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 bg-white border-l border-gray-200">
            <AgoraChatPanel 
              rtmToken=""
              channelName={channel}
              userId={validUid.toString()}
              userName={`User ${validUid}`}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoRoom;
