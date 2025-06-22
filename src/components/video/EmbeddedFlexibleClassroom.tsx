
import React from 'react';
import AgoraFlexibleClassroom from './AgoraFlexibleClassroom';

interface EmbeddedFlexibleClassroomProps {
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

const EmbeddedFlexibleClassroom: React.FC<EmbeddedFlexibleClassroomProps> = (props) => {
  return <AgoraFlexibleClassroom {...props} />;
};

export default EmbeddedFlexibleClassroom;
