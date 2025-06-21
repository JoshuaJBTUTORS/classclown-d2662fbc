
import React from 'react';
import { RemoteUser, LocalVideoTrack } from 'agora-rtc-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';

interface VideoPanelProps {
  localCameraTrack?: any;
  remoteUsers: any[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  userRole: 'tutor' | 'student';
}

const VideoPanel: React.FC<VideoPanelProps> = ({
  localCameraTrack,
  remoteUsers,
  isAudioEnabled,
  isVideoEnabled,
  userRole
}) => {
  const totalParticipants = remoteUsers.length + 1;

  return (
    <div className="h-full p-4">
      <div className="grid grid-cols-2 gap-2 h-full">
        {/* Local user */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          {isVideoEnabled && localCameraTrack ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary text-white text-sm">
                  You
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
            You ({userRole})
          </div>
          
          <div className="absolute bottom-2 right-2 flex gap-1">
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

        {/* Remote users */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative bg-gray-800 rounded-lg overflow-hidden">
            <RemoteUser user={user} />
            <div className="absolute bottom-2 left-2 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
              User {user.uid}
            </div>
          </div>
        ))}
        
        {/* Empty slots placeholder */}
        {remoteUsers.length === 0 && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">Waiting for others</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPanel;
