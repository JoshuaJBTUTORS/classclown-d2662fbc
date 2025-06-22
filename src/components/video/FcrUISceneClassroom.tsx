
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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

declare global {
  interface Window {
    AgoraEduSDK: {
      config: (options: {
        appId: string;
        region: string;
      }) => void;
      launch: (container: HTMLElement, options: {
        rtmToken: string;
        userUuid: string;
        userName: string;
        roomUuid: string;
        roleType: number;
        roomType: number;
        roomName: string;
        language: string;
        duration: number;
        courseWareList: any[];
        pretest: boolean;
        listener: (evt: any) => void;
      }) => Promise<void>;
    };
  }
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
    const loadSDK = async () => {
      try {
        console.log('[AGORA_EDU_SDK] Loading Agora Education SDK...');
        
        // Check if SDK is already loaded
        if (window.AgoraEduSDK) {
          console.log('[AGORA_EDU_SDK] SDK already loaded, initializing classroom...');
          initializeClassroom();
          return;
        }
        
        // Load CSS first
        if (!document.querySelector('link[href*="edu_sdk"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.css';
          cssLink.onload = () => console.log('[AGORA_EDU_SDK] CSS loaded successfully');
          cssLink.onerror = () => {
            throw new Error('Failed to load CSS');
          };
          document.head.appendChild(cssLink);
        }

        // Load JS SDK
        if (!document.querySelector('script[src*="edu_sdk"]')) {
          const script = document.createElement('script');
          script.src = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.js';
          script.onload = () => {
            console.log('[AGORA_EDU_SDK] SDK loaded successfully');
            // Small delay to ensure SDK is fully initialized
            setTimeout(initializeClassroom, 100);
          };
          script.onerror = () => {
            throw new Error('Failed to load Agora Education SDK');
          };
          document.head.appendChild(script);
        }

      } catch (error: any) {
        console.error('[AGORA_EDU_SDK] Failed to load SDK:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    const initializeClassroom = async () => {
      try {
        if (!containerRef.current || !window.AgoraEduSDK) {
          throw new Error('SDK not loaded or container not available');
        }

        console.log('[AGORA_EDU_SDK] Initializing classroom...');
        
        // Validate required parameters
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
        window.AgoraEduSDK.config({
          appId,
          region: 'NA'
        });

        console.log('[AGORA_EDU_SDK] SDK configured, launching classroom...');

        // Launch classroom with small class room type
        await window.AgoraEduSDK.launch(containerRef.current, {
          rtmToken,
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roleType: userRole === 'teacher' ? 1 : 2, // 1: teacher, 2: student
          roomType: 4, // 4: vocational class (small interactive classroom)
          roomName: lessonTitle || channelName,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          courseWareList: [],
          pretest: false,
          listener: (evt: any) => {
            console.log('[AGORA_EDU_SDK] Classroom event:', evt);
            if (evt.type === 'ready') {
              console.log('[AGORA_EDU_SDK] Classroom ready');
              setIsLoading(false);
              toast.success('Classroom connected successfully');
            } else if (evt.type === 'destroyed' || evt === 'Destroyed') {
              console.log('[AGORA_EDU_SDK] Classroom destroyed');
              onClose();
            } else if (evt.type === 'error') {
              console.error('[AGORA_EDU_SDK] Classroom error:', evt.data);
              const errorMsg = evt.data?.message || 'Classroom error occurred';
              setError(errorMsg);
              toast.error(`Classroom error: ${errorMsg}`);
            }
          }
        });

        console.log('[AGORA_EDU_SDK] Classroom launched successfully');
        
      } catch (error: any) {
        console.error('[AGORA_EDU_SDK] Classroom initialization error:', error);
        setError(`Classroom Error: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
      }
    };

    if (!containerRef.current) return;
    loadSDK();

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
