
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  GraduationCap,
  Users,
  Loader2
} from 'lucide-react';

interface VideoConferenceLinkProps {
  flexibleClassroomRoomId?: string | null;
  flexibleClassroomSessionData?: string | null;
  className?: string;
  isGroupLesson?: boolean;
  studentCount?: number;
  lessonId?: string;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({
  flexibleClassroomRoomId,
  flexibleClassroomSessionData,
  className = "",
  isGroupLesson = false,
  studentCount = 0,
  lessonId
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFlexibleClassroomJoin = () => {
    if (!flexibleClassroomSessionData || !lessonId) {
      toast.error('Flexible Classroom session data not available');
      return;
    }

    try {
      setIsLoading(true);
      // Navigate to the embedded flexible classroom page
      window.location.href = `/flexible-classroom/${lessonId}`;
    } catch (error) {
      console.error('Error handling flexible classroom join:', error);
      toast.error('Failed to join Flexible Classroom');
    } finally {
      setIsLoading(false);
    }
  };

  if (!flexibleClassroomRoomId || !flexibleClassroomSessionData) {
    return null;
  }

  return (
    <div className={`${className} flex items-center justify-between border rounded-lg p-4 bg-gray-50`}>
      <div>
        <h3 className="font-medium text-sm">Flexible Classroom</h3>
        <p className="text-sm text-muted-foreground">
          Join your interactive classroom with whiteboard and collaboration tools
        </p>
        {isGroupLesson && (
          <p className="text-xs text-muted-foreground mt-1">
            <Users className="h-3 w-3 inline-block mr-1" />
            Group lesson ({studentCount} students)
          </p>
        )}
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Button
          onClick={handleFlexibleClassroomJoin}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <GraduationCap className="h-4 w-4" />
          Join Classroom
        </Button>
      )}
    </div>
  );
};

export default VideoConferenceLink;
