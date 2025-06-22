
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
    console.log('[DEBUG] === FcrUISceneClassroom Effect Started ===');
    console.log('[DEBUG] Props received:', {
      appId: appId?.substring(0, 8) + '...',
      rtmTokenPresent: !!rtmToken,
      rtmTokenLength: rtmToken?.length,
      channelName,
      uid,
      userName,
      userRole,
      lessonTitle
    });

    const loadSDK = async () => {
      try {
        console.log('[DEBUG] === Starting SDK Loading Process ===');
        console.log('[DEBUG] Timestamp:', new Date().toISOString());
        
        // Container validation
        if (!containerRef.current) {
          console.error('[DEBUG] Container ref is null - aborting initialization');
          throw new Error('Container not available');
        }
        
        console.log('[DEBUG] Container validation passed:', {
          containerExists: !!containerRef.current,
          containerDimensions: {
            offsetWidth: containerRef.current.offsetWidth,
            offsetHeight: containerRef.current.offsetHeight,
            clientWidth: containerRef.current.clientWidth,
            clientHeight: containerRef.current.clientHeight
          }
        });
        
        // Check if SDK is already loaded
        console.log('[DEBUG] Checking if SDK already exists...');
        console.log('[DEBUG] window.AgoraEduSDK exists:', !!window.AgoraEduSDK);
        
        if (window.AgoraEduSDK) {
          console.log('[DEBUG] SDK already loaded, proceeding to initialization...');
          await initializeClassroom();
          return;
        }
        
        console.log('[DEBUG] SDK not found, loading from CDN...');
        
        // Load CSS first
        console.log('[DEBUG] === Loading CSS ===');
        const existingCSS = document.querySelector('link[href*="edu_sdk"]');
        console.log('[DEBUG] Existing CSS link found:', !!existingCSS);
        
        if (!existingCSS) {
          console.log('[DEBUG] Creating CSS link element...');
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.css';
          
          const cssLoadPromise = new Promise((resolve, reject) => {
            cssLink.onload = () => {
              console.log('[DEBUG] CSS loaded successfully');
              resolve(true);
            };
            cssLink.onerror = (error) => {
              console.error('[DEBUG] CSS load failed:', error);
              reject(new Error('Failed to load CSS'));
            };
          });
          
          console.log('[DEBUG] Appending CSS to head...');
          document.head.appendChild(cssLink);
          await cssLoadPromise;
        }

        // Load JS SDK
        console.log('[DEBUG] === Loading JavaScript SDK ===');
        const existingScript = document.querySelector('script[src*="edu_sdk"]');
        console.log('[DEBUG] Existing script found:', !!existingScript);
        
        if (!existingScript) {
          console.log('[DEBUG] Creating script element...');
          const script = document.createElement('script');
          script.src = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.js';
          
          const scriptLoadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('[DEBUG] JavaScript SDK loaded successfully');
              console.log('[DEBUG] window.AgoraEduSDK available:', !!window.AgoraEduSDK);
              resolve(true);
            };
            script.onerror = (error) => {
              console.error('[DEBUG] JavaScript SDK load failed:', error);
              reject(new Error('Failed to load Agora Education SDK'));
            };
          });
          
          console.log('[DEBUG] Appending script to head...');
          document.head.appendChild(script);
          await scriptLoadPromise;
        }

        // Wait a bit for SDK to fully initialize
        console.log('[DEBUG] Waiting for SDK initialization...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[DEBUG] Final SDK check:', {
          sdkExists: !!window.AgoraEduSDK,
          configExists: !!(window.AgoraEduSDK?.config),
          launchExists: !!(window.AgoraEduSDK?.launch)
        });
        
        await initializeClassroom();

      } catch (error: any) {
        console.error('[DEBUG] === SDK Loading Failed ===');
        console.error('[DEBUG] Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        setError(error.message);
        setIsLoading(false);
      }
    };

    const initializeClassroom = async () => {
      try {
        console.log('[DEBUG] === Starting Classroom Initialization ===');
        console.log('[DEBUG] Timestamp:', new Date().toISOString());
        
        // Final container check
        if (!containerRef.current) {
          throw new Error('Container not available during initialization');
        }
        
        if (!window.AgoraEduSDK) {
          throw new Error('AgoraEduSDK not available during initialization');
        }

        console.log('[DEBUG] Pre-initialization checks passed');
        console.log('[DEBUG] Container final check:', {
          exists: !!containerRef.current,
          dimensions: {
            offsetWidth: containerRef.current.offsetWidth,
            offsetHeight: containerRef.current.offsetHeight
          }
        });
        
        // Validate required parameters
        console.log('[DEBUG] === Validating Parameters ===');
        const validationChecks = {
          rtmToken: !!rtmToken,
          appId: !!appId,
          channelName: !!channelName,
          uid: uid !== undefined && uid !== null,
          userName: !!userName
        };
        
        console.log('[DEBUG] Validation results:', validationChecks);
        
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
        console.log('[DEBUG] === Configuring SDK ===');
        const configOptions = {
          appId,
          region: 'NA'
        };
        console.log('[DEBUG] Config options:', {
          appId: appId.substring(0, 8) + '...',
          region: 'NA'
        });
        
        console.log('[DEBUG] Calling AgoraEduSDK.config...');
        window.AgoraEduSDK.config(configOptions);
        console.log('[DEBUG] SDK configuration completed');

        // Prepare launch options
        console.log('[DEBUG] === Preparing Launch Options ===');
        const launchOptions = {
          rtmToken,
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roleType: userRole === 'teacher' ? 1 : 2,
          roomType: 4,
          roomName: lessonTitle || channelName,
          language: 'en',
          duration: 60 * 60 * 2,
          courseWareList: [],
          pretest: false,
          listener: (evt: any) => {
            console.log('[DEBUG] === Classroom Event Received ===');
            console.log('[DEBUG] Event details:', {
              type: evt?.type || evt,
              timestamp: new Date().toISOString(),
              fullEvent: evt
            });
            
            if (evt.type === 'ready') {
              console.log('[DEBUG] Classroom ready - removing loading state');
              setIsLoading(false);
              toast.success('Classroom connected successfully');
            } else if (evt.type === 'destroyed' || evt === 'Destroyed') {
              console.log('[DEBUG] Classroom destroyed - closing');
              onClose();
            } else if (evt.type === 'error') {
              console.error('[DEBUG] Classroom error event:', evt.data);
              const errorMsg = evt.data?.message || 'Classroom error occurred';
              setError(errorMsg);
              toast.error(`Classroom error: ${errorMsg}`);
            }
          }
        };

        console.log('[DEBUG] Launch options prepared:', {
          rtmTokenLength: rtmToken.length,
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roleType: userRole === 'teacher' ? 1 : 2,
          roomType: 4,
          roomName: lessonTitle || channelName,
          language: 'en',
          duration: 60 * 60 * 2,
          courseWareListLength: 0,
          pretest: false,
          listenerAttached: !!launchOptions.listener
        });

        console.log('[DEBUG] === Launching Classroom ===');
        console.log('[DEBUG] Container at launch:', {
          exists: !!containerRef.current,
          tagName: containerRef.current.tagName,
          id: containerRef.current.id,
          className: containerRef.current.className
        });
        
        console.log('[DEBUG] Calling AgoraEduSDK.launch...');
        await window.AgoraEduSDK.launch(containerRef.current, launchOptions);
        
        console.log('[DEBUG] AgoraEduSDK.launch completed successfully');
        console.log('[DEBUG] === Classroom Launch Success ===');
        
      } catch (error: any) {
        console.error('[DEBUG] === Classroom Initialization Failed ===');
        console.error('[DEBUG] Error details:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          containerExists: !!containerRef.current,
          sdkExists: !!window.AgoraEduSDK
        });
        setError(`Classroom Error: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
      }
    };

    // Start the process
    if (!containerRef.current) {
      console.log('[DEBUG] Container not ready, waiting...');
      const checkContainer = setInterval(() => {
        if (containerRef.current) {
          console.log('[DEBUG] Container now available, starting SDK load');
          clearInterval(checkContainer);
          loadSDK();
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
      console.log('[DEBUG] Container ready immediately, starting SDK load');
      loadSDK();
    }

    // Cleanup function
    return () => {
      try {
        console.log('[DEBUG] === Component Cleanup ===');
        console.log('[DEBUG] Cleaning up classroom');
      } catch (error) {
        console.error('[DEBUG] Cleanup error:', error);
      }
    };
  }, [appId, rtmToken, channelName, uid, userName, userRole, lessonTitle, onClose]);

  // Add periodic status logging while loading
  React.useEffect(() => {
    if (!isLoading) return;
    
    const statusInterval = setInterval(() => {
      console.log('[DEBUG] === Status Check ===', {
        timestamp: new Date().toISOString(),
        isLoading,
        hasError: !!error,
        containerExists: !!containerRef.current,
        sdkExists: !!window.AgoraEduSDK
      });
    }, 2000);
    
    return () => clearInterval(statusInterval);
  }, [isLoading, error]);

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
