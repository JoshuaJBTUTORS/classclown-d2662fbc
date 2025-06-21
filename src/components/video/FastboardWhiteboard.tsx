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

interface WhiteboardTab {
  id: string;
  name: string;
  type: 'main' | 'document';
  scenePath: string;
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
  const [tabs, setTabs] = useState<WhiteboardTab[]>([
    { id: 'main', name: 'Main Room', type: 'main', scenePath: '/init' }
  ]);
  const [activeTabId, setActiveTabId] = useState('main');

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
        console.log('Initializing Fastboard with native toolbar enabled');
        
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
          // Enable Fastboard's native UI components including toolbar
          ui: {
            toolbar: userRole === 'tutor' && !isReadOnly,
          },
        });

        appRef.current = app;
        mount(app, whiteboardRef.current);
        
        console.log('Fastboard initialized successfully with native toolbar');
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
    if (!appRef.current?.room) return;
    
    try {
      const newTabId = `doc${tabs.length}`;
      const sceneName = `Document-${tabs.length}`;
      const scenePath = `/${sceneName}`;
      
      // Create new scene in root directory using putScenes
      appRef.current.room.putScenes('/', [{ 
        name: sceneName,
        ppt: undefined 
      }]);
      
      const newTab: WhiteboardTab = {
        id: newTabId,
        name: `Document ${tabs.length}`,
        type: 'document',
        scenePath
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTabId);
      
      // Switch to the new scene using setScenePath
      appRef.current.room.setScenePath(scenePath);
      
      console.log('Created new whiteboard tab:', newTab);
    } catch (error) {
      console.error('Error creating new tab:', error);
    }
  };

  const handleTabSwitch = (tabId: string) => {
    if (!appRef.current?.room) return;
    
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    try {
      setActiveTabId(tabId);
      // Use setScenePath for more reliable scene switching
      appRef.current.room.setScenePath(tab.scenePath);
      console.log('Switched to tab:', tab);
    } catch (error) {
      console.error('Error switching tab:', error);
    }
  };

  const handleTabClose = (tabId: string) => {
    if (tabId === 'main' || !appRef.current?.room) return;
    
    try {
      const tabToClose = tabs.find(t => t.id === tabId);
      if (!tabToClose) return;
      
      // Remove the specific scene using removeScenes
      appRef.current.room.removeScenes(tabToClose.scenePath);
      
      // Update tabs state
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      
      // Switch to main tab if closing active tab
      if (activeTabId === tabId) {
        setActiveTabId('main');
        appRef.current.room.setScenePath('/init');
      }
      
      console.log('Closed tab:', tabId);
    } catch (error) {
      console.error('Error closing tab:', error);
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
      {/* Minimal tab management for tutors only */}
      {userRole === 'tutor' && tabs.length > 1 && (
        <div className="bg-gray-100 border-b border-gray-200 flex items-center px-4 py-2">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <div 
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer transition-colors text-sm ${
                  activeTabId === tab.id 
                    ? 'bg-white text-gray-800 shadow-sm' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
                onClick={() => handleTabSwitch(tab.id)}
              >
                <span>{tab.name}</span>
                {tab.id !== 'main' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(tab.id);
                    }}
                    className="hover:bg-gray-400 rounded p-1 ml-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleNewTab}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              + New
            </button>
          </div>
        </div>
      )}
      
      {/* Whiteboard Canvas - Fastboard will render its native toolbar here */}
      <div 
        ref={whiteboardRef} 
        className="flex-1 w-full bg-white" 
        style={{ width: '100%', height: '100%', minWidth: '400px', minHeight: '300px' }}
      />
    </div>
  );
};

export default FastboardWhiteboard;
