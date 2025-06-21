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
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentFont, setCurrentFont] = useState('Sans');
  const [currentFontSize, setCurrentFontSize] = useState(14);
  const [tabs, setTabs] = useState<WhiteboardTab[]>([
    { id: 'main', name: 'Main Room', type: 'main', scenePath: '/init' }
  ]);
  const [activeTabId, setActiveTabId] = useState('main');

  // Extract lesson ID from URL if available
  const lessonId = typeof window !== 'undefined' ? 
    window.location.pathname.split('/video-room/')[1] : undefined;

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
        
        // Set initial drawing properties
        if (app.room && !isReadOnly && userRole === 'tutor') {
          app.room.setMemberState({
            strokeColor: [0, 0, 0], // Black
            strokeWidth: 2,
            textSize: currentFontSize,
          });
        }
        
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

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (!appRef.current?.room) return;
    
    try {
      // Convert hex to RGB
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      appRef.current.room.setMemberState({ 
        strokeColor: [r, g, b] 
      });
      console.log('Changed stroke color to:', color);
    } catch (error) {
      console.error('Error changing color:', error);
    }
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    if (!appRef.current?.room) return;
    
    try {
      appRef.current.room.setMemberState({ 
        textSize: currentFontSize,
        // Note: Fastboard may have limitations on font family changes
      });
      console.log('Changed font to:', font);
    } catch (error) {
      console.error('Error changing font:', error);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    if (!appRef.current?.room) return;
    
    try {
      appRef.current.room.setMemberState({ 
        textSize: size 
      });
      console.log('Changed font size to:', size);
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
    
    if (!appRef.current?.room) return;
    
    try {
      // Note: Text formatting in Fastboard may be limited
      // This is a placeholder for when Fastboard supports rich text formatting
      console.log('Toggled format:', format, 'Active:', newFormats.has(format));
    } catch (error) {
      console.error('Error toggling format:', error);
    }
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (!appRef.current?.room) return;
    
    try {
      // Note: Text alignment in Fastboard may be limited
      console.log('Changed alignment to:', alignment);
    } catch (error) {
      console.error('Error changing alignment:', error);
    }
  };

  const handleListToggle = (type: 'bullet' | 'numbered') => {
    if (!appRef.current?.room) return;
    
    try {
      // Note: List formatting in Fastboard may be limited
      console.log('Toggled list type:', type);
    } catch (error) {
      console.error('Error toggling list:', error);
    }
  };

  const handleImageInsert = (imageUrl: string) => {
    if (!appRef.current?.room) return;
    
    try {
      console.log('Inserting image:', imageUrl);
      
      // Insert image into whiteboard
      appRef.current.insertImage(imageUrl);
      
      console.log('Image inserted successfully');
    } catch (error) {
      console.error('Error inserting image:', error);
    }
  };

  const getFileTypeFromUrl = (url: string, fileName: string): 'pdf' | 'office' | 'media' | 'unknown' => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (extension === 'pdf') return 'pdf';
    if (['ppt', 'pptx', 'doc', 'docx'].includes(extension)) return 'office';
    if (['mp3', 'mp4', 'mov', 'avi'].includes(extension)) return 'media';
    
    return 'unknown';
  };

  const handleDocumentInsert = (documentUrl: string, fileName: string) => {
    if (!appRef.current) return;
    
    try {
      console.log('Inserting document:', documentUrl, fileName);
      
      const fileType = getFileTypeFromUrl(documentUrl, fileName);
      
      switch (fileType) {
        case 'media':
          // Use insertMedia for media files
          appRef.current.insertMedia(fileName, documentUrl);
          console.log('Media document inserted successfully');
          break;
          
        case 'pdf':
        case 'office':
          // For PDF and Office docs, create a simple document structure
          // Since we don't have conversion service, create a basic docs structure
          const docsData = {
            uuid: `doc_${Date.now()}`,
            type: 'static',
            status: 'Finished',
            progress: {
              totalPageSize: 1,
              convertedPageSize: 1,
              convertedPercentage: 100,
              convertedFileList: [
                {
                  width: 800,
                  height: 600,
                  conversionFileUrl: documentUrl,
                  preview: documentUrl
                }
              ]
            }
          };
          
          appRef.current.insertDocs(fileName, docsData);
          console.log('Document inserted successfully');
          break;
          
        default:
          // Fallback: try to insert as media first, then as image
          try {
            appRef.current.insertMedia(fileName, documentUrl);
            console.log('Document inserted as media');
          } catch (mediaError) {
            console.warn('Failed to insert as media, trying as image:', mediaError);
            appRef.current.insertImage(documentUrl);
            console.log('Document inserted as image');
          }
          break;
      }
      
    } catch (error) {
      console.error('Error inserting document:', error);
      
      // Final fallback: show error message
      console.error('Failed to insert document. URL:', documentUrl, 'Error:', error.message);
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
        onTabSwitch={handleTabSwitch}
        onTabClose={handleTabClose}
        onColorChange={handleColorChange}
        onFontChange={handleFontChange}
        onFontSizeChange={handleFontSizeChange}
        onFormatToggle={handleFormatToggle}
        onAlignmentChange={handleAlignmentChange}
        onListToggle={handleListToggle}
        onImageInsert={handleImageInsert}
        onDocumentInsert={handleDocumentInsert}
        activeFormats={activeFormats}
        currentColor={currentColor}
        currentFont={currentFont}
        currentFontSize={currentFontSize}
        tabs={tabs}
        activeTabId={activeTabId}
        lessonId={lessonId}
      />
      
      {/* Whiteboard Canvas */}
      <div 
        ref={whiteboardRef} 
        className="flex-1 w-full bg-white" 
        style={{ width: '100%', height: '100%', minWidth: '400px', minHeight: '300px' }}
      />
    </div>
  );
};

export default FastboardWhiteboard;
