
import React from 'react';
import UIBuilderClassroom from './UIBuilderClassroom';

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

const AgoraFlexibleClassroom: React.FC<AgoraFlexibleClassroomProps> = (props) => {
  return <UIBuilderClassroom {...props} />;
};

export default AgoraFlexibleClassroom;
