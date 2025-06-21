
import React from 'react';
import { RemoteUser, LocalVideoTrack } from 'agora-rtc-react';
import VideoCard from './VideoCard';

interface VerticalVideoGridProps {
  localCameraTrack?: any;
  remoteUsers: any[];
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  userRole: 'tutor' | 'student';
}

const VerticalVideoGrid: React.FC<VerticalVideoGridProps> = ({
  localCameraTrack,
  remoteUsers,
  isAudioEnabled,
  isVideoEnabled,
  userRole
}) => {
  const totalParticipants = remoteUsers.length + 1;
  
  // Determine grid layout based on participant count
  const gridCols = totalParticipants > 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="h-full p-3 overflow-y-auto">
      <div className={`grid ${gridCols} gap-3 auto-rows-max`}>
        {/* Local user video */}
        <VideoCard
          userName={`You (${userRole})`}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isLocal={true}
        >
          {isVideoEnabled && localCameraTrack ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              className="w-full h-full object-cover"
            />
          ) : null}
        </VideoCard>

        {/* Remote users */}
        {remoteUsers.map((user) => (
          <VideoCard
            key={user.uid}
            userName={`User ${user.uid}`}
            isAudioEnabled={user.hasAudio}
            isVideoEnabled={user.hasVideo}
            isLocal={false}
          >
            <RemoteUser user={user} />
          </VideoCard>
        ))}
        
        {/* Placeholder for when waiting for participants */}
        {remoteUsers.length === 0 && (
          <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs">+</span>
              </div>
              <p className="text-xs">Waiting for others</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerticalVideoGrid;
