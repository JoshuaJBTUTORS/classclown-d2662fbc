
import React from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import AgoraFlexibleClassroom from './AgoraFlexibleClassroom';

interface SimpleFlexibleClassroomProps {
  credentials: FlexibleClassroomCredentials;
  onLeave: () => void;
  expectedStudents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

const SimpleFlexibleClassroom: React.FC<SimpleFlexibleClassroomProps> = ({
  credentials,
  onLeave,
  expectedStudents = []
}) => {
  const handleError = (error: string) => {
    console.error('Classroom error:', error);
  };

  return (
    <AgoraFlexibleClassroom
      roomId={credentials.roomId}
      userUuid={credentials.userUuid}
      userName={credentials.userName}
      userRole={credentials.userRole}
      rtmToken={credentials.rtmToken}
      appId={credentials.appId}
      lessonTitle={credentials.lessonTitle}
      studentCount={expectedStudents.length}
      onError={handleError}
      onClose={onLeave}
    />
  );
};

export default SimpleFlexibleClassroom;
