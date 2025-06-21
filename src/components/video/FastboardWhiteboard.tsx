
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

  useEffect(() => {
    console.log('FastboardWhiteboard props received:', {
      roomUuid: roomUuid ? roomUuid.substring(0, 8) + '...' : 'undefined',
      appIdentifier: appIdentifier ? appIdentifier.substring(0, 8) + '...' : 'undefined',
      hasRoomToken: !!roomToken,
      tokenLength: roomToken?.length,
      userId,
      userRole
    });

    if (!whiteboardRef.current) {
      console.log('Whiteboard ref not ready');
      setError('Whiteboard container not ready');
      setIsLoading(false);
      return;
    }

    if (!roomUuid || !roomToken || !appIdentifier) {
      console.log('Missing whiteboard configuration:', {
        hasRoomUuid: !!roomUuid,
        hasRoomToken: !!roomToken,
        hasAppIdentifier: !!appIdentifier
      });
      setError('Missing whiteboard configuration');
      setIsLoading(false);
      return;
    }

    const initWhiteboard = async () => {
      try {
        console.log('Initializing whiteboard with:', { roomUuid, appIdentifier, userId });
        
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

        room.bindHtmlElement(whiteboardRef.current);
        
        room.callbacks.on('onRoomStateChanged', (modifyState) => {
          if (modifyState.roomPhase) {
            console.log('Room phase changed:', modifyState.roomPhase);
          }
        });

        setError(null);
        setIsLoading(false);
        console.log('Whiteboard initialized successfully');
      } catch (error) {
        console.error('Failed to initialize whiteboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
        setIsLoading(false);
      }
    };

    initWhiteboard();

    return () => {
      if (roomRef.current) {
        console.log('Cleaning up whiteboard');
        try {
          roomRef.current.disconnect();
        } catch (error) {
          console.warn('Error cleaning up whiteboard:', error);
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
          <div className="mt-4 text-xs text-gray-500">
            <p>Debug info:</p>
            <p>Room UUID: {roomUuid ? 'Present' : 'Missing'}</p>
            <p>Room Token: {roomToken ? 'Present' : 'Missing'}</p>
            <p>App ID: {appIdentifier ? 'Present' : 'Missing'}</p>
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
