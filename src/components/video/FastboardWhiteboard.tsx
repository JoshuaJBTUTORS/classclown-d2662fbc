
import React, { useEffect, useRef, useState } from 'react';
import { createFastboard, mount } from '@netless/fastboard';
import WhiteboardToolbar from './WhiteboardToolbar';

interface FastboardWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomUuid?: string;
  roomToken?: string;
  appIdentifier?: string;
  userId: string;
}

// The correct Netless App Identifier - always use this as fallback
const CORRECT_NETLESS_APP_IDENTIFIER = 'TORbYEt7EfCzGuPZ97oCJA/9M23Doi-qTMNAg';

const FastboardWhiteboard: React.FC<FastboardWhiteboardProps> = ({ 
  isReadOnly = false, 
  userRole,
  roomUuid,
  roomToken,
  appIdentifier,
  userId
}) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentFontSize, setCurrentFontSize] = useState<'small' | 'normal' | 'large'>('normal');

  useEffect(() => {
    const finalAppIdentifier = appIdentifier || CORRECT_NETLESS_APP_IDENTIFIER;
    
    if (!roomUuid || !roomToken || !whiteboardRef.current) {
      console.warn('FastboardWhiteboard: Missing required props:', {
        roomUuid: !!roomUuid,
        roomToken: !!roomToken,
        appIdentifier: !!finalAppIdentifier,
        whiteboardRef: !!whiteboardRef.current
      });
      return;
    }

    console.log('FastboardWhiteboard: Initializing with credentials:', {
      roomUuid: roomUuid.substring(0, 8) + '...',
      appIdentifier: finalAppIdentifier,
      userId,
      userRole,
      isReadOnly
    });

    const initFastboard = async () => {
      try {
        console.log('Initializing Fastboard with Netless App Identifier:', finalAppIdentifier);
        
        const app = await createFastboard({
          sdkConfig: {
            appIdentifier: finalAppIdentifier,
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
        console.error('Initialization details:', {
          appIdentifier: finalAppIdentifier,
          roomUuid,
          tokenLength: roomToken?.length,
          userId,
          error: error.message
        });
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
  }, [roomUuid, roomToken, appIdentifier, isReadOnly, userRole, userId]);

  const handleNewTab = () => {
    if (!appRef.current) return;
    try {
      // Create a new scene/page in the whiteboard
      const sceneIndex = appRef.current.getScenes().length;
      appRef.current.putScenes('/' + (sceneIndex + 1), [{ name: `Page ${sceneIndex + 1}` }]);
      appRef.current.setSceneIndex(sceneIndex);
      console.log('Created new whiteboard tab');
    } catch (error) {
      console.error('Error creating new tab:', error);
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (!appRef.current) return;
    try {
      // Update the stroke color for drawing tools
      appRef.current.setMemberState({ strokeColor: [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16)
      ] });
      console.log('Changed color to:', color);
    } catch (error) {
      console.error('Error changing color:', error);
    }
  };

  const handleFontSizeChange = (size: 'small' | 'normal' | 'large') => {
    setCurrentFontSize(size);
    if (!appRef.current) return;
    try {
      const fontSize = size === 'small' ? 12 : size === 'large' ? 24 : 16;
      appRef.current.setMemberState({ textSize: fontSize });
      console.log('Changed font size to:', size, fontSize);
    } catch (error) {
      console.error('Error changing font size:', error);
    }
  };

  const handleFormatToggle = (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'highlight') => {
    const newFormats = new Set(activeFormats);
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    setActiveFormats(newFormats);
    
    if (!appRef.current) return;
    try {
      // Apply text formatting - this would need to be implemented based on Fastboard's text formatting API
      console.log('Toggled format:', format, 'Active:', newFormats.has(format));
    } catch (error) {
      console.error('Error toggling format:', error);
    }
  };

  const finalAppIdentifier = appIdentifier || CORRECT_NETLESS_APP_IDENTIFIER;

  if (!roomUuid || !roomToken) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600">Whiteboard not configured</p>
          <p className="text-gray-500 text-sm mt-2">
            Missing: {!roomUuid && 'Room UUID'} {!roomToken && 'Room Token'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            App ID: {finalAppIdentifier.substring(0, 20)}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {/* Whiteboard Toolbar */}
      <WhiteboardToolbar
        userRole={userRole}
        onNewTab={handleNewTab}
        onColorChange={handleColorChange}
        onFontSizeChange={handleFontSizeChange}
        onFormatToggle={handleFormatToggle}
        activeFormats={activeFormats}
        currentColor={currentColor}
        currentFontSize={currentFontSize}
      />
      
      {/* Whiteboard Canvas */}
      <div 
        ref={whiteboardRef} 
        className="flex-1 w-full" 
        style={{ width: '100%', height: '100%', minWidth: '400px', minHeight: '300px' }}
      />
    </div>
  );
};

export default FastboardWhiteboard;
