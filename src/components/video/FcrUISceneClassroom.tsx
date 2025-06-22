
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

interface LoadingStep {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
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
  const [loadingSteps, setLoadingSteps] = React.useState<LoadingStep[]>([
    { name: 'Initialize SDK Loading', status: 'pending' },
    { name: 'Check Existing SDK', status: 'pending' },
    { name: 'Load CSS Resources', status: 'pending' },
    { name: 'Load SDK JavaScript', status: 'pending' },
    { name: 'Load Plugin Widgets', status: 'pending' },
    { name: 'Launch Classroom', status: 'pending' }
  ]);
  const [debugMode, setDebugMode] = React.useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateLoadingStep = (stepName: string, status: LoadingStep['status'], error?: string) => {
    const timestamp = Date.now();
    console.log(`[FCRUISCENE-DEBUG] ${new Date().toISOString()} - ${stepName}: ${status}${error ? ` - ${error}` : ''}`);
    
    setLoadingSteps(prev => prev.map(step => {
      if (step.name === stepName) {
        return {
          ...step,
          status,
          ...(status === 'loading' && { startTime: timestamp }),
          ...(status !== 'loading' && status !== 'pending' && { endTime: timestamp }),
          ...(error && { error })
        };
      }
      return step;
    }));
  };

  const logEnvironmentInfo = () => {
    console.log('[FCRUISCENE-DEBUG] Environment Information:', {
      userAgent: navigator.userAgent,
      windowLocation: window.location.href,
      documentReadyState: document.readyState,
      hasContainer: !!containerRef.current,
      containerDimensions: containerRef.current ? {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      } : null,
      existingSDK: !!window.FcrUIScene,
      existingWidgets: {
        FcrChatroom: !!window.FcrChatroom,
        FcrBoardWidget: !!window.FcrBoardWidget,
        FcrPollingWidget: !!window.FcrPollingWidget,
        FcrStreamMediaPlayerWidget: !!window.FcrStreamMediaPlayerWidget,
        FcrWebviewWidget: !!window.FcrWebviewWidget,
        FcrCountdownWidget: !!window.FcrCountdownWidget,
        FcrPopupQuizWidget: !!window.FcrPopupQuizWidget,
      }
    });
  };

  const logNetworkRequest = (url: string, type: 'css' | 'js') => {
    console.log(`[FCRUISCENE-DEBUG] Attempting to load ${type.toUpperCase()} from:`, url);
    
    // Test network connectivity to the resource
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(() => console.log(`[FCRUISCENE-DEBUG] Network test for ${url}: SUCCESS`))
      .catch(err => console.log(`[FCRUISCENE-DEBUG] Network test for ${url}: FAILED`, err));
  };

