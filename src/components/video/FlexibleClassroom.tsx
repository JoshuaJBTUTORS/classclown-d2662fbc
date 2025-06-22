
import React, { useEffect, useRef, useState } from 'react';
import { FlexibleClassroomCredentials } from '@/hooks/useFlexibleClassroom';

// CDN URLs for Agora Flexible Classroom
const AGORA_CDN_URL = 'https://download.agora.io/edu-apaas/release/edu_classroom_sdk.bundle.js';

// Global interface for CDN-loaded SDK
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
  const unmountRef = useRef<(() => void) | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load SDK from CDN
  useEffect(() => {
    const loadSDKFromCDN = async () => {
      try {
        console.log('Loading Agora Flexible Classroom SDK from CDN...');
        
        // Check if already loaded
        if (window.AgoraEduSDK) {
          setSdkLoaded(true);
          return;
        }

        // Load SDK script
        const script = document.createElement('script');
        script.src = AGORA_CDN_URL;
        script.async = true;
        
        script.onload = () => {
          console.log('Agora SDK loaded from CDN successfully');
          setSdkLoaded(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Agora SDK from CDN');
          setInitError('Failed to load Agora SDK from CDN');
          setIsInitializing(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading SDK from CDN:', error);
        setInitError(`Failed to load SDK: ${error.message}`);
        setIsInitializing(false);
      }
    };

    loadSDKFromCDN();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !credentials || !sdkLoaded) return;

    const initializeClassroom = async () => {
      try {
        console.log('Initializing Flexible Classroom with credentials:', {
          roomUuid: credentials.roomId,
          userRole: credentials.userRole,
          userName: credentials.userName,
          appId: credentials.appId.substring(0, 8) + '...'
        });

        // Determine room type based on expected students
        const roomType = expectedStudents.length <= 1 ? 0 : 10; // 0 = 1v1, 10 = Small Class

        // Configure classroom launch options
        const launchOptions = {
          appId: credentials.appId,
          region: 'AP', // Asia Pacific region
          userUuid: credentials.userUuid,
          userName: credentials.userName,
          roomUuid: credentials.roomId,
          roomType: roomType,
          roomName: credentials.lessonTitle || `Lesson ${credentials.roomId}`,
          pretest: true, // Enable pre-class equipment detection
          rtmToken: credentials.rtmToken, // RTM token for signaling
          language: 'en',
          duration: 3600, // 1 hour default (in seconds)
          roleType: credentials.userRole === 'teacher' ? 1 : 2, // 1 = teacher, 2 = student
          // Add UI configuration
          uiConfig: {
            aspectRatio: 9 / 16, // Mobile friendly aspect ratio
            theme: 'light',
            language: 'en'
          }
        };

        console.log('Launching Flexible Classroom with options:', {
          ...launchOptions,
          rtmToken: launchOptions.rtmToken.substring(0, 20) + '...'
        });

        // Launch the classroom using AgoraEduSDK
        if (!window.AgoraEduSDK) {
          throw new Error('AgoraEduSDK not loaded from CDN');
        }

        // Try to launch the classroom
        const classroom = window.AgoraEduSDK.launch(containerRef.current, launchOptions);
        
        if (classroom && typeof classroom.destroy === 'function') {
          unmountRef.current = () => classroom.destroy();
        }

        console.log('Flexible Classroom launched successfully');
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
      if (unmountRef.current) {
        try {
          console.log('Cleaning up Flexible Classroom...');
          unmountRef.current();
        } catch (error) {
          console.warn('Error cleaning up classroom:', error);
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
                {!sdkLoaded ? 'Loading Flexible Classroom SDK...' : 'Initializing classroom...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexibleClassroom;
