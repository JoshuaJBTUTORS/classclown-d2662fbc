
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Import from the npm package
import { FcrUISceneCreator, FcrRegion } from 'fcr-ui-scene';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const initializeClassroom = async () => {
      try {
        if (!containerRef.current) {
          throw new Error('Container not ready');
        }

        console.log('[FCRUISCENE] Initializing classroom with FcrUISceneCreator');
        console.log('[FCRUISCENE] Config:', {
          appId: appId?.substring(0, 8) + '...',
          channelName,
          uid,
          userName,
          userRole,
          tokenPresent: !!rtmToken
        });

        const config = {
          appId,
          region: FcrRegion.NA,
          userId: uid.toString(),
          userName,
          roomUuid: channelName,
          roomType: 10, // Cloud Class room type
          roomName: lessonTitle || channelName,
          pretest: false,
          token: rtmToken,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          roleType: userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
        };

        console.log('[FCRUISCENE] Creating FcrUISceneCreator with config:', {
          ...config,
          token: config.token ? '[PRESENT]' : '[MISSING]'
        });

        // Create the scene creator instance
        const sceneCreator = new FcrUISceneCreator(config);
        sceneRef.current = sceneCreator;

        // Launch the scene
        await sceneCreator.launch(containerRef.current, {
          onSuccess: () => {
            console.log('[FCRUISCENE] Classroom launched successfully');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
          },
          onError: (error: any) => {
            console.error('[FCRUISCENE] Classroom launch error:', error);
            setError(`Launch Error: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
            toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
          },
          onDestroy: (type: any) => {
            console.log('[FCRUISCENE] Classroom destroyed:', type);
            onClose();
          }
        });

      } catch (error: any) {
        console.error('[FCRUISCENE] Failed to initialize classroom:', error);
        setError(`Initialization Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeClassroom();

    // Cleanup
    return () => {
      if (sceneRef.current) {
        try {
          sceneRef.current.destroy();
        } catch (error) {
          console.warn('[FCRUISCENE] Error during cleanup:', error);
        }
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
              Initializing FcrUIScene SDK
            </div>
          </div>
        </div>
      )}

      {/* Classroom container */}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ 
          height: '100vh',
          width: '100vw'
        }}
      />
    </div>
  );
};

export default FcrUISceneClassroom;
