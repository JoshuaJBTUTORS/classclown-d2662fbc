import React, { useEffect, useRef, useState } from 'react';
import { createFastboard, mount } from '@netless/fastboard';
import WhiteboardToolbar from './WhiteboardToolbar';
import { DocumentConversionService, ConversionTaskInfo } from '@/services/documentConversionService';

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
  const [conversionTasks, setConversionTasks] = useState<Map<string, ConversionTaskInfo>>(new Map());

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

  const handleDocumentInsert = async (documentUrl: string, fileName: string) => {
    if (!appRef.current) return;
    
    try {
      console.log('Starting Netless document conversion workflow:', documentUrl, fileName);
      
      // Start conversion process with Netless
      const taskInfo = await DocumentConversionService.convertDocument(
        lessonId || 'unknown',
        documentUrl,
        fileName
      );

      if (!taskInfo) {
        console.error('Failed to start Netless document conversion');
        alert(`Failed to convert document "${fileName}". Please try again.`);
        return;
      }

      // Track conversion task
      setConversionTasks(prev => new Map(prev.set(taskInfo.uuid, taskInfo)));

      console.log('Netless document conversion started:', taskInfo);
      
      // Poll for conversion completion with increased timeout
      const completedTask = await DocumentConversionService.pollConversionStatus(
        taskInfo.uuid,
        (progress) => {
          setConversionTasks(prev => new Map(prev.set(progress.uuid, progress)));
          console.log('Netless conversion progress:', progress);
        }
      );

      if (completedTask?.status === 'Finished' || (completedTask?.convertedPercentage === 100 && completedTask?.images)) {
        console.log('✅ Netless document conversion completed successfully:', {
          taskUuid: completedTask.uuid,
          status: completedTask.status,
          convertedPercentage: completedTask.convertedPercentage,
          imageCount: completedTask.images ? Object.keys(completedTask.images).length : 0,
          fileName
        });
        
        // Validate the required fields before attempting insertion
        const hasImages = completedTask.images && Object.keys(completedTask.images).length > 0;
        const hasPrefix = completedTask.prefix && completedTask.prefix.length > 0;

        console.log('Validation check:', {
          hasImages,
          hasPrefix,
          imageCount: hasImages ? Object.keys(completedTask.images).length : 0,
          prefix: hasPrefix ? completedTask.prefix.substring(0, 50) + '...' : 'missing',
          convertedPercentage: completedTask.convertedPercentage
        });

        if (!hasImages) {
          console.error('Document conversion completed but no images found');
          alert(`Document conversion completed but no content available for "${fileName}". This may be due to an empty or unsupported document format.`);
          
          // Remove from tracking
          setConversionTasks(prev => {
            const newMap = new Map(prev);
            newMap.delete(completedTask.uuid);
            return newMap;
          });
          return;
        }

        console.log('Inserting document with raw Netless format:', {
          uuid: completedTask.uuid,
          type: completedTask.type || 'static',
          status: completedTask.status || 'Finished',
          imageCount: Object.keys(completedTask.images).length,
          hasPrefix: !!completedTask.prefix,
          convertedPercentage: completedTask.convertedPercentage
        });
        
        try {
          // Insert the converted document using the raw Netless response
          appRef.current.insertDocs(completedTask);
          console.log('✅ Document inserted successfully into Fastboard whiteboard:', {
            fileName,
            taskUuid: completedTask.uuid,
            imageCount: Object.keys(completedTask.images).length
          });
        } catch (insertError) {
          console.error('Failed to insert document into Fastboard:', insertError);
          console.error('Data structure that failed:', completedTask);
          alert(`Failed to insert document "${fileName}" into whiteboard: ${insertError.message}`);
        }
        
        // Remove from tracking
        setConversionTasks(prev => {
          const newMap = new Map(prev);
          newMap.delete(completedTask.uuid);
          return newMap;
        });
        
        console.log('✅ Document conversion workflow completed successfully for:', fileName);
        
      } else if (completedTask?.status === 'Fail') {
        console.error('Netless document conversion failed:', completedTask.failedReason);
        alert(`Document conversion failed: ${completedTask.failedReason}`);
        
        // Remove from tracking
        setConversionTasks(prev => {
          const newMap = new Map(prev);
          newMap.delete(completedTask.uuid);
          return newMap;
        });
      } else {
        console.error('Netless document conversion timed out or failed');
        alert(`Document conversion timed out for "${fileName}". Please try again.`);
      }
      
    } catch (error) {
      console.error('Netless document insertion workflow failed:', error);
      alert(`Failed to process document "${fileName}": ${error.message}`);
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
      
      {/* Conversion Progress Display */}
      {conversionTasks.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-sm">
          {Array.from(conversionTasks.values()).map(task => (
            <div key={task.uuid} className="flex items-center gap-2">
              <span>Converting document...</span>
              {task.progress && (
                <span>({task.progress.convertedPercentage}%)</span>
              )}
            </div>
          ))}
        </div>
      )}
      
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
