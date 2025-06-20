
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageSquare } from 'lucide-react';

interface VideoControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-3">
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

        <Button
          variant="ghost"
          size="lg"
          className="rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900"
        >
          <Monitor className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="rounded-full w-12 h-12 p-0 text-gray-600 hover:text-gray-900"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        <div className="w-px h-8 bg-gray-200 mx-2" />

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

export default VideoControls;
