
import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, RoomPhase } from 'white-web-sdk';
import { Button } from '@/components/ui/button';
import { Pen, Square, Circle, Type, Eraser, Trash2, Undo, Redo, Hand } from 'lucide-react';

interface AgoraWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomToken?: string;
  roomUuid?: string;
  userId: string;
}

const AgoraWhiteboard: React.FC<AgoraWhiteboardProps> = ({ 
  isReadOnly = false, 
  userRole,
  roomToken = 'demo-token',
  roomUuid = 'demo-room',
  userId
}) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [phase, setPhase] = useState<RoomPhase>(RoomPhase.Connecting);
  const [activeTool, setActiveTool] = useState<string>('selector');

  useEffect(() => {
    if (!whiteboardRef.current) return;

    const initWhiteboard = async () => {
      try {
        const whiteWebSdk = new WhiteWebSdk({
          appIdentifier: 'demo-app-id', // This should come from environment
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
          setPhase(phase);
        });

        setRoom(roomInstance);
      } catch (error) {
        console.error('Failed to initialize whiteboard:', error);
      }
    };

    initWhiteboard();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomToken, roomUuid, isReadOnly, userRole, userId]);

  const handleToolChange = (tool: string) => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    
    setActiveTool(tool);
    
    switch (tool) {
      case 'selector':
        room.setMemberState({ currentApplianceName: 'selector' });
        break;
      case 'pen':
        room.setMemberState({ currentApplianceName: 'pencil' });
        break;
      case 'rectangle':
        room.setMemberState({ currentApplianceName: 'rectangle' });
        break;
      case 'circle':
        room.setMemberState({ currentApplianceName: 'ellipse' });
        break;
      case 'eraser':
        room.setMemberState({ currentApplianceName: 'eraser' });
        break;
      case 'text':
        room.setMemberState({ currentApplianceName: 'text' });
        break;
    }
  };

  const handleUndo = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    room.undo();
  };

  const handleRedo = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    room.redo();
  };

  const handleClear = () => {
    if (!room || isReadOnly || userRole !== 'tutor') return;
    room.cleanCurrentScene();
  };

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

export default AgoraWhiteboard;