  useEffect(() => {
    // Set up loading timeout (30 seconds)
    loadingTimeoutRef.current = setTimeout(() => {
      console.error('[FCRUISCENE-DEBUG] Loading timeout reached (30 seconds)');
      setError('Loading timeout: FcrUIScene SDK failed to load within 30 seconds');
      setIsLoading(false);
    }, 30000);

    const loadFcrUIScene = async () => {
      try {
        updateLoadingStep('Initialize SDK Loading', 'loading');
        logEnvironmentInfo();
        
        updateLoadingStep('Initialize SDK Loading', 'success');
        updateLoadingStep('Check Existing SDK', 'loading');
        
        // Check if SDK is already loaded
        if (window.FcrUIScene) {
          console.log('[FCRUISCENE-DEBUG] FcrUIScene SDK already loaded, checking widgets...');
          updateLoadingStep('Check Existing SDK', 'success');
          updateLoadingStep('Load CSS Resources', 'success');
          updateLoadingStep('Load SDK JavaScript', 'success');
          
          if (window.FcrChatroom && window.FcrBoardWidget) {
            updateLoadingStep('Load Plugin Widgets', 'success');
            launchClassroom();
          } else {
            console.log('[FCRUISCENE-DEBUG] Widgets missing, loading plugins...');
            loadPlugins();
          }
          return;
        }

        updateLoadingStep('Check Existing SDK', 'success');
        updateLoadingStep('Load CSS Resources', 'loading');

        // Load CSS
        const cssUrl = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.css';
        if (!document.querySelector(`link[href="${cssUrl}"]`)) {
          logNetworkRequest(cssUrl, 'css');
          
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = cssUrl;
          
          cssLink.onload = () => {
            console.log('[FCRUISCENE-DEBUG] FcrUIScene CSS loaded successfully');
            updateLoadingStep('Load CSS Resources', 'success');
          };
          
          cssLink.onerror = (err) => {
            console.error('[FCRUISCENE-DEBUG] Failed to load FcrUIScene CSS:', err);
            updateLoadingStep('Load CSS Resources', 'error', 'Failed to load CSS from CDN');
            throw new Error('Failed to load FcrUIScene CSS');
          };
          
          document.head.appendChild(cssLink);
        } else {
          console.log('[FCRUISCENE-DEBUG] CSS already loaded');
          updateLoadingStep('Load CSS Resources', 'success');
        }

        updateLoadingStep('Load SDK JavaScript', 'loading');

        // Load SDK JS
        const jsUrl = 'https://download.agora.io/edu-apaas/release/scene_sdk@2.9.0.bundle.js';
        if (!document.querySelector(`script[src="${jsUrl}"]`)) {
          logNetworkRequest(jsUrl, 'js');
          
          const sdkScript = document.createElement('script');
          sdkScript.src = jsUrl;
          
          sdkScript.onload = () => {
            console.log('[FCRUISCENE-DEBUG] FcrUIScene SDK JavaScript loaded successfully');
            console.log('[FCRUISCENE-DEBUG] Window.FcrUIScene available:', !!window.FcrUIScene);
            updateLoadingStep('Load SDK JavaScript', 'success');
            loadPlugins();
          };
          
          sdkScript.onerror = (err) => {
            console.error('[FCRUISCENE-DEBUG] Failed to load FcrUIScene SDK JavaScript:', err);
            updateLoadingStep('Load SDK JavaScript', 'error', 'Failed to load SDK JavaScript from CDN');
            throw new Error('Failed to load FcrUIScene SDK JavaScript');
          };
          
          document.head.appendChild(sdkScript);
        } else {
          console.log('[FCRUISCENE-DEBUG] SDK JavaScript already loaded');
          updateLoadingStep('Load SDK JavaScript', 'success');
          loadPlugins();
        }

      } catch (error: any) {
        console.error('[FCRUISCENE-DEBUG] Failed to load FcrUIScene SDK:', error);
        setError(`SDK Loading Error: ${error.message}`);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      }
    };

    const loadPlugins = () => {
      updateLoadingStep('Load Plugin Widgets', 'loading');
      
      const pluginUrl = 'https://download.agora.io/edu-apaas/release/scene_widget@2.9.0.bundle.js';
      if (!document.querySelector(`script[src="${pluginUrl}"]`)) {
        logNetworkRequest(pluginUrl, 'js');
        
        const pluginScript = document.createElement('script');
        pluginScript.src = pluginUrl;
        
        pluginScript.onload = () => {
          console.log('[FCRUISCENE-DEBUG] FcrUIScene plugins loaded successfully');
          console.log('[FCRUISCENE-DEBUG] Available widgets:', {
            FcrChatroom: !!window.FcrChatroom,
            FcrBoardWidget: !!window.FcrBoardWidget,
            FcrPollingWidget: !!window.FcrPollingWidget,
            FcrStreamMediaPlayerWidget: !!window.FcrStreamMediaPlayerWidget,
            FcrWebviewWidget: !!window.FcrWebviewWidget,
            FcrCountdownWidget: !!window.FcrCountdownWidget,
            FcrPopupQuizWidget: !!window.FcrPopupQuizWidget,
          });
          updateLoadingStep('Load Plugin Widgets', 'success');
          // Small delay to ensure everything is initialized
          setTimeout(launchClassroom, 100);
        };
        
        pluginScript.onerror = (err) => {
          console.error('[FCRUISCENE-DEBUG] Failed to load FcrUIScene plugins:', err);
          updateLoadingStep('Load Plugin Widgets', 'error', 'Failed to load plugins from CDN');
          setError('Failed to load FcrUIScene plugins');
          setIsLoading(false);
        };
        
        document.head.appendChild(pluginScript);
      } else {
        console.log('[FCRUISCENE-DEBUG] Plugins already loaded');
        updateLoadingStep('Load Plugin Widgets', 'success');
        launchClassroom();
      }
    };

    const launchClassroom = () => {
      updateLoadingStep('Launch Classroom', 'loading');
      
      try {
        if (!containerRef.current) {
          throw new Error('Container not ready');
        }
        
        if (!window.FcrUIScene) {
          throw new Error('FcrUIScene not available');
        }

        const config = {
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
        };

        console.log('[FCRUISCENE-DEBUG] Launching FcrUIScene classroom with config:', {
          ...config,
          token: config.token ? '[PRESENT]' : '[MISSING]',
          appId: config.appId?.substring(0, 8) + '...',
          widgets: Object.keys(config.widgets).reduce((acc, key) => {
            acc[key] = !!config.widgets[key];
            return acc;
          }, {} as Record<string, boolean>)
        });

        const unmount = window.FcrUIScene.launch(
          containerRef.current,
          config,
          () => {
            // Success callback
            console.log('[FCRUISCENE-DEBUG] FcrUIScene classroom launched successfully');
            updateLoadingStep('Launch Classroom', 'success');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
          },
          (error: any) => {
            // Error callback
            console.error('[FCRUISCENE-DEBUG] FcrUIScene launch error:', error);
            updateLoadingStep('Launch Classroom', 'error', error.message || 'Launch failed');
            setError(`Classroom Launch Error: ${error.message || 'Unknown error'}`);
            setIsLoading(false);
            toast.error(`Classroom error: ${error.message || 'Unknown error'}`);
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current);
            }
          },
          (type: any) => {
            // Destroy callback
            console.log('[FCRUISCENE-DEBUG] FcrUIScene classroom destroyed:', type);
            onClose();
          }
        );

        unmountRef.current = unmount;

      } catch (error: any) {
        console.error('[FCRUISCENE-DEBUG] Failed to launch FcrUIScene classroom:', error);
        updateLoadingStep('Launch Classroom', 'error', error.message);
        setError(`Launch Error: ${error.message}`);
        setIsLoading(false);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      }
    };

