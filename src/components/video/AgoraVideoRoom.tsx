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
import ScreenShareDisplay from './ScreenShareDisplay';
import { useScreenShare } from '@/hooks/useScreenShare';
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

interface StudentContext {
  studentId: number;
  studentName: string;
  isParentJoin: boolean;
}

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
  expectedStudents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  studentContext?: StudentContext | null;
  displayName?: string;
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
  expectedStudents = [],
  studentContext,
  displayName,
  onLeave,
}) => {
  const [calling, setCalling] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(userRole === 'tutor');
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Validate UID to ensure it's a valid number
  const validUid = Math.max(1, Math.floor(Math.abs(uid))) || Math.floor(Math.random() * 1000000) + 1000;

  console.log('AgoraVideoRoom - Using UID:', validUid, 'Original UID:', uid, 'Student Context:', studentContext);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  const joinState = useJoin({
    appid: appId,
    channel: channel,
    token: token,
    uid: validUid,
  }, calling);

  // Extract the actual client from the join state
  const client = joinState?.data || null;

  // Screen sharing hook - pass the client
  const { 
    isScreenSharing, 
    isScreenShareLoading,
    isScreenSharePaused,
    startScreenShare, 
    stopScreenShare,
    getScreenTracks,
    attemptScreenShareRecovery
  } = useScreenShare({ client });

  // Get screen tracks
  const { screenVideoTrack, screenAudioTrack } = getScreenTracks();

  // Publish tracks when joined and ready
  const tracksToPublish = [];
  if (localMicrophoneTrack && micOn) {
    tracksToPublish.push(localMicrophoneTrack);
  }
  if (localCameraTrack && cameraOn && !isScreenSharing) {
    tracksToPublish.push(localCameraTrack);
  }
  if (screenVideoTrack && isScreenSharing) {
    tracksToPublish.push(screenVideoTrack);
  }
  if (screenAudioTrack && isScreenSharing) {
    tracksToPublish.push(screenAudioTrack);
  }

  usePublish(tracksToPublish);

  // Track join state
  useEffect(() => {
    if (joinState && !isJoined) {
      console.log('Successfully joined Agora channel with UID:', validUid);
      setIsJoined(true);
    }
  }, [joinState, isJoined, validUid]);

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
      // Clean up screen share when leaving
      if (isScreenSharing) {
        stopScreenShare();
      }
    };
  }, []);

  const toggleMic = () => setMicOn(prev => !prev);
  const toggleCamera = () => setCameraOn(prev => !prev);
  const toggleChat = () => setChatOpen(prev => !prev);
  const toggleParticipants = () => setParticipantsOpen(prev => !prev);
  const toggleRecording = () => setIsRecording(prev => !prev);

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const handleManualRecovery = async () => {
    await attemptScreenShareRecovery();
  };

  const handleLeave = () => {
    setCalling(false);
    setIsJoined(false);
    if (isScreenSharing) {
      stopScreenShare();
    }
    onLeave();
  };

  const totalExpectedParticipants = expectedStudents.length + 1; // +1 for tutor/current user
  const currentParticipants = remoteUsers.length + 1;

  const getLocalUserName = () => {
    if (displayName) {
      return displayName;
    }
    if (isScreenSharing) {
      return `You (${userRole})`;
    }
    return `You (${userRole})`;
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <VideoRoomHeader 
        lessonTitle={lessonTitle} 
        onLeave={handleLeave}
        participantCount={currentParticipants}
        expectedParticipantCount={totalExpectedParticipants}
        userRole={userRole}
        isRecording={isRecording}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area - Conditionally show Screen Share or Whiteboard */}
        <div className="flex-1 flex flex-col">
          {/* Tab Switch Warning for Screen Sharing */}
          {isScreenSharePaused && (
            <div className="bg-yellow-600 text-white px-4 py-2 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>Screen sharing paused due to tab switch</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRecovery}
                className="bg-transparent border-white text-white hover:bg-white hover:text-yellow-600"
              >
                Restore
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex">
            {isScreenSharing && screenVideoTrack ? (
              <ScreenShareDisplay
                screenVideoTrack={screenVideoTrack}
                userName={getLocalUserName()}
              />
            ) : netlessCredentials ? (
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
                disabled={isScreenSharing}
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
                onClick={handleScreenShare}
                disabled={isScreenShareLoading}
                className={`rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900 ${
                  isScreenSharePaused ? 'ring-2 ring-yellow-500' : ''
                }`}
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
                ({currentParticipants}/{totalExpectedParticipants})
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

        {/* Right Sidebar - Video Grid */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-white text-sm font-medium">
              Participants ({currentParticipants}/{totalExpectedParticipants})
            </h3>
          </div>
          <div className="flex-1">
            <VerticalVideoGrid
              localCameraTrack={localCameraTrack}
              remoteUsers={remoteUsers}
              isAudioEnabled={micOn}
              isVideoEnabled={cameraOn}
              userRole={userRole}
              expectedStudents={expectedStudents}
              studentContext={studentContext}
              displayName={getLocalUserName()}
              currentUID={validUid}
              isScreenSharing={isScreenSharing}
            />
          </div>
        </div>

        {/* Chat panel - Opens from the far right */}
        {chatOpen && (
          <div className="w-80 bg-white border-l border-gray-200">
            <AgoraChatPanel 
              rtmToken=""
              channelName={channel}
              userId={validUid.toString()}
              userName={displayName || `User ${validUid}`}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoRoom;
