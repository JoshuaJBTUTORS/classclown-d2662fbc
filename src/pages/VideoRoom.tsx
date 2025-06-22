
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import { useFlexibleClassroom, FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import SimpleFlexibleClassroom from '@/components/video/SimpleFlexibleClassroom';
import VideoRoomLoading from '@/components/video/VideoRoomLoading';
import VideoRoomError from '@/components/video/VideoRoomError';

const VideoRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [classroomCredentials, setClassroomCredentials] = useState<FlexibleClassroomCredentials | null>(null);
  const [classroomError, setClassroomError] = useState<string | null>(null);

  const {
    lesson,
    expectedStudents,
    studentContext,
    isLoading,
    error,
    videoRoomRole,
    handleRetry,
    handleLeaveRoom,
    getDisplayName
  } = useVideoRoom(lessonId || '');

  const { createClassroomSession, isLoading: isCreatingSession } = useFlexibleClassroom();

  // Generate deterministic UID based on role and context
  const generateUID = async () => {
    if (videoRoomRole === 'tutor') {
      if (lesson?.tutor_id) {
        const tutorHash = lesson.tutor_id.substring(0, 8);
        const tutorNumericId = parseInt(tutorHash, 16) % 100000;
        return 100000 + tutorNumericId;
      }
      return 100001;
    } else {
      if (studentContext) {
        return studentContext.studentId;
      }
      return 1;
    }
  };

  useEffect(() => {
    const initializeClassroom = async () => {
      if (!lesson || !lessonId) return;

      try {
        console.log('Initializing simplified Flexible Classroom for lesson:', lessonId);
        
        const customUID = await generateUID();
        const displayName = getDisplayName();
        
        console.log('Creating classroom session:', {
          lessonId,
          videoRoomRole,
          customUID,
          displayName
        });

        const credentials = await createClassroomSession(
          lessonId,
          videoRoomRole,
          customUID,
          displayName
        );

        if (credentials) {
          setClassroomCredentials(credentials);
          setClassroomError(null);
        } else {
          setClassroomError('Failed to create classroom session');
        }
      } catch (error: any) {
        console.error('Error initializing Flexible Classroom:', error);
        setClassroomError(error.message || 'Failed to initialize classroom');
      }
    };

    if (lesson && !isLoading && !error) {
      initializeClassroom();
    }
  }, [lesson, lessonId, isLoading, error, videoRoomRole, studentContext]);

  if (isLoading || isCreatingSession) {
    return (
      <VideoRoomLoading 
        lessonTitle={lesson?.title} 
        isLoadingNetless={false}
      />
    );
  }

  if (error || classroomError) {
    return (
      <VideoRoomError
        error={error || classroomError}
        lessonId={lessonId}
        videoRoomRole={videoRoomRole}
        netlessError={null}
        isRegenerating={false}
        onRetry={handleRetry}
        onRegenerateTokens={() => {
          setClassroomError(null);
          setClassroomCredentials(null);
        }}
        onRegenerateNetlessToken={() => {}}
        onGoBack={handleLeaveRoom}
      />
    );
  }

  if (classroomCredentials) {
    return (
      <SimpleFlexibleClassroom
        credentials={classroomCredentials}
        expectedStudents={expectedStudents}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <VideoRoomLoading 
      lessonTitle={lesson?.title} 
      isLoadingNetless={false}
    />
  );
};

export default VideoRoom;