    loadFcrUIScene();

    // Cleanup
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (unmountRef.current) {
        try {
          unmountRef.current();
        } catch (error) {
          console.warn('[FCRUISCENE-DEBUG] Error during classroom cleanup:', error);
        }
      }
    };
  }, [appId, rtmToken, channelName, uid, userName, userRole, lessonTitle, onClose]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="text-red-500 text-lg font-medium">
            Classroom Error
          </div>
          <p className="text-gray-600">
            {error}
          </p>
          
          {/* Debug Information */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Loading Steps Debug:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
              >
                {debugMode ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            <div className="space-y-1">
              {loadingSteps.map((step, index) => {
                const duration = step.startTime && step.endTime ? step.endTime - step.startTime : null;
                return (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      step.status === 'success' ? 'bg-green-500' :
                      step.status === 'error' ? 'bg-red-500' :
                      step.status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                      'bg-gray-300'
                    }`} />
                    <span className="flex-1">{step.name}</span>
                    <span className="text-gray-500">{step.status}</span>
                    {duration && <span className="text-gray-400">({duration}ms)</span>}
                  </div>
                );
              })}
            </div>
            
            {debugMode && (
              <div className="mt-4 p-2 bg-white rounded text-xs">
                <div className="font-medium mb-1">Configuration:</div>
                <div>Room: {channelName}</div>
                <div>User: {userName} ({userRole})</div>
                <div>UID: {uid}</div>
                <div>Token: {rtmToken ? 'Present' : 'Missing'}</div>
                <div>AppId: {appId?.substring(0, 8)}...</div>
              </div>
            )}
          </div>
          
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs"
            >
              Debug
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
          <div className="text-center space-y-6 max-w-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium text-gray-900">
              Loading Flexible Classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing Agora FcrUIScene SDK
            </div>
            
            {/* Loading Steps */}
            <div className="space-y-2 text-left">
              {loadingSteps.map((step, index) => {
                const isActive = step.status === 'loading';
                const isComplete = step.status === 'success';
                const hasError = step.status === 'error';
                
                return (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      hasError ? 'border-red-500 bg-red-500' :
                      isComplete ? 'border-green-500 bg-green-500' :
                      isActive ? 'border-blue-500 bg-blue-500 animate-pulse' :
                      'border-gray-300'
                    }`}>
                      {(isComplete || hasError) && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className={`${
                      hasError ? 'text-red-600' :
                      isComplete ? 'text-green-600' :
                      isActive ? 'text-blue-600 font-medium' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                      {hasError && step.error && ` (${step.error})`}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {debugMode && (
              <div className="text-xs text-gray-500 text-left bg-gray-50 p-3 rounded">
                <div>Check browser console for detailed logs</div>
                <div>All logs prefixed with [FCRUISCENE-DEBUG]</div>
              </div>
            )}
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
