
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import { useFlexibleClassroom, FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import FlexibleClassroom from '@/components/video/FlexibleClassroom';
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
      // Get tutor ID from the lesson
      if (lesson?.tutor_id) {
        // Convert tutor UUID to a number (use hash of first 8 chars)
        const tutorHash = lesson.tutor_id.substring(0, 8);
        const tutorNumericId = parseInt(tutorHash, 16) % 100000;
        return 100000 + tutorNumericId; // Tutor range: 100000-199999
      }
      return 100001; // Fallback for tutors
    } else {
      // For students/parents, use the student ID
      if (studentContext) {
        return studentContext.studentId;
      }
      return 1; // Fallback for students
    }
  };

  useEffect(() => {
    const initializeClassroom = async () => {
      if (!lesson || !lessonId) return;

      try {
        console.log('Initializing Flexible Classroom for lesson:', lessonId);
        
        // Generate custom UID
        const customUID = await generateUID();
        
        // Get display name
        const displayName = getDisplayName();
        
        console.log('Creating classroom session:', {
          lessonId,
          videoRoomRole,
          customUID,
          displayName,
          studentContext
        });

        // Create classroom session
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

  // Show loading state
  if (isLoading || isCreatingSession) {
    return (
      <VideoRoomLoading 
        lessonTitle={lesson?.title} 
        isLoadingNetless={false}
      />
    );
  }

  // Show error state
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

  // Show Flexible Classroom if credentials are ready
  if (classroomCredentials) {
    console.log('🎉 Rendering Flexible Classroom with credentials:', {
      roomId: classroomCredentials.roomId,
      userRole: classroomCredentials.userRole,
      userName: classroomCredentials.userName,
      expectedStudentsCount: expectedStudents.length,
      studentContext,
      displayName: getDisplayName()
    });

    return (
      <FlexibleClassroom
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
