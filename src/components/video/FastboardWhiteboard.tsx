
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
    if (!roomUuid || !roomToken || !appIdentifier) {
      console.log('FastboardWhiteboard: Missing credentials, waiting...');
      setError('Missing whiteboard configuration');
      setIsLoading(false);
      return;
    }

    const initFastboard = async () => {
      try {
        console.log('FastboardWhiteboard: Initializing Fastboard with:', { 
          roomUuid: roomUuid.substring(0, 8) + '...',
          appIdentifier: appIdentifier.substring(0, 8) + '...',
          userId,
          userRole,
          isReadOnly
        });

        if (!whiteboardRef.current) {
          throw new Error('Whiteboard container element not found');
        }

        const app = await createFastboard({
          sdkConfig: {
            appIdentifier: appIdentifier,
            region: 'us-sv',
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

        appRef.current = app;

        // Mount the Fastboard to the DOM element
        mount(app, whiteboardRef.current);

        setError(null);
        setIsLoading(false);
        console.log('FastboardWhiteboard: Fastboard initialized successfully');
      } catch (error) {
        console.error('FastboardWhiteboard: Initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
        setIsLoading(false);
      }
    };

    // Small delay to ensure React ref is properly set
    const timeoutId = setTimeout(() => {
      console.log('FastboardWhiteboard: Starting initialization with DOM element:', !!whiteboardRef.current);
      initFastboard();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (appRef.current) {
        console.log('FastboardWhiteboard: Cleaning up Fastboard');
        try {
          appRef.current.destroy();
        } catch (error) {
          console.warn('FastboardWhiteboard: Error cleaning up Fastboard:', error);
        }
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 mb-2">Whiteboard Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Debug info:</p>
            <p>Room UUID: {roomUuid ? 'Present' : 'Missing'}</p>
            <p>Room Token: {roomToken ? 'Present' : 'Missing'}</p>
            <p>App ID: {appIdentifier ? 'Present' : 'Missing'}</p>
            <p>DOM Element: {whiteboardRef.current ? 'Present' : 'Missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Connecting to whiteboard...</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>DOM Element: {whiteboardRef.current ? 'Present' : 'Missing'}</p>
          </div>
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
