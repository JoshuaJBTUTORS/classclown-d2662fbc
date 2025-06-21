
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react';

interface VideoCardProps {
  children?: React.ReactNode;
  userName: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isLocal?: boolean;
  isScreenSharing?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  children,
  userName,
  isAudioEnabled,
  isVideoEnabled,
  isLocal = false,
  isScreenSharing = false
}) => {
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={`relative bg-gray-800 border-gray-600 overflow-hidden aspect-video shadow-lg ${
      isLocal ? 'border-blue-500 border-2' : ''
    }`}>
      {/* Video content */}
      <div className="w-full h-full relative">
        {isVideoEnabled && children ? (
          children
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gray-600 text-white text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* User info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isScreenSharing && (
              <div className="bg-green-600 rounded-full p-1">
                <Monitor className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="text-white text-xs font-medium truncate">
              {userName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`rounded-full p-1 ${
              isAudioEnabled ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {isAudioEnabled ? (
                <Mic className="h-3 w-3 text-white" />
              ) : (
                <MicOff className="h-3 w-3 text-white" />
              )}
            </div>
            <div className={`rounded-full p-1 ${
              isVideoEnabled || isScreenSharing ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {isVideoEnabled || isScreenSharing ? (
                isScreenSharing ? (
                  <Monitor className="h-3 w-3 text-white" />
                ) : (
                  <Video className="h-3 w-3 text-white" />
                )
              ) : (
                <VideoOff className="h-3 w-3 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoCard;
