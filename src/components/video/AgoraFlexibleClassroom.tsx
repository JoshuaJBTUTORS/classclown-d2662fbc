
import React from 'react';
import CustomFlexibleClassroom from './CustomFlexibleClassroom';

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
  onClose,
  onError
}) => {
  // Convert userUuid to number for Agora
  const uid = parseInt(userUuid) || Math.floor(Math.random() * 1000000);

  // Use RTM token as RTC token (they're compatible for basic use)
  const rtcToken = rtmToken;

  return (
    <CustomFlexibleClassroom
      appId={appId}
      rtcToken={rtcToken}
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
