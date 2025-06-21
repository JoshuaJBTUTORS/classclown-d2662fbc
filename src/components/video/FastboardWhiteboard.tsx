
import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, RoomPhase } from 'white-web-sdk';

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
  const roomRef = useRef<Room | null>(null);
  const initAttemptRef = useRef(0);

  // Effect to initialize whiteboard
  useEffect(() => {
    if (!roomUuid || !roomToken || !appIdentifier) {
      console.log('FastboardWhiteboard: Missing credentials, waiting...');
      setError('Missing whiteboard configuration');
      setIsLoading(false);
      return;
    }

    const initWhiteboard = async () => {
      const maxAttempts = 3;
      initAttemptRef.current += 1;
      
      console.log(`FastboardWhiteboard: Initialization attempt ${initAttemptRef.current}/${maxAttempts}`);

      try {
        // Check if DOM element is available
        if (!whiteboardRef.current) {
          console.error('FastboardWhiteboard: DOM element not available during initialization');
          throw new Error('Whiteboard container element not found during initialization');
        }

        console.log('FastboardWhiteboard: Initializing whiteboard with:', { 
          roomUuid: roomUuid.substring(0, 8) + '...',
          appIdentifier: appIdentifier.substring(0, 8) + '...',
          userId,
          userRole,
          isReadOnly,
          domElement: !!whiteboardRef.current
        });
        
        const whiteWebSdk = new WhiteWebSdk({
          appIdentifier: appIdentifier,
          region: 'us-sv',
        });

        const room = await whiteWebSdk.joinRoom({
          uuid: roomUuid,
          roomToken: roomToken,
          uid: userId,
          isWritable: !isReadOnly && userRole === 'tutor',
        });

        roomRef.current = room;

        // Final check before binding
        if (!whiteboardRef.current) {
          throw new Error('Whiteboard container became unavailable during room join');
        }

        room.bindHtmlElement(whiteboardRef.current);
        
        room.callbacks.on('onRoomStateChanged', (modifyState) => {
          if (modifyState.roomPhase) {
            console.log('FastboardWhiteboard: Room phase changed:', modifyState.roomPhase);
          }
        });

        setError(null);
        setIsLoading(false);
        initAttemptRef.current = 0;
        console.log('FastboardWhiteboard: Whiteboard initialized successfully');
      } catch (error) {
        console.error(`FastboardWhiteboard: Initialization attempt ${initAttemptRef.current} failed:`, error);
        
        // Retry logic for container-related errors only
        if (initAttemptRef.current < maxAttempts && 
            error instanceof Error && 
            (error.message.includes('container') || error.message.includes('element'))) {
          console.log(`FastboardWhiteboard: Retrying in 1 second... (attempt ${initAttemptRef.current + 1}/${maxAttempts})`);
          setTimeout(() => {
            initWhiteboard();
          }, 1000);
          return;
        }

        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
        setIsLoading(false);
        initAttemptRef.current = 0;
      }
    };

    // Small delay to ensure React ref is properly set
    const timeoutId = setTimeout(() => {
      console.log('FastboardWhiteboard: Starting initialization with DOM element:', !!whiteboardRef.current);
      initWhiteboard();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        console.log('FastboardWhiteboard: Cleaning up whiteboard');
        try {
          roomRef.current.disconnect();
        } catch (error) {
          console.warn('FastboardWhiteboard: Error cleaning up whiteboard:', error);
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
            <p>Init Attempts: {initAttemptRef.current}</p>
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
