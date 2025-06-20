
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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{totalParticipants} participants</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Local Video */}
        <Card className="relative bg-gray-900 border-gray-700 overflow-hidden aspect-video">
          <div className="w-full h-full relative">
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
          </div>

          {/* User info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div className="flex items-center justify-between">
              <span className="text-white text-xs font-medium">
                You ({userRole === 'tutor' ? 'Teacher' : 'Student'})
              </span>
              <div className="flex items-center gap-1">
                {!isAudioEnabled && (
                  <div className="bg-red-500 rounded-full p-1">
                    <MicOff className="h-2 w-2 text-white" />
                  </div>
                )}
                {!isVideoEnabled && (
                  <div className="bg-red-500 rounded-full p-1">
                    <VideoOff className="h-2 w-2 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Remote Users */}
        {remoteUsers.map((user) => (
          <Card key={user.uid} className="relative bg-gray-900 border-gray-700 overflow-hidden aspect-video">
            <div className="w-full h-full relative">
              {user.hasVideo ? (
                <RemoteUser user={user} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {user.uid.toString().slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>

            {/* User info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium">
                  Participant {user.uid}
                </span>
                <div className="flex items-center gap-1">
                  {!user.hasAudio && (
                    <div className="bg-red-500 rounded-full p-1">
                      <MicOff className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {!user.hasVideo && (
                    <div className="bg-red-500 rounded-full p-1">
                      <VideoOff className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Empty slots placeholder */}
        {remoteUsers.length === 0 && (
          <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-gray-500 text-xs">+</span>
              </div>
              <p className="text-xs">Waiting for others</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPanel;
