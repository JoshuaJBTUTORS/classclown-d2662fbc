
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  studentCount,
  onError,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eduCore, setEduCore] = useState<any>(null);

  useEffect(() => {
    const initializeClassroom = async () => {
      try {
        console.log('Initializing Agora Flexible Classroom:', {
          roomId,
          userUuid,
          userName,
          userRole,
          appId: appId?.substring(0, 8) + '...'
        });

        // Dynamic import of Agora Education SDK
        const { EduClassroomConfig, EduRoleTypeEnum, EduRoomTypeEnum } = await import('agora-edu-core');
        
        if (!containerRef.current) {
          throw new Error('Container element not found');
        }

        const config = new EduClassroomConfig(
          appId,
          roomId,
          userUuid,
          userName,
          userRole === 'teacher' ? EduRoleTypeEnum.teacher : EduRoleTypeEnum.student,
          EduRoomTypeEnum.RoomSmallClass, // Use small class room type
          rtmToken
        );

        // Initialize the classroom
        const { launch } = await import('agora-edu-core');
        
        const classroom = await launch(containerRef.current, config);
        setEduCore(classroom);
        
        console.log('Agora Flexible Classroom initialized successfully');
        toast.success('Classroom connected successfully');
        setIsLoading(false);

      } catch (error: any) {
        console.error('Failed to initialize Agora Flexible Classroom:', error);
        const errorMessage = error.message || 'Failed to initialize classroom';
        setError(errorMessage);
        onError?.(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      }
    };

    initializeClassroom();

    // Cleanup function
    return () => {
      if (eduCore) {
        try {
          eduCore.destroy?.();
        } catch (error) {
          console.warn('Error destroying classroom:', error);
        }
      }
    };
  }, [roomId, userUuid, userName, userRole, rtmToken, appId, onError]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">
            Classroom Error
          </div>
          <p className="text-gray-600 max-w-md">
            {error}
          </p>
          <Button onClick={onClose} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit
            </Button>
            {lessonTitle && (
              <h1 className="text-lg font-semibold text-gray-900">{lessonTitle}</h1>
            )}
          </div>
          {studentCount && studentCount > 0 && (
            <div className="text-sm text-gray-600">
              Expected students: {studentCount}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div className="text-lg font-medium text-gray-900">
              Connecting to classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing Agora Flexible Classroom
            </div>
          </div>
        </div>
      )}

      {/* Classroom container */}
      <div 
        ref={containerRef}
        className="w-full h-full pt-16"
        style={{ 
          height: 'calc(100vh - 4rem)',
          width: '100vw'
        }}
      />
    </div>
  );
};

export default AgoraFlexibleClassroom;
