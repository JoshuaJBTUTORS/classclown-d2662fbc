
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Import FcrUIScene from npm package instead of loading from CDN
declare global {
  interface Window {
    FcrUIScene: {
      launch: (container: HTMLElement, config: any, onSuccess?: () => void, onError?: (error: any) => void, onDestroy?: (type: any) => void) => () => void;
    };
  }
}

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
  const unmountRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const initializeClassroom = async () => {
      try {
        if (!containerRef.current) {
          throw new Error('Container not ready');
        }

        console.log('[FCRUISCENE] Initializing classroom with npm package');
        console.log('[FCRUISCENE] Config:', {
          appId: appId?.substring(0, 8) + '...',
          channelName,
          uid,
          userName,
          userRole,
          tokenPresent: !!rtmToken
        });

        // Check if FcrUIScene is available globally (should be loaded via npm)
        if (typeof window !== 'undefined' && window.FcrUIScene) {
          console.log('[FCRUISCENE] FcrUIScene found on window object');
          launchClassroom();
        } else {
          // Try to dynamically import from npm package
          console.log('[FCRUISCENE] Attempting to load FcrUIScene from npm package');
          try {
            // Import the FcrUIScene package
            const FcrUISceneModule = await import('fcr-ui-scene');
            console.log('[FCRUISCENE] FcrUIScene module loaded:', FcrUISceneModule);
            
            // Make it available globally for the launch function
            if (FcrUISceneModule.default && FcrUISceneModule.default.launch) {
              window.FcrUIScene = FcrUISceneModule.default;
              console.log('[FCRUISCENE] FcrUIScene attached to window');
              launchClassroom();
            } else {
              throw new Error('FcrUIScene.launch not found in module');
            }
          } catch (importError) {
            console.error('[FCRUISCENE] Failed to import FcrUIScene from npm:', importError);
            // Fallback to CDN loading
            loadFromCDN();
          }
        }
      } catch (error: any) {
        console.error('[FCRUISCENE] Failed to initialize classroom:', error);
        setError(`Initialization Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    const loadFromCDN = async () => {
      console.log('[FCRUISCENE] Falling back to CDN loading');
      try {
        // Load CSS
        const cssUrl = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.css';
        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = cssUrl;
          
          cssLink.onload = () => {
            console.log('[FCRUISCENE] CSS loaded from CDN');
            loadSDKFromCDN();
          };
          
          cssLink.onerror = (err) => {
            console.error('[FCRUISCENE] Failed to load CSS from CDN:', err);
            setError('Failed to load classroom styles');
            setIsLoading(false);
          };
          
          document.head.appendChild(cssLink);
        } else {
          loadSDKFromCDN();
        }
      } catch (error: any) {
        console.error('[FCRUISCENE] CDN fallback failed:', error);
        setError(`CDN Loading Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    const loadSDKFromCDN = () => {
      const jsUrl = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.js';
      if (!document.querySelector(`script[src="${jsUrl}"]`)) {
        const sdkScript = document.createElement('script');
        sdkScript.src = jsUrl;
        
        sdkScript.onload = () => {
          console.log('[FCRUISCENE] SDK loaded from CDN');
          // Load plugins
          const pluginUrl = 'https://download.agora.io/edu-apaas/release/scene_widget@2.9.0.bundle.js';
          const pluginScript = document.createElement('script');
          pluginScript.src = pluginUrl;
          
          pluginScript.onload = () => {
            console.log('[FCRUISCENE] Plugins loaded from CDN');
            setTimeout(launchClassroom, 100);
          };
          
          pluginScript.onerror = () => {
            console.error('[FCRUISCENE] Failed to load plugins from CDN');
            setError('Failed to load classroom plugins');
            setIsLoading(false);
          };
          
          document.head.appendChild(pluginScript);
        };
        
        sdkScript.onerror = () => {
          console.error('[FCRUISCENE] Failed to load SDK from CDN');
          setError('Failed to load classroom SDK');
          setIsLoading(false);
        };
        
        document.head.appendChild(sdkScript);
      } else {
        launchClassroom();
      }
    };

    const launchClassroom = () => {
      try {
        if (!window.FcrUIScene) {
          throw new Error('FcrUIScene not available');
        }

        if (!containerRef.current) {
          throw new Error('Container not ready');
        }

        const config = {
          appId,
          region: 'NA',
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roomType: 10, // Cloud Class room type
          roomName: lessonTitle || channelName,
          pretest: false,
          token: rtmToken,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          roleType: userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
          widgets: {
            easemobIM: (window as any).FcrChatroom,
            netlessBoard: (window as any).FcrBoardWidget,
            poll: (window as any).FcrPollingWidget,
            mediaPlayer: (window as any).FcrStreamMediaPlayerWidget,
            webView: (window as any).FcrWebviewWidget,
            countdownTimer: (window as any).FcrCountdownWidget,
            popupQuiz: (window as any).FcrPopupQuizWidget,
          },
        };

        console.log('[FCRUISCENE] Launching classroom with config:', {
          ...config,
          token: config.token ? '[PRESENT]' : '[MISSING]',
          appId: config.appId?.substring(0, 8) + '...'
        });

        const unmount = window.FcrUIScene.launch(
          containerRef.current,
          config,
          () => {
            console.log('[FCRUISCENE] Classroom launched successfully');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
          },
          (error: any) => {
            console.error('[FCRUISCENE] Classroom launch error:', error);
            setError(`Launch Error: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
            toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
          },
          (type: any) => {
            console.log('[FCRUISCENE] Classroom destroyed:', type);
            onClose();
          }
        );

        unmountRef.current = unmount;

      } catch (error: any) {
        console.error('[FCRUISCENE] Failed to launch classroom:', error);
        setError(`Launch Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeClassroom();

    // Cleanup
    return () => {
      if (unmountRef.current) {
        try {
          unmountRef.current();
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
              Initializing Agora FcrUIScene SDK
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
