
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { 
  EduClassroomConfig,
  EduRoleTypeEnum,
  EduRoomTypeEnum,
  EduRegion,
  Platform,
  AgoraEduClassroomEvent
} from 'agora-edu-core';

// Import AgoraEduSDK from the correct package
const AgoraEduSDK = require('agora-classroom-sdk').AgoraEduSDK;

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
    console.log('[DEBUG] === FcrUISceneClassroom Effect Started (NPM Approach) ===');
    console.log('[DEBUG] Props received:', {
      appId: appId?.substring(0, 8) + '...',
      rtmTokenPresent: !!rtmToken,
      channelName,
      uid,
      userName,
      userRole,
      lessonTitle
    });

    const initializeClassroom = async () => {
      try {
        console.log('[DEBUG] === Starting NPM SDK Initialization ===');
        
        // Container validation
        if (!containerRef.current) {
          console.error('[DEBUG] Container ref is null - aborting initialization');
          throw new Error('Container not available');
        }
        
        console.log('[DEBUG] Container validation passed');
        
        // Validate required parameters
        console.log('[DEBUG] === Validating Parameters ===');
        if (!rtmToken) {
          throw new Error('RTM token is required for classroom initialization');
        }
        if (!appId) {
          throw new Error('App ID is required for classroom initialization');
        }
        if (!channelName) {
          throw new Error('Channel name is required for classroom initialization');
        }

        // Configure the SDK
        console.log('[DEBUG] === Configuring Agora Education SDK ===');
        AgoraEduSDK.config({
          appId,
          region: 'NA' // North America region
        });
        console.log('[DEBUG] SDK configuration completed');

        // Map user role to Agora role type
        const roleType = userRole === 'teacher' ? EduRoleTypeEnum.teacher : EduRoleTypeEnum.student;
        console.log('[DEBUG] Role mapping:', { userRole, roleType });

        // Launch options following CloudClass Desktop pattern
        const launchOptions = {
          userUuid: uid.toString(),
          userName,
          roleType: roleType,
          roomUuid: channelName,
          roomName: lessonTitle || channelName,
          roomType: EduRoomTypeEnum.RoomSmallClass,
          rtmToken: rtmToken,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          courseWareList: [],
          pretest: false,
          platform: Platform.PC,
          listener: (evt: AgoraEduClassroomEvent) => {
            console.log('[DEBUG] === Classroom Event Received ===');
            console.log('[DEBUG] Event:', evt);
            
            if (evt === AgoraEduClassroomEvent.Ready) {
              console.log('[DEBUG] Classroom ready - removing loading state');
              setIsLoading(false);
              toast.success('Classroom connected successfully');
            } else if (evt === AgoraEduClassroomEvent.Destroyed) {
              console.log('[DEBUG] Classroom destroyed - closing');
              onClose();
            }
          }
        };

        console.log('[DEBUG] === Launching Classroom ===');
        console.log('[DEBUG] Launch options prepared');
        
        await AgoraEduSDK.launch(containerRef.current, launchOptions);
        
        console.log('[DEBUG] Agora Education SDK launched successfully');
        
      } catch (error: any) {
        console.error('[DEBUG] === Classroom Initialization Failed ===');
        console.error('[DEBUG] Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        setError(`Classroom Error: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
      }
    };

    // Start initialization immediately
    if (!containerRef.current) {
      console.log('[DEBUG] Container not ready, waiting...');
      const checkContainer = setInterval(() => {
        if (containerRef.current) {
          console.log('[DEBUG] Container now available, starting initialization');
          clearInterval(checkContainer);
          initializeClassroom();
        }
      }, 100);
      
      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkContainer);
        if (!containerRef.current) {
          console.error('[DEBUG] Container never became available');
          setError('Container initialization timeout');
          setIsLoading(false);
        }
      }, 10000);
    } else {
      console.log('[DEBUG] Container ready immediately, starting initialization');
      initializeClassroom();
    }

    // Cleanup function
    return () => {
      try {
        console.log('[DEBUG] === Component Cleanup ===');
      } catch (error) {
        console.error('[DEBUG] Cleanup error:', error);
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
              Initializing Agora Education SDK (NPM)
            </div>
            <div className="text-xs text-gray-500">
              Check browser console for detailed logs
            </div>
          </div>
        </div>
      )}

      {/* Agora Education SDK Container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          height: 'calc(100vh - 0px)',
          width: '100vw'
        }}
      />
    </div>
  );
};

export default FcrUISceneClassroom;
