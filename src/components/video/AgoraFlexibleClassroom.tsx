
import React from 'react';
import FcrUISceneClassroom from './FcrUISceneClassroom';

interface AgoraFlexibleClassroomProps {
  roomId: string;
  userUuid: string;
  userName: string;
  userRole: 'teacher' | 'student';
  rtmToken: string;
  appId: string;
  lessonTitle?: string;
  studentCount?: number;
  onError?: (error: string) => void;
  onClose: () => void;
}

const AgoraFlexibleClassroom: React.FC<AgoraFlexibleClassroomProps> = ({
  roomId,
  userUuid,
  userName,
  userRole,
  rtmToken,
  appId,
  lessonTitle,
  onClose
}) => {
  // Convert userUuid to number for Agora
  const uid = parseInt(userUuid) || Math.floor(Math.random() * 1000000);

  return (
    <FcrUISceneClassroom
      appId={appId}
      rtmToken={rtmToken}
      channelName={roomId}
      uid={uid}
      userName={userName}
      userRole={userRole}
      lessonTitle={lessonTitle}
      onClose={onClose}
    />
  );
};

export default AgoraFlexibleClassroom;
