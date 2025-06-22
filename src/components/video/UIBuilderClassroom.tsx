import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Import FcrUIScene as default export
import FcrUIScene from 'fcr-ui-scene';
import {
  FcrChatroom,
  FcrBoardWidget,
  FcrPollingWidget,
  FcrStreamMediaPlayerWidget,
  FcrWebviewWidget,
  FcrCountdownWidget,
  FcrPopupQuizWidget
} from 'agora-plugin-gallery/scene';

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
  const unmountRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initializeClassroom = async () => {
      try {
        console.log('[DEBUG] === UIBuilder Classroom Initialization (FcrUIScene) ===');
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

        console.log('[DEBUG] Launching classroom with FcrUIScene...');

        // Map user role to numeric role type (1 = teacher, 2 = student)
        const roleType = userRole === 'teacher' ? 1 : 2;

        // Launch options following the documentation pattern
        const launchOptions = {
          appId,
          region: 'NA', // North America region
          userUuid,
          userName,
          roomUuid: roomId,
          roomType: 10, // Room type: 10 for Cloud Class
          roomName: lessonTitle || roomId,
          pretest: true, // Enable pre-class equipment detection
          token: rtmToken, // RTM token
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours in seconds
          recordUrl: '', // Empty for now
          roleType: roleType, // User roles: 1 is teacher, 2 is student
          widgets: {
            easemobIM: FcrChatroom, // IM widget
            netlessBoard: FcrBoardWidget, // Interactive whiteboard widget
            poll: FcrPollingWidget, // Voter widget
            mediaPlayer: FcrStreamMediaPlayerWidget, // Video sync player widget
            webView: FcrWebviewWidget, // Embedded browser widget
            countdownTimer: FcrCountdownWidget, // Countdown widget
            popupQuiz: FcrPopupQuizWidget, // Clicker widget
          }
        };

        // Launch the classroom using FcrUIScene.launch
        const unmount = FcrUIScene.launch(
          containerRef.current,
          launchOptions,
          () => {
            // Success callback
            console.log('[DEBUG] UIBuilder classroom ready (FcrUIScene)');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
          },
          (err: any) => {
            // Error callback
            console.error('[DEBUG] Failed to initialize UIBuilder classroom:', err);
            setError(err.message);
            onError?.(err.message);
            setIsLoading(false);
            toast.error(`Failed to initialize classroom: ${err.message}`);
          },
          (type: any) => {
            // Destroy callback
            console.log('[DEBUG] UIBuilder classroom destroyed');
            onClose();
          }
        );

        // Store unmount function for cleanup
        unmountRef.current = unmount;

        console.log('[DEBUG] UIBuilder classroom launched successfully with FcrUIScene');
        
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
      if (unmountRef.current) {
        unmountRef.current();
        unmountRef.current = null;
      }
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
              Initializing FcrUIScene (Web SDK)
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
