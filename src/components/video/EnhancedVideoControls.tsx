
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Users,
  UserX,
  Record,
  Square
} from 'lucide-react';

interface EnhancedVideoControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  userRole: 'tutor' | 'student';
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onManageParticipants: () => void;
  onLeave: () => void;
}

const EnhancedVideoControls: React.FC<EnhancedVideoControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  userRole,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onManageParticipants,
  onLeave
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-3">
        {/* Basic Controls */}
        <Button
          variant={isAudioEnabled ? "default" : "destructive"}
          size="lg"
          onClick={onToggleAudio}
          className="rounded-full w-12 h-12 p-0"
        >
          {isAudioEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          onClick={onToggleVideo}
          className="rounded-full w-12 h-12 p-0"
        >
          {isVideoEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>

        {/* Screen Share */}
        <Button
          variant={isScreenSharing ? "default" : "ghost"}
          size="lg"
          onClick={onToggleScreenShare}
          className="rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900"
        >
          {isScreenSharing ? (
            <MonitorOff className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>

        {/* Tutor-only Controls */}
        {userRole === 'tutor' && (
          <>
            <div className="w-px h-8 bg-gray-200 mx-1" />
            
            {/* Recording */}
            <Button
              variant={isRecording ? "destructive" : "ghost"}
              size="lg"
              onClick={onToggleRecording}
              className="rounded-full w-12 h-12 p-0"
            >
              {isRecording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Record className="h-5 w-5" />
              )}
            </Button>

            {/* Participant Management */}
            <Button
              variant="ghost"
              size="lg"
              onClick={onManageParticipants}
              className="rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900"
            >
              <Users className="h-5 w-5" />
            </Button>
          </>
        )}

        <div className="w-px h-8 bg-gray-200 mx-2" />

        {/* Leave Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onLeave}
          className="rounded-full w-12 h-12 p-0"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedVideoControls;
