
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
  const unmountRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    console.log('[DEBUG] === FcrUIScene Classroom Effect Started ===');
    console.log('[DEBUG] Props received:', {
      appId: appId?.substring(0, 8) + '...',
      rtmTokenPresent: !!rtmToken,
      channelName,
      uid,
      userName,
      userRole,
      lessonTitle
    });

    const initializeClassroom = () => {
      try {
        console.log('[DEBUG] === Starting FcrUIScene Initialization (CDN) ===');
        
        if (!containerRef.current) {
          console.error('[DEBUG] Container ref is null - aborting initialization');
          throw new Error('Container not available');
        }
        
        console.log('[DEBUG] Container validation passed');
        
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

        // Check if FcrUIScene is available from CDN
        if (typeof window.FcrUIScene === 'undefined') {
          throw new Error('FcrUIScene not loaded from CDN. Please check the script tags.');
        }

        // Map user role to numeric role type (1 = teacher, 2 = student)
        const roleType = userRole === 'teacher' ? 1 : 2;
        console.log('[DEBUG] Role mapping:', { userRole, roleType });

        // Launch options following the documentation pattern
        const launchOptions = {
          appId,
          region: 'NA', // North America region
          userUuid: uid.toString(),
          userName,
          roomUuid: channelName,
          roomType: 10, // Room type: 10 for Cloud Class
          roomName: lessonTitle || channelName,
          pretest: true, // Enable pre-class equipment detection
          token: rtmToken, // RTM token
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours in seconds
          recordUrl: '', // Empty for now
          roleType: roleType, // User roles: 1 is teacher, 2 is student
          widgets: {
            easemobIM: window.FcrChatroom, // IM widget
            netlessBoard: window.FcrBoardWidget, // Interactive whiteboard widget
            poll: window.FcrPollingWidget, // Voter widget
            mediaPlayer: window.FcrStreamMediaPlayerWidget, // Video sync player widget
            webView: window.FcrWebviewWidget, // Embedded browser widget
            countdownTimer: window.FcrCountdownWidget, // Countdown widget
            popupQuiz: window.FcrPopupQuizWidget, // Clicker widget
          }
        };

        console.log('[DEBUG] === Launching FcrUIScene Classroom (CDN) ===');
        console.log('[DEBUG] Launch options prepared');
        
        // Launch the classroom using FcrUIScene.launch from CDN
        const unmount = window.FcrUIScene.launch(
          containerRef.current,
          launchOptions,
          () => {
            // Success callback
            console.log('[DEBUG] FcrUIScene classroom launched successfully (CDN)');
            setIsLoading(false);
            toast.success('Classroom connected successfully');
          },
          (err: any) => {
            // Error callback
            console.error('[DEBUG] FcrUIScene classroom launch failed (CDN):', err);
            setError(`Classroom Error: ${err.message || 'Unknown error'}`);
            setIsLoading(false);
            toast.error(`Classroom error: ${err.message || 'Unknown error'}`);
          },
          (type: any) => {
            // Destroy callback
            console.log('[DEBUG] FcrUIScene classroom destroyed, type:', type);
            onClose();
          }
        );

        // Store unmount function for cleanup
        unmountRef.current = unmount;
        
      } catch (error: any) {
        console.error('[DEBUG] === Classroom Initialization Failed (CDN) ===');
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

    // Wait for CDN scripts to load
    const checkCDNLoaded = () => {
      if (typeof window.FcrUIScene !== 'undefined') {
        console.log('[DEBUG] CDN scripts loaded, initializing classroom');
        initializeClassroom();
      } else {
        console.log('[DEBUG] Waiting for CDN scripts to load...');
        setTimeout(checkCDNLoaded, 100);
      }
    };

    checkCDNLoaded();

    // Cleanup function
    return () => {
      try {
        console.log('[DEBUG] === Component Cleanup (CDN) ===');
        if (unmountRef.current) {
          console.log('[DEBUG] Calling unmount function');
          unmountRef.current();
          unmountRef.current = null;
        }
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
              Loading Flexible Classroom (CDN)...
            </div>
            <div className="text-sm text-gray-600">
              Initializing FcrUIScene from CDN
            </div>
            <div className="text-xs text-gray-500">
              Check browser console for detailed logs
            </div>
          </div>
        </div>
      )}

      {/* FcrUIScene Container */}
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
