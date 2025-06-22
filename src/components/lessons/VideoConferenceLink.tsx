
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Video,
  Users,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface VideoConferenceLinkProps {
  lessonSpaceRoomUrl?: string | null;
  lessonSpaceRoomId?: string | null;
  className?: string;
  isGroupLesson?: boolean;
  studentCount?: number;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({
  lessonSpaceRoomUrl,
  lessonSpaceRoomId,
  className = "",
  isGroupLesson = false,
  studentCount = 0
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = () => {
    if (!lessonSpaceRoomUrl) {
      toast.error('Video room URL not available');
      return;
    }

    try {
      setIsLoading(true);
      // Open LessonSpace room in a new tab
      window.open(lessonSpaceRoomUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opening video room...');
    } catch (error) {
      console.error('Error opening video room:', error);
      toast.error('Failed to open video room');
    } finally {
      setIsLoading(false);
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
      </div>
      
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
            <ExternalLink className="h-3 w-3" />
          </>
        )}
        Join Room
      </Button>
    </div>
  );
};

export default VideoConferenceLink;
