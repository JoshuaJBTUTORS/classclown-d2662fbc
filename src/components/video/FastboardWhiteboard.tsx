
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [isDomReady, setIsDomReady] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const initAttemptRef = useRef(0);

  // Ref callback to detect when DOM element is ready
  const whiteboardRefCallback = useCallback((node: HTMLDivElement | null) => {
    whiteboardRef.current = node;
    if (node) {
      console.log('FastboardWhiteboard: DOM element is now ready');
      setIsDomReady(true);
    } else {
      setIsDomReady(false);
    }
  }, []);

  // Separate effect to wait for DOM readiness
  useEffect(() => {
    if (!isDomReady) {
      console.log('FastboardWhiteboard: Waiting for DOM element to be ready...');
      return;
    }

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
        // Double-check DOM element is still available
        if (!whiteboardRef.current) {
          throw new Error('Whiteboard container element not found');
        }

        console.log('FastboardWhiteboard: Initializing whiteboard with:', { 
          roomUuid: roomUuid.substring(0, 8) + '...',
          appIdentifier: appIdentifier.substring(0, 8) + '...',
          userId,
          userRole,
          isReadOnly
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

        // Ensure DOM element is still available before binding
        if (!whiteboardRef.current) {
          throw new Error('Whiteboard container became unavailable during initialization');
        }

        room.bindHtmlElement(whiteboardRef.current);
        
        room.callbacks.on('onRoomStateChanged', (modifyState) => {
          if (modifyState.roomPhase) {
            console.log('FastboardWhiteboard: Room phase changed:', modifyState.roomPhase);
          }
        });

        setError(null);
        setIsLoading(false);
        initAttemptRef.current = 0; // Reset attempt counter on success
        console.log('FastboardWhiteboard: Whiteboard initialized successfully');
      } catch (error) {
        console.error(`FastboardWhiteboard: Initialization attempt ${initAttemptRef.current} failed:`, error);
        
        // Retry logic
        if (initAttemptRef.current < maxAttempts && error instanceof Error && error.message.includes('container')) {
          console.log(`FastboardWhiteboard: Retrying in 1 second... (attempt ${initAttemptRef.current + 1}/${maxAttempts})`);
          setTimeout(() => {
            initWhiteboard();
          }, 1000);
          return;
        }

        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
        setIsLoading(false);
        initAttemptRef.current = 0; // Reset attempt counter
      }
    };

    // Small delay to ensure DOM is fully ready
    const timeoutId = setTimeout(() => {
      initWhiteboard();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDomReady, roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

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
            <p>DOM Ready: {isDomReady ? 'Yes' : 'No'}</p>
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
          <p className="text-gray-600">
            {!isDomReady ? 'Preparing whiteboard...' : 'Loading whiteboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div ref={whiteboardRefCallback} className="w-full h-full" />
    </div>
  );
};

export default FastboardWhiteboard;
