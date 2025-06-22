import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UIBuilderClassroomProps {
  roomId: string;
  userUuid: string;
  userName: string;
  userRole: 'teacher' | 'student';
  rtmToken: string;
  appId: string;
  lessonTitle?: string;
  studentCount?: number;
  onError?: (error: string) => void;
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

const UIBuilderClassroom: React.FC<UIBuilderClassroomProps> = ({
  roomId,
  userUuid,
  userName,
  userRole,
  rtmToken,
  appId,
  lessonTitle,
  studentCount,
  onError,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkInstance, setSdkInstance] = useState<any>(null);

  useEffect(() => {
    const loadSDK = async () => {
      try {
        console.log('Loading Agora Education UI Builder SDK...');
        console.log('Classroom config:', {
          roomId,
          userUuid,
          userName,
          userRole,
          appId: appId?.substring(0, 8) + '...',
          rtmTokenPresent: !!rtmToken
        });
        
        // Check if SDK is already loaded
        if (window.AgoraEduSDK) {
          console.log('SDK already loaded, initializing classroom...');
          initializeClassroom();
          return;
        }
        
        // Load CSS first
        if (!document.querySelector('link[href*="edu_sdk"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://download.agora.io/edu-apaas/release/edu_sdk_2.8.111.bundle.css';
          cssLink.onload = () => console.log('CSS loaded successfully');
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
            console.log('Agora Education SDK loaded successfully');
            // Small delay to ensure SDK is fully initialized
            setTimeout(initializeClassroom, 100);
          };
          script.onerror = () => {
            throw new Error('Failed to load Agora Education SDK');
          };
          document.head.appendChild(script);
        }

      } catch (error: any) {
        console.error('Failed to load SDK:', error);
        setError(error.message);
        onError?.(error.message);
        setIsLoading(false);
      }
    };

    const initializeClassroom = async () => {
      try {
        if (!containerRef.current || !window.AgoraEduSDK) {
          throw new Error('SDK not loaded or container not available');
        }

        console.log('Initializing UI Builder Classroom...');

        // Validate required parameters
        if (!rtmToken) {
          throw new Error('RTM token is required for classroom initialization');
        }
        if (!appId) {
          throw new Error('App ID is required for classroom initialization');
        }
        if (!roomId) {
          throw new Error('Room ID is required for classroom initialization');
        }

        // Configure SDK
        window.AgoraEduSDK.config({
          appId,
          region: 'NA' // North America region
        });

        console.log('SDK configured, launching classroom...');

        // Launch classroom with vocational (small class) room type
        await window.AgoraEduSDK.launch(containerRef.current, {
          rtmToken,
          userUuid,
          userName,
          roomUuid: roomId,
          roleType: userRole === 'teacher' ? 1 : 2, // 1: teacher, 2: student
          roomType: 4, // 4: vocational class (small interactive classroom)
          roomName: lessonTitle || roomId,
          language: 'en',
          duration: 60 * 60 * 2, // 2 hours
          courseWareList: [],
          pretest: false,
          listener: (evt: any) => {
            console.log('Classroom event:', evt);
            if (evt.type === 'ready') {
              console.log('Classroom ready');
              setIsLoading(false);
              toast.success('Classroom connected successfully');
            } else if (evt.type === 'destroyed') {
              console.log('Classroom destroyed');
              onClose();
            } else if (evt.type === 'error') {
              console.error('Classroom error:', evt.data);
              const errorMsg = evt.data?.message || 'Classroom error occurred';
              setError(errorMsg);
              onError?.(errorMsg);
              toast.error(`Classroom error: ${errorMsg}`);
            }
          }
        });

        setSdkInstance(window.AgoraEduSDK);
        console.log('Classroom launched successfully');
        
      } catch (error: any) {
        console.error('Failed to initialize classroom:', error);
        setError(error.message);
        onError?.(error.message);
        setIsLoading(false);
        toast.error(`Failed to initialize classroom: ${error.message}`);
      }
    };

    loadSDK();

    // Cleanup
    return () => {
      if (sdkInstance) {
        try {
          console.log('Cleaning up classroom SDK');
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      }
    };
  }, [roomId, userUuid, userName, userRole, rtmToken, appId, lessonTitle, onError, onClose]);

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
            <p>Room: {roomId}</p>
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
      {/* Header */}
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
          {studentCount && studentCount > 0 && (
            <div className="text-sm text-gray-600">
              Expected students: {studentCount}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div className="text-lg font-medium text-gray-900">
              Loading Interactive Classroom...
            </div>
            <div className="text-sm text-gray-600">
              Initializing Agora UI Builder Vocational Class
            </div>
          </div>
        </div>
      )}

      {/* Classroom container */}
      <div 
        ref={containerRef}
        className="w-full h-full pt-16"
        style={{ 
          height: 'calc(100vh - 4rem)',
          width: '100vw'
        }}
      />
    </div>
  );
};

export default UIBuilderClassroom;
