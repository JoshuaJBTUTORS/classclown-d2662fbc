
import React, { useEffect, useRef, useState } from 'react';
import { createFastboard, mount } from '@netless/fastboard';
import { DocumentConversionService, ConversionTaskInfo } from '@/services/documentConversionService';

interface FastboardWhiteboardProps {
  isReadOnly?: boolean;
  userRole: 'tutor' | 'student';
  roomUuid?: string;
  roomToken?: string;
  appIdentifier?: string;
  userId: string;
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
            textSize: 14,
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
