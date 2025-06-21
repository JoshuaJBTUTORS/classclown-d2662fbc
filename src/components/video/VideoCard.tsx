
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface VideoCardProps {
  userName: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isLocal?: boolean;
  children?: React.ReactNode;
}

const VideoCard: React.FC<VideoCardProps> = ({
  userName,
  isAudioEnabled = true,
  isVideoEnabled = true,
  isLocal = false,
  children
}) => {
  return (
    <Card className="relative bg-gray-900 border-gray-600 overflow-hidden aspect-video shadow-lg hover:shadow-xl transition-shadow">
      {/* Video content */}
      <div className="w-full h-full relative">
        {isVideoEnabled && children ? (
          <div className="w-full h-full">
            {children}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-white text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* User info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-medium truncate">
              {userName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isAudioEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <MicOff className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            {!isVideoEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <VideoOff className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
