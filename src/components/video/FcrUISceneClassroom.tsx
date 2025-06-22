
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AgoraEduSDK } from '../../web/CloudClass-Desktop/packages/agora-classroom-sdk/src/infra/api';
import { EduRoleTypeEnum, EduRoomTypeEnum, AgoraEduClassroomEvent } from 'agora-edu-core';

interface FcrUISceneClassroomProps {
  appId: string;
  rtmToken: string;
  channelName: string;
  uid: number;
  userName: string;
  userRole: 'teacher' | 'student';
  lessonTitle?: string;
  onClose: () => void;
}

const FcrUISceneClassroom: React.FC<FcrUISceneClassroomProps> = ({
  appId,
  rtmToken,
  channelName,
  uid,
  userName,
  userRole,
  lessonTitle,
  onClose
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const initializeClassroom = async () => {
      try {
        console.log('[AGORA_EDU_SDK] Initializing classroom...');
        
        // Configure the SDK
        AgoraEduSDK.config({
          appId,
          region: 'NA'
        });

        // Map user role to EduRoleTypeEnum
        const roleType = userRole === 'teacher' ? EduRoleTypeEnum.teacher : EduRoleTypeEnum.student;
        
        // Create launch option based on CloudClass Desktop pattern
        const launchOption = {
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roleType,
          roomType: EduRoomTypeEnum.RoomSmallClass, // Using small class type for flexible classroom
          roomName: lessonTitle || channelName,
          rtmToken,
          language: 'en' as const,
          duration: 60 * 60 * 2, // 2 hours
          courseWareList: [],
          pretest: false,
          listener: (evt: AgoraEduClassroomEvent) => {
            console.log('[AGORA_EDU_SDK] Classroom event:', evt);
            if (evt === AgoraEduClassroomEvent.Destroyed) {
              onClose();
            }
          }
        };

        console.log('[AGORA_EDU_SDK] Launch option prepared:', launchOption);

        // Launch the classroom
        AgoraEduSDK.launch(containerRef.current, launchOption);
        
        console.log('[AGORA_EDU_SDK] Classroom launched successfully');
        setIsLoading(false);
        toast.success('Classroom connected successfully');
        
      } catch (error: any) {
        console.error('[AGORA_EDU_SDK] Classroom initialization error:', error);
        setError(`Classroom Error: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
      }
    };

    initializeClassroom();

    // Cleanup function
    return () => {
      try {
        console.log('[AGORA_EDU_SDK] Cleaning up classroom');
      } catch (error) {
        console.error('[AGORA_EDU_SDK] Cleanup error:', error);
      }
    };
  }, [appId, rtmToken, channelName, uid, userName, userRole, lessonTitle, onClose]);

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
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Retry Loading
            </Button>
            <Button onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 relative overflow-hidden">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium text-gray-900">
              Loading Flexible Classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing Agora Education SDK
            </div>
          </div>
        </div>
      )}

      {/* Agora Education SDK Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
};

export default FcrUISceneClassroom;
