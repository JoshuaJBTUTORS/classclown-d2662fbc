
import React, { useEffect, useRef } from 'react';
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
    FcrUIScene: {
      launch: (container: HTMLElement, config: any, onSuccess?: () => void, onError?: (error: any) => void, onDestroy?: (type: any) => void) => () => void;
    };
    FcrChatroom: any;
    FcrBoardWidget: any;
    FcrPollingWidget: any;
    FcrStreamMediaPlayerWidget: any;
    FcrWebviewWidget: any;
    FcrCountdownWidget: any;
    FcrPopupQuizWidget: any;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const unmountRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const loadFcrUIScene = async () => {
      try {
        console.log('Loading FcrUIScene SDK...');
        
        // Check if SDK is already loaded
        if (window.FcrUIScene) {
          console.log('FcrUIScene SDK already loaded');
          launchClassroom();
          return;
        }

        // Load CSS
        if (!document.querySelector('link[href*="scene_sdk"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.css';
          cssLink.onload = () => console.log('FcrUIScene CSS loaded');
          cssLink.onerror = () => {
            throw new Error('Failed to load FcrUIScene CSS');
          };
          document.head.appendChild(cssLink);
        }

        // Load SDK JS
        if (!document.querySelector('script[src*="scene_sdk"]')) {
          const sdkScript = document.createElement('script');
          sdkScript.src = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.js';
          sdkScript.onload = () => {
            console.log('FcrUIScene SDK loaded');
            loadPlugins();
          };
          sdkScript.onerror = () => {
            throw new Error('Failed to load FcrUIScene SDK');
          };
          document.head.appendChild(sdkScript);
        }

      } catch (error: any) {
        console.error('Failed to load FcrUIScene SDK:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    const loadPlugins = () => {
      // Load plugins JS
      if (!document.querySelector('script[src*="scene_widget"]')) {
        const pluginScript = document.createElement('script');
        pluginScript.src = 'https://download.agora.io/edu-apaas/release/scene_widget@2.9.0.bundle.js';
        pluginScript.onload = () => {
          console.log('FcrUIScene plugins loaded');
          // Small delay to ensure everything is initialized
          setTimeout(launchClassroom, 100);
        };
        pluginScript.onerror = () => {
          setError('Failed to load FcrUIScene plugins');
          setIsLoading(false);
        };
        document.head.appendChild(pluginScript);
      } else {
        launchClassroom();
      }
    };

    const launchClassroom = () => {
      try {
        if (!containerRef.current || !window.FcrUIScene) {
          throw new Error('FcrUIScene not available or container not ready');
        }

        console.log('Launching FcrUIScene classroom with config:', {
          appId: appId?.substring(0, 8) + '...',
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roleType: userRole === 'teacher' ? 1 : 2,
          roomName: lessonTitle || channelName,
          tokenPresent: !!rtmToken
        });

        const unmount = window.FcrUIScene.launch(
          containerRef.current,
          {
            appId,
            region: 'NA',
            userUuid: uid.toString(),
            userName,
            roomUuid: channelName,
            roomType: 10, // Cloud Class room type
            roomName: lessonTitle || channelName,
            pretest: false, // Disable pre-class device check for now
            token: rtmToken,
            language: 'en',
            duration: 60 * 60 * 2, // 2 hours default
            roleType: userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
            widgets: {
              easemobIM: window.FcrChatroom,
              netlessBoard: window.FcrBoardWidget,
              poll: window.FcrPollingWidget,
              mediaPlayer: window.FcrStreamMediaPlayerWidget,
              webView: window.FcrWebviewWidget,
              countdownTimer: window.FcrCountdownWidget,
              popupQuiz: window.FcrPopupQuizWidget,
            },
          },
          () => {
            // Success callback
            console.log('FcrUIScene classroom launched successfully');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
          },
          (error: any) => {
            // Error callback
            console.error('FcrUIScene launch error:', error);
            setError(error.message || 'Failed to launch classroom');
            setIsLoading(false);
            toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
          },
          (type: any) => {
            // Destroy callback
            console.log('FcrUIScene classroom destroyed:', type);
            onClose();
          }
        );

        unmountRef.current = unmount;

      } catch (error: any) {
        console.error('Failed to launch FcrUIScene classroom:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    loadFcrUIScene();

    // Cleanup
    return () => {
      if (unmountRef.current) {
        try {
          unmountRef.current();
        } catch (error) {
          console.warn('Error during classroom cleanup:', error);
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
          <div className="text-sm text-gray-500 space-y-1">
            <p>Room: {channelName}</p>
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
      {/* Header - only show when loading */}
      {isLoading && (
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
          </div>
        </div>
      )}

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
