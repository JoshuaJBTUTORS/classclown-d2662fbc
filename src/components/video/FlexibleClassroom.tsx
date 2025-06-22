
import React, { useEffect, useRef, useState } from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';
import { loadAgoraFlexibleClassroomSDK } from '@/utils/agoraSDKLoader';

// Import Agora Flexible Classroom SDK
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
  const [isSDKLoading, setIsSDKLoading] = useState(true);
  const [sdkError, setSDKError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await loadAgoraFlexibleClassroomSDK();
        setIsSDKLoading(false);
      } catch (error) {
        console.error('Failed to load Agora SDK:', error);
        setSDKError('Failed to load classroom SDK');
        setIsSDKLoading(false);
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    if (isSDKLoading || sdkError || !containerRef.current || !credentials) return;

    const initializeClassroom = async () => {
      try {
        console.log('Initializing Flexible Classroom with credentials:', credentials);

        // Determine classroom type based on expected students
        const classroomType = expectedStudents.length <= 1 ? '1v1' : 'small-classroom';

        // Configure classroom options
        const launchOptions = {
          appId: credentials.appId,
          region: 'AP', // Adjust based on your region
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
            // Customize UI based on our needs
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
            easemobIM: false, // Disable if not needed
            poll: true,
            popupQuiz: true,
            countdown: true,
            webview: false,
          },
          // Classroom layout and features
          latencyLevel: 1, // Ultra low latency
          platform: 'web',
        };

        // Launch the classroom
        if (window.AgoraEduSDK) {
          classroomRef.current = await window.AgoraEduSDK.launch(
            containerRef.current,
            launchOptions
          );

          // Set up event listeners
          classroomRef.current.on('ready', () => {
            console.log('Flexible Classroom is ready');
          });

          classroomRef.current.on('destroyed', () => {
            console.log('Flexible Classroom destroyed');
            onLeave();
          });

          classroomRef.current.on('error', (error: any) => {
            console.error('Flexible Classroom error:', error);
          });
        } else {
          console.error('AgoraEduSDK not loaded');
          setSDKError('Classroom SDK not available');
        }
      } catch (error) {
        console.error('Error initializing Flexible Classroom:', error);
        setSDKError('Failed to initialize classroom');
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
  }, [credentials, expectedStudents, onLeave, isSDKLoading, sdkError]);

  if (sdkError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Classroom Error</h2>
            <p className="text-gray-600 mb-4">{sdkError}</p>
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
      {(isSDKLoading || !classroomRef.current) && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-700">
                {isSDKLoading ? 'Loading SDK...' : 'Starting classroom...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexibleClassroom;
