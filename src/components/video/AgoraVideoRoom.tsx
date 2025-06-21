
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
import VideoPanel from './VideoPanel';
import EnhancedVideoControls from './EnhancedVideoControls';
import AgoraChatPanel from './AgoraChatPanel';
import FastboardWhiteboard from './FastboardWhiteboard';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Presentation } from 'lucide-react';

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
  const [whiteboardVisible, setWhiteboardVisible] = useState(true);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  usePublish([localMicrophoneTrack, localCameraTrack]);

  useJoin({
    appid: appId,
    channel: channel,
    token: token,
    uid: uid,
  }, calling);

  useEffect(() => {
    audioTracks.map((track, index) => {
      console.log(`Playing audio track ${index}`);
      track.play();
    });
  }, [audioTracks]);

  useEffect(() => {
    setCalling(true);
    return () => {
      setCalling(false);
    };
  }, []);

  const toggleMic = () => setMicOn(prev => !prev);
  const toggleCamera = () => setCameraOn(prev => !prev);
  const toggleChat = () => setChatOpen(prev => !prev);
  const toggleParticipants = () => setParticipantsOpen(prev => !prev);
  const toggleWhiteboard = () => setWhiteboardVisible(prev => !prev);
  const toggleScreenShare = () => setIsScreenSharing(prev => !prev);
  const toggleRecording = () => setIsRecording(prev => !prev);

  const handleLeave = () => {
    setCalling(false);
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
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Video area */}
          <div className="flex-1 flex">
            {/* Video panel */}
            <div className={`${whiteboardVisible ? 'w-1/2' : 'flex-1'} bg-black relative`}>
              <VideoPanel
                localCameraTrack={localCameraTrack}
                remoteUsers={remoteUsers}
                isAudioEnabled={micOn}
                isVideoEnabled={cameraOn}
                userRole={userRole}
              />
            </div>

            {/* Whiteboard area */}
            {whiteboardVisible && (
              <div className="w-1/2 flex">
                <FastboardWhiteboard
                  isReadOnly={userRole === 'student'}
                  userRole={userRole}
                  roomUuid={netlessCredentials?.roomUuid}
                  roomToken={netlessCredentials?.roomToken}
                  appIdentifier={netlessCredentials?.appIdentifier}
                  userId={uid.toString()}
                />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4">
            <EnhancedVideoControls
              isAudioEnabled={micOn}
              isVideoEnabled={cameraOn}
              isScreenSharing={isScreenSharing}
              isRecording={isRecording}
              userRole={userRole}
              onToggleAudio={toggleMic}
              onToggleVideo={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onToggleRecording={toggleRecording}
              onManageParticipants={toggleParticipants}
              onLeave={handleLeave}
            />
            
            {/* Additional controls */}
            <div className="flex justify-center gap-2 mt-2">
              <Button
                variant={whiteboardVisible ? "default" : "outline"}
                size="sm"
                onClick={toggleWhiteboard}
              >
                <Presentation className="h-4 w-4 mr-2" />
                Whiteboard
              </Button>
              
              <Button
                variant={chatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
              
              <Button
                variant={participantsOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleParticipants}
              >
                <Users className="h-4 w-4 mr-2" />
                Participants ({totalParticipants})
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
              userId={uid.toString()}
              userName={`User ${uid}`}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoRoom;
