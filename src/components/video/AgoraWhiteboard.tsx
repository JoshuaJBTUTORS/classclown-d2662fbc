
import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, RoomPhase } from 'white-web-sdk';
import { Button } from '@/components/ui/button';
import { Pen, Square, Circle, Type, Eraser, Trash2, Undo, Redo, Hand } from 'lucide-react';

interface NetlessWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomUuid?: string;
  roomToken?: string;
  appIdentifier?: string;
  userId: string;
}

const NetlessWhiteboard: React.FC<NetlessWhiteboardProps> = ({ 
  isReadOnly = false, 
  userRole,
  roomUuid,
  roomToken,
  appIdentifier,
  userId
}) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<RoomPhase>(RoomPhase.Connecting);
  const [activeTool, setActiveTool] = useState<string>('selector');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!whiteboardRef.current || !roomUuid || !roomToken || !appIdentifier) {
      setError('Missing whiteboard configuration');
      return;
    }

    const initWhiteboard = async () => {
      try {
        console.log('Initializing Netless whiteboard with:', { roomUuid, appIdentifier });
        
        const whiteWebSdk = new WhiteWebSdk({
          appIdentifier: appIdentifier,
          region: "us-sv", // Set to US Silicon Valley region
          useMobXState: true,
        });

        const roomInstance = await whiteWebSdk.joinRoom({
          uuid: roomUuid,
          roomToken: roomToken,
          uid: userId,
          isWritable: !isReadOnly && userRole === 'tutor',
          disableNewPencil: false,
        });

        roomInstance.bindHtmlElement(whiteboardRef.current);
        
        roomInstance.callbacks.on('onPhaseChanged', (phase) => {
          console.log('Whiteboard phase changed:', phase);
          setPhase(phase);
        });

        roomInstance.callbacks.on('onRoomStateChanged', (modifyState) => {
          console.log('Room state changed:', modifyState);
        });

        setRoom(roomInstance);
        setError(null);
        console.log('Whiteboard initialized successfully');
      } catch (error) {
        console.error('Failed to initialize whiteboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize whiteboard');
      }
    };

    initWhiteboard();

    return () => {
      if (room) {
        console.log('Disconnecting from whiteboard');
        room.disconnect();
      }
    };
  }, [roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

  const handleToolChange = (tool: string) => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    
    setActiveTool(tool);
    
    try {
      switch (tool) {
        case 'selector':
          room.setMemberState({ currentApplianceName: 'clicker' as any });
          break;
        case 'pen':
          room.setMemberState({ currentApplianceName: 'pen' as any });
          break;
        case 'rectangle':
          room.setMemberState({ currentApplianceName: 'rectangle' as any });
          break;
        case 'circle':
          room.setMemberState({ currentApplianceName: 'ellipse' as any });
          break;
        case 'eraser':
          room.setMemberState({ currentApplianceName: 'eraser' as any });
          break;
        case 'text':
          room.setMemberState({ currentApplianceName: 'text' as any });
          break;
      }
    } catch (error) {
      console.error('Error changing tool:', error);
    }
  };

  const handleUndo = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    try {
      room.undo();
    } catch (error) {
      console.error('Error undoing:', error);
    }
  };

  const handleRedo = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    try {
      room.redo();
    } catch (error) {
      console.error('Error redoing:', error);
    }
  };

  const handleClear = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    try {
      room.cleanCurrentScene();
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
    }
  };

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

  if (isReadOnly || userRole === 'student') {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div ref={whiteboardRef} className="w-full h-full" />
        {phase === RoomPhase.Connecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">Connecting to whiteboard...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Whiteboard Toolbar - Only for tutors */}
      {userRole === 'tutor' && (
        <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
          <Button
            variant={activeTool === 'selector' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('selector')}
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('pen')}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('rectangle')}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'circle' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('circle')}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('text')}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTool === 'eraser' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleToolChange('eraser')}
          >
            <Eraser className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <Button variant="ghost" size="sm" onClick={handleUndo}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRedo}>
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Whiteboard Canvas */}
      <div className="flex-1 relative">
        <div ref={whiteboardRef} className="w-full h-full" />
        {phase === RoomPhase.Connecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-600">Connecting to whiteboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetlessWhiteboard;
