
import React, { useEffect, useRef, useState } from 'react';
import { createFastboard, mount } from '@netless/fastboard';

interface FastboardWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomUuid?: string;
  roomToken?: string;
  appIdentifier?: string;
  userId: string;
}

const FastboardWhiteboard: React.FC<FastboardWhiteboardProps> = ({ 
  isReadOnly = false, 
  userRole,
  roomUuid,
  roomToken,
  appIdentifier,
  userId
}) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appRef = useRef<any>(null);

  useEffect(() => {
    if (!whiteboardRef.current || !roomUuid || !roomToken || !appIdentifier) {
      setError('Missing whiteboard configuration');
      setIsLoading(false);
      return;
    }

    const initFastboard = async () => {
      try {
        console.log('Initializing Fastboard with:', { roomUuid, appIdentifier, userId });
        
        const app = await createFastboard({
          sdkConfig: {
            appIdentifier: appIdentifier,
            region: 'us-sv', // US Silicon Valley region
          },
          joinRoom: {
            uid: userId,
            uuid: roomUuid,
            roomToken: roomToken,
            isWritable: !isReadOnly && userRole === 'tutor',
          },
          managerConfig: {
            cursor: true,
          },
        });

        // Store app reference for cleanup
        appRef.current = app;

        // Mount the fastboard to the div
        mount(app, whiteboardRef.current);
        
        setError(null);
        setIsLoading(false);
        console.log('Fastboard initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Fastboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
        setIsLoading(false);
      }
    };

    initFastboard();

    return () => {
      if (appRef.current) {
        console.log('Cleaning up Fastboard');
        try {
          appRef.current.destroy();
        } catch (error) {
          console.warn('Error cleaning up Fastboard:', error);
        }
      }
    };
  }, [roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

  if (error) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 mb-2">Whiteboard Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div ref={whiteboardRef} className="w-full h-full" />
    </div>
  );
};

export default FastboardWhiteboard;
