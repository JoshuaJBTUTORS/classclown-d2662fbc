
import React from 'react';
import { Loader2 } from 'lucide-react';

interface VideoRoomLoadingProps {
  lessonTitle?: string;
  isLoadingNetless: boolean;
}

const VideoRoomLoading: React.FC<VideoRoomLoadingProps> = ({ 
  lessonTitle, 
  isLoadingNetless 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-gray-600 font-medium">Connecting to video conference...</p>
          <p className="text-sm text-gray-500 mt-1">Lesson: {lessonTitle}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isLoadingNetless ? 'Loading whiteboard...' : 'Getting credentials from Agora...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoRoomLoading;
