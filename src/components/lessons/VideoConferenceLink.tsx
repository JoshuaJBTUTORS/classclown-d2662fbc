
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Video,
  Users,
  Loader2,
  ExternalLink,
  Play
} from 'lucide-react';

interface VideoConferenceLinkProps {
  lessonId: string;
  lessonSpaceRoomUrl?: string | null;
  lessonSpaceRoomId?: string | null;
  lessonSpaceSpaceId?: string | null;
  className?: string;
  isGroupLesson?: boolean;
  studentCount?: number;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({
  lessonId,
  lessonSpaceRoomUrl,
  lessonSpaceRoomId,
  lessonSpaceSpaceId,
  className = "",
  isGroupLesson = false,
  studentCount = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (!lessonSpaceRoomUrl) {
      toast.error('Video room URL not available');
      return;
    }

    try {
      setIsLoading(true);
      // Navigate to the embedded video room
      navigate(`/video-room/${lessonId}`);
      toast.success('Loading video room...');
    } catch (error) {
      console.error('Error navigating to video room:', error);
      toast.error('Failed to open video room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (!lessonSpaceRoomUrl) {
      toast.error('Video room URL not available');
      return;
    }

    try {
      window.open(lessonSpaceRoomUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening video room in new tab...');
    } catch (error) {
      console.error('Error opening video room:', error);
      toast.error('Failed to open video room');
    }
  };

  if (!lessonSpaceRoomUrl) {
    return null;
  }

  return (
    <div className={`${className} flex items-center justify-between border rounded-lg p-4 bg-gray-50`}>
      <div>
        <h3 className="font-medium text-sm">LessonSpace Video Room</h3>
        <p className="text-sm text-muted-foreground">
          Join your interactive video classroom
        </p>
        {isGroupLesson && (
          <p className="text-xs text-muted-foreground mt-1">
            <Users className="h-3 w-3 inline-block mr-1" />
            Group lesson ({studentCount} students)
          </p>
        )}
        {lessonSpaceRoomId && (
          <p className="text-xs text-muted-foreground mt-1">
            Room ID: {lessonSpaceRoomId}
          </p>
        )}
        {lessonSpaceSpaceId && (
          <p className="text-xs text-muted-foreground mt-1">
            Space ID: {lessonSpaceSpaceId}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleOpenInNewTab}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-3 w-3" />
          New Tab
        </Button>
        
        <Button
          onClick={handleJoinRoom}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Video className="h-4 w-4" />
              <Play className="h-3 w-3" />
            </>
          )}
          Join Room
        </Button>
      </div>
    </div>
  );
};

export default VideoConferenceLink;
