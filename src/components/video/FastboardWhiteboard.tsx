
import React, { useEffect, useRef } from 'react';
import { createFastboard, mount } from '@netless/fastboard';

interface FastboardWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomUuid?: string;
  roomToken?: string;
  agoraAppId?: string; // Changed from appIdentifier to agoraAppId
  userId: string;
}

const FastboardWhiteboard: React.FC<FastboardWhiteboardProps> = ({ 
  isReadOnly = false, 
  userRole,
  roomUuid,
  roomToken,
  agoraAppId, // Use Agora App ID instead of Netless app identifier
  userId
}) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    if (!roomUuid || !roomToken || !agoraAppId || !whiteboardRef.current) {
      console.warn('FastboardWhiteboard: Missing required props:', {
        roomUuid: !!roomUuid,
        roomToken: !!roomToken,
        agoraAppId: !!agoraAppId,
        whiteboardRef: !!whiteboardRef.current
      });
      return;
    }

    const initFastboard = async () => {
      try {
        console.log('Initializing Fastboard with Agora App ID:', agoraAppId);
        
        const app = await createFastboard({
          sdkConfig: {
            appIdentifier: agoraAppId, // Use the Agora App ID here
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
        mount(app, whiteboardRef.current);
        console.log('Fastboard initialized successfully');
      } catch (error) {
        console.error('FastboardWhiteboard initialization failed:', error);
      }
    };

    initFastboard();

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy();
        } catch (error) {
          console.warn('Error cleaning up Fastboard:', error);
        }
      }
    };
  }, [roomUuid, roomToken, agoraAppId, isReadOnly, userRole, userId]);

  if (!roomUuid || !roomToken || !agoraAppId) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600">Whiteboard not configured</p>
          <p className="text-gray-500 text-sm mt-2">
            Missing: {!roomUuid && 'Room UUID'} {!roomToken && 'Room Token'} {!agoraAppId && 'App ID'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div 
        ref={whiteboardRef} 
        className="w-full h-full" 
        style={{ width: '100%', height: '100%', minWidth: '400px', minHeight: '300px' }}
      />
    </div>
  );
};

export default FastboardWhiteboard;
