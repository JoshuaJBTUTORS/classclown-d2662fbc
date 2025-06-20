
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
    <Card className="relative bg-gray-900 border-gray-700 overflow-hidden aspect-video">
      {/* Video content */}
      <div className="w-full h-full relative">
        {isVideoEnabled && children ? (
          children
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-white text-lg">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* User info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {userName} {isLocal && '(You)'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isAudioEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
            {!isVideoEnabled && (
              <div className="bg-red-500 rounded-full p-1">
                <VideoOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
