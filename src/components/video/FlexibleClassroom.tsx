
import React, { useEffect, useRef, useState } from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';

// Import the correct Agora Classroom SDK
declare global {
  interface Window {
    AgoraEduSDK: any;
  }
}

interface FlexibleClassroomProps {
  credentials: FlexibleClassroomCredentials;
  onLeave: () => void;
  expectedStudents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

const FlexibleClassroom: React.FC<FlexibleClassroomProps> = ({
  credentials,
  onLeave,
  expectedStudents = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const classroomRef = useRef<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load SDK dynamically
  useEffect(() => {
    const loadSDK = async () => {
      try {
        // Import the SDK dynamically
        const AgoraEduSDK = await import('agora-classroom-sdk');
        
        // Check if SDK has the launch method
        if (AgoraEduSDK && typeof AgoraEduSDK.launch === 'function') {
          window.AgoraEduSDK = AgoraEduSDK;
          setSdkLoaded(true);
          console.log('Agora Classroom SDK loaded successfully');
        } else if (AgoraEduSDK.default && typeof AgoraEduSDK.default.launch === 'function') {
          window.AgoraEduSDK = AgoraEduSDK.default;
          setSdkLoaded(true);
          console.log('Agora Classroom SDK loaded successfully (default export)');
        } else {
          // Try alternative import approach
          const { AgoraEduSDK: SDK } = await import('agora-classroom-sdk');
          if (SDK && typeof SDK.launch === 'function') {
            window.AgoraEduSDK = SDK;
            setSdkLoaded(true);
            console.log('Agora Classroom SDK loaded successfully (named export)');
          } else {
            throw new Error('Unable to find launch method in Agora Classroom SDK');
          }
        }
      } catch (error) {
        console.error('Failed to load Agora Classroom SDK:', error);
        setInitError(`Failed to load SDK: ${error.message}`);
        setIsInitializing(false);
      }
    };

    loadSDK();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !credentials || !sdkLoaded) return;

    const initializeClassroom = async () => {
      try {
        console.log('Initializing Flexible Classroom with credentials:', {
          roomId: credentials.roomId,
          userRole: credentials.userRole,
          userName: credentials.userName,
          appId: credentials.appId.substring(0, 8) + '...'
        });

        // Determine classroom type based on expected students
        const classroomType = expectedStudents.length <= 1 ? '1v1' : 'small-classroom';

        // Configure classroom options
        const launchOptions = {
          appId: credentials.appId,
          region: 'AP', // Asia Pacific region
          roomId: credentials.roomId,
          roomName: credentials.lessonTitle || `Lesson ${credentials.roomId}`,
          userUuid: credentials.userUuid,
          userName: credentials.userName,
          roleType: credentials.userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
          roomType: classroomType === '1v1' ? 0 : 4, // 0 = 1v1, 4 = small classroom
          rtmToken: credentials.rtmToken,
          language: 'en',
          duration: 3600, // 1 hour default
          courseWareList: [],
          extApps: [],
          uiConfig: {
            shareScreen: {
              enable: true,
            },
            whiteboard: {
              enable: true,
            },
            chat: {
              enable: true,
            },
            record: {
              enable: credentials.userRole === 'teacher',
            },
          },
          widgets: {
            easemobIM: false,
            poll: true,
            popupQuiz: true,
            countdown: true,
            webview: false,
          },
          latencyLevel: 1, // Ultra low latency
          platform: 'web',
        };

        console.log('Launching Flexible Classroom with options:', {
          ...launchOptions,
          rtmToken: launchOptions.rtmToken.substring(0, 20) + '...'
        });

        // Launch the classroom using the loaded SDK
        classroomRef.current = await window.AgoraEduSDK.launch(
          containerRef.current,
          launchOptions
        );

        // Set up event listeners
        if (classroomRef.current) {
          classroomRef.current.on('ready', () => {
            console.log('Flexible Classroom is ready');
            setIsInitializing(false);
          });

          classroomRef.current.on('destroyed', () => {
            console.log('Flexible Classroom destroyed');
            onLeave();
          });

          classroomRef.current.on('error', (error: any) => {
            console.error('Flexible Classroom error:', error);
            setInitError(`Classroom error: ${error.message || error}`);
            setIsInitializing(false);
          });
        }

        setIsInitializing(false);
      } catch (error: any) {
        console.error('Error initializing Flexible Classroom:', error);
        setInitError(`Failed to initialize classroom: ${error.message || error}`);
        setIsInitializing(false);
      }
    };

    initializeClassroom();

    // Cleanup on unmount
    return () => {
      if (classroomRef.current) {
        try {
          classroomRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying classroom:', error);
        }
      }
    };
  }, [credentials, expectedStudents, onLeave, sdkLoaded]);

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Classroom Error</h2>
            <p className="text-gray-600 mb-4">{initError}</p>
            <button
              onClick={onLeave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header with lesson info */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {credentials.lessonTitle || `Lesson ${credentials.roomId}`}
            </h1>
            <p className="text-sm text-gray-500">
              Role: {credentials.userRole === 'teacher' ? 'Teacher' : 'Student'} | 
              Expected participants: {expectedStudents.length + 1}
            </p>
          </div>
          <button
            onClick={onLeave}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Leave Class
          </button>
        </div>
      </div>

      {/* Flexible Classroom container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full"
        style={{ minHeight: '600px' }}
      />

      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-700">
                {!sdkLoaded ? 'Loading SDK...' : 'Initializing classroom...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexibleClassroom;
