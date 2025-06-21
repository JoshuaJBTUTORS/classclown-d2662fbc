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
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Video area */}
          <div className="flex-1 flex">
            {/* Video panel */}
            <div className={`${whiteboardVisible ? 'w-1/2' : 'flex-1'} bg-black relative`}>
              <VideoPanel>
                <div className="grid grid-cols-2 gap-2 h-full p-4">
                  {/* Local user */}
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <LocalUser
                      audioTrack={localMicrophoneTrack}
                      videoTrack={localCameraTrack}
                      cameraOn={cameraOn}
                      micOn={micOn}
                      playAudio={false}
                      playVideo={cameraOn}
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                      You ({userRole})
                    </div>
                  </div>

                  {/* Remote users */}
                  {remoteUsers.map((user) => (
                    <div key={user.uid} className="relative bg-gray-800 rounded-lg overflow-hidden">
                      <RemoteUser user={user} />
                      <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        User {user.uid}
                      </div>
                    </div>
                  ))}
                </div>
              </VideoPanel>
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
              micOn={micOn}
              cameraOn={cameraOn}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onLeave={handleLeave}
              userRole={userRole}
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
              appId={appId}
              userId={uid.toString()}
              userRole={userRole}
              onClose={toggleChat}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoRoom;
