
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  AgoraEduSDK,
  EduRoleTypeEnum,
  EduRoomTypeEnum,
  Platform,
  AgoraEduClassroomEvent
} from 'agora-edu-core';

interface UIBuilderClassroomProps {
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

const UIBuilderClassroom: React.FC<UIBuilderClassroomProps> = ({
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

  useEffect(() => {
    const initializeClassroom = async () => {
      try {
        console.log('[DEBUG] === UIBuilder Classroom Initialization (NPM) ===');
        console.log('[DEBUG] Classroom config:', {
          roomId,
          userUuid,
          userName,
          userRole,
          appId: appId?.substring(0, 8) + '...',
          rtmTokenPresent: !!rtmToken
        });
        
        if (!containerRef.current) {
          throw new Error('Container not available');
        }

        // Validate required parameters
        if (!rtmToken) {
          throw new Error('RTM token is required for classroom initialization');
        }
        if (!appId) {
          throw new Error('App ID is required for classroom initialization');
        }
        if (!roomId) {
          throw new Error('Room ID is required for classroom initialization');
        }

        console.log('[DEBUG] Configuring SDK...');
        AgoraEduSDK.config({
          appId,
          region: 'NA' // North America region
        });

        // Map user role
        const roleType = userRole === 'teacher' ? EduRoleTypeEnum.teacher : EduRoleTypeEnum.student;

        console.log('[DEBUG] Launching classroom with NPM SDK...');
        await AgoraEduSDK.launch(containerRef.current, {
          userUuid,
          userName,
          roleType,
          roomUuid: roomId,
          roomName: lessonTitle || roomId,
          roomType: EduRoomTypeEnum.RoomSmallClass, // Vocational/small interactive class
          rtmToken,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          courseWareList: [],
          pretest: false,
          platform: Platform.PC,
          listener: (evt: AgoraEduClassroomEvent) => {
            console.log('[DEBUG] UIBuilder classroom event:', evt);
            if (evt === AgoraEduClassroomEvent.Ready) {
              console.log('[DEBUG] UIBuilder classroom ready');
              setIsLoading(false);
              toast.success('Classroom connected successfully');
            } else if (evt === AgoraEduClassroomEvent.Destroyed) {
              console.log('[DEBUG] UIBuilder classroom destroyed');
              onClose();
            } else if (evt === AgoraEduClassroomEvent.NetworkConnectionLost) {
              console.error('[DEBUG] UIBuilder classroom network error');
              const errorMsg = 'Network connection lost';
              setError(errorMsg);
              onError?.(errorMsg);
              toast.error(`Classroom error: ${errorMsg}`);
            }
          }
        });

        console.log('[DEBUG] UIBuilder classroom launched successfully');
        
      } catch (error: any) {
        console.error('[DEBUG] Failed to initialize UIBuilder classroom:', error);
        setError(error.message);
        onError?.(error.message);
        setIsLoading(false);
        toast.error(`Failed to initialize classroom: ${error.message}`);
      }
    };

    initializeClassroom();

    // Cleanup
    return () => {
      console.log('[DEBUG] UIBuilder classroom cleanup');
    };
  }, [roomId, userUuid, userName, userRole, rtmToken, appId, lessonTitle, onError, onClose]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-lg font-medium">
            Classroom Error
          </div>
          <p className="text-gray-600">
            {error}
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Room: {roomId}</p>
            <p>User: {userName} ({userRole})</p>
            <p>Token: {rtmToken ? 'Present' : 'Missing'}</p>
          </div>
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
              Loading Interactive Classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing Agora Education SDK (NPM)
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

export default UIBuilderClassroom;
