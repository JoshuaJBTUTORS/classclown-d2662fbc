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

// Add type definitions for Netless image data
interface NetlessImageData {
  url: string;
  width?: number;
  height?: number;
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
  const [currentColor, setCurrentColor] = useState('#FFFFFF'); // White default
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
          }
        });

        appRef.current = app;
        mount(app, whiteboardRef.current);
        
        // Set initial drawing properties with white pen
        if (app.room && !isReadOnly && userRole === 'tutor') {
          app.room.setMemberState({
            strokeColor: [255, 255, 255], // White pen color
            strokeWidth: 2,
            textSize: currentFontSize,
          });
        }
        
        console.log('Fastboard initialized successfully with white pen');
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

  // Enhanced transformation to match Fastboard's expected format
  const transformNetlessToFastboard = (netlessTask: ConversionTaskInfo, fileName: string) => {
    try {
      console.log('🔄 Transforming Netless response for Fastboard:', {
        taskUuid: netlessTask.uuid,
        type: netlessTask.type,
        status: netlessTask.status,
        hasImages: !!netlessTask.images,
        hasPrefix: !!netlessTask.prefix,
        convertedPercentage: netlessTask.convertedPercentage
      });

      // Validate required data
      if (!netlessTask.images || !netlessTask.prefix) {
        throw new Error('Missing required images or prefix data from Netless response');
      }

      const imageEntries = Object.entries(netlessTask.images);
      console.log('📄 Processing pages:', {
        totalPages: imageEntries.length,
        samplePage: imageEntries[0] ? `Page ${imageEntries[0][0]}` : 'none'
      });

      // Transform images to Fastboard format
      const convertedFileList = imageEntries
        .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by page number
        .map(([pageNumber, imageData]) => {
          console.log(`📑 Processing page ${pageNumber}:`, typeof imageData, imageData);
          
          let imageUrl: string;
          let width = 1280;
          let height = 720;
          
          // Handle different image data formats
          if (typeof imageData === 'string') {
            imageUrl = imageData;
          } else if (imageData && typeof imageData === 'object') {
            const typedImageData = imageData as NetlessImageData;
            if (typedImageData.url) {
              imageUrl = typedImageData.url;
              width = typedImageData.width || width;
              height = typedImageData.height || height;
            } else {
              throw new Error(`Invalid image data structure for page ${pageNumber}`);
            }
          } else {
            throw new Error(`Unsupported image data type for page ${pageNumber}: ${typeof imageData}`);
          }

          // Construct full URLs using prefix if needed
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${netlessTask.prefix}${imageUrl}`;
          
          console.log(`✅ Page ${pageNumber} processed:`, {
            width,
            height,
            urlLength: fullImageUrl.length,
            urlPrefix: fullImageUrl.substring(0, 50) + '...'
          });

          // For static documents, both conversionFileUrl and preview use the same image URL
          // For dynamic documents, we would need different URLs, but most PDFs are static
          return {
            width,
            height,
            conversionFileUrl: fullImageUrl,
            preview: fullImageUrl
          };
        });

      console.log('📊 Conversion file list created:', {
        totalPages: convertedFileList.length,
        firstPageDimensions: convertedFileList[0] ? `${convertedFileList[0].width}x${convertedFileList[0].height}` : 'none'
      });

      // Create Fastboard-compatible response
      const fastboardResponse = {
        uuid: netlessTask.uuid,
        type: netlessTask.type || 'static', // Default to static for most PDF conversions
        status: netlessTask.status,
        progress: {
          totalPageSize: convertedFileList.length,
          convertedPageSize: convertedFileList.length,
          convertedPercentage: netlessTask.convertedPercentage || 100,
          convertedFileList,
          currentStep: "Packaging"
        }
      };

      console.log('✅ Fastboard response created successfully:', {
        uuid: fastboardResponse.uuid,
        type: fastboardResponse.type,
        status: fastboardResponse.status,
        totalPages: fastboardResponse.progress.totalPageSize,
        convertedPercentage: fastboardResponse.progress.convertedPercentage
      });

      return fastboardResponse;
    } catch (error) {
      console.error('❌ Failed to transform Netless response:', error);
      console.error('📋 Debug info:', {
        taskUuid: netlessTask.uuid,
        taskType: netlessTask.type,
        taskStatus: netlessTask.status,
        hasImages: !!netlessTask.images,
        hasPrefix: !!netlessTask.prefix,
        imagesType: typeof netlessTask.images,
        prefixType: typeof netlessTask.prefix
      });
      throw error;
    }
  };

  const handleDocumentInsert = async (documentUrl: string, fileName: string) => {
    if (!appRef.current) return;
    
    try {
      console.log('🚀 Starting document conversion workflow:', { documentUrl, fileName, lessonId });
      
      // Start conversion process with Netless
      const taskInfo = await DocumentConversionService.convertDocument(
        lessonId || 'unknown',
        documentUrl,
        fileName
      );

      if (!taskInfo) {
        console.error('❌ Failed to start document conversion');
        alert(`Failed to convert document "${fileName}". Please try again.`);
        return;
      }

      // Track conversion task
      setConversionTasks(prev => new Map(prev.set(taskInfo.uuid, taskInfo)));
      console.log('⏳ Document conversion started:', taskInfo);
      
      // Poll for conversion completion
      const completedTask = await DocumentConversionService.pollConversionStatus(
        taskInfo.uuid,
        (progress) => {
          setConversionTasks(prev => new Map(prev.set(progress.uuid, progress)));
          console.log('📈 Conversion progress:', progress);
        }
      );

      if (completedTask?.status === 'Finished' || (completedTask?.convertedPercentage === 100 && completedTask?.images)) {
        console.log('✅ Document conversion completed:', {
          taskUuid: completedTask.uuid,
          status: completedTask.status,
          convertedPercentage: completedTask.convertedPercentage,
          imageCount: completedTask.images ? Object.keys(completedTask.images).length : 0,
          fileName
        });
        
        // Validate required fields
        const hasImages = completedTask.images && Object.keys(completedTask.images).length > 0;
        const hasPrefix = completedTask.prefix && completedTask.prefix.length > 0;

        if (!hasImages) {
          console.error('❌ No images found in conversion result');
          alert(`Document conversion completed but no content available for "${fileName}".`);
          setConversionTasks(prev => {
            const newMap = new Map(prev);
            newMap.delete(completedTask.uuid);
            return newMap;
          });
          return;
        }

        try {
          // Transform the Netless response to Fastboard format
          const fastboardData = transformNetlessToFastboard(completedTask, fileName);
          
          console.log('🎯 Inserting document with transformed data:', {
            documentTitle: fileName,
            uuid: fastboardData.uuid,
            type: fastboardData.type,
            status: fastboardData.status,
            pageCount: fastboardData.progress.convertedFileList.length
          });
          
          // Insert the document using Fastboard API
          await appRef.current.insertDocs(fileName, fastboardData);
          
          console.log('🎉 Document inserted successfully into Fastboard:', {
            fileName,
            taskUuid: completedTask.uuid,
            pageCount: fastboardData.progress.convertedFileList.length
          });
          
        } catch (insertError) {
          console.error('❌ Failed to insert document into Fastboard:', insertError);
          
          // Fallback: try inserting the first image
          try {
            const firstImageData = Object.values(completedTask.images)[0] as string | NetlessImageData;
            let firstImageUrl: string | undefined;
            
            if (typeof firstImageData === 'string') {
              firstImageUrl = firstImageData;
            } else if (firstImageData && typeof firstImageData === 'object' && (firstImageData as NetlessImageData).url) {
              firstImageUrl = (firstImageData as NetlessImageData).url;
            }
            
            if (firstImageUrl) {
              // Ensure full URL
              const fullUrl = firstImageUrl.startsWith('http') ? firstImageUrl : `${completedTask.prefix}${firstImageUrl}`;
              console.log('🔄 Attempting fallback image insertion:', fullUrl);
              await appRef.current.insertImage(fullUrl);
              alert(`Could not insert "${fileName}" as a document, but inserted the first page as an image.`);
            } else {
              throw new Error('No valid image URL available for fallback');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback image insertion failed:', fallbackError);
            alert(`Failed to insert document "${fileName}": ${insertError.message}`);
          }
        }
        
        // Remove from tracking
        setConversionTasks(prev => {
          const newMap = new Map(prev);
          newMap.delete(completedTask.uuid);
          return newMap;
        });
        
      } else if (completedTask?.status === 'Fail') {
        console.error('❌ Document conversion failed:', completedTask.failedReason);
        alert(`Document conversion failed: ${completedTask.failedReason}`);
        setConversionTasks(prev => {
          const newMap = new Map(prev);
          newMap.delete(completedTask.uuid);
          return newMap;
        });
      } else {
        console.error('⏰ Document conversion timed out');
        alert(`Document conversion timed out for "${fileName}". Please try again.`);
      }
      
    } catch (error) {
      console.error('💥 Document insertion workflow failed:', error);
      alert(`Failed to process document "${fileName}": ${error.message}`);
    }
  };

  const finalAppIdentifier = appIdentifier || CORRECT_NETLESS_APP_IDENTIFIER;

  if (!roomUuid || !roomToken) {
    return (
      <div className="flex-1 bg-black border border-gray-600 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-300">Whiteboard not configured</p>
          <p className="text-gray-400 text-sm mt-2">
            Missing: {!roomUuid && 'Room UUID'} {!roomToken && 'Room Token'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            App ID: {finalAppIdentifier.substring(0, 20)}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black border border-gray-600 rounded-lg overflow-hidden flex flex-col">
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
        <div className="bg-blue-900 border-b border-blue-700 p-2 text-sm">
          {Array.from(conversionTasks.values()).map(task => (
            <div key={task.uuid} className="flex items-center gap-2 text-blue-100">
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
        className="flex-1 w-full bg-black" 
        style={{ width: '100%', height: '100%', minWidth: '400px', minHeight: '300px' }}
      />
    </div>
  );
};

export default FastboardWhiteboard;
