
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Video, 
  Globe, 
  Users, 
  ExternalLink, 
  GraduationCap,
  Loader2
} from 'lucide-react';

interface VideoConferenceLinkProps {
  link?: string;
  provider?: 'lesson_space' | 'google_meet' | 'zoom' | 'agora' | 'external_agora' | 'flexible_classroom' | null;
  className?: string;
  userRole?: 'tutor' | 'student' | 'admin' | 'owner';
  isGroupLesson?: boolean;
  studentCount?: number;
  lessonId?: string;
  hasLessonSpace?: boolean;
  spaceId?: string | null;
  agoraChannelName?: string | null;
  agoraToken?: string | null;
  agoraAppId?: string;
  flexibleClassroomRoomId?: string | null;
  flexibleClassroomSessionData?: string | null;
}

const VideoConferenceLink: React.FC<VideoConferenceLinkProps> = ({
  link,
  provider,
  className = "",
  userRole = 'student',
  isGroupLesson = false,
  studentCount = 0,
  lessonId,
  hasLessonSpace = false,
  spaceId,
  agoraChannelName,
  agoraToken,
  agoraAppId,
  flexibleClassroomRoomId,
  flexibleClassroomSessionData
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      toast.loading('Joining video conference...', { duration: 5000 });
    }
  }, [isLoading]);

  const handleJoin = () => {
    setIsLoading(true);
    if (link) {
      window.open(link, '_blank');
    } else {
      toast.error('No video conference link available');
    }
    setIsLoading(false);
  };

  const handleLessonSpaceJoin = () => {
    setIsLoading(true);
    if (hasLessonSpace && spaceId) {
      const baseUrl = process.env.NEXT_PUBLIC_LESSON_SPACE_BASE_URL || 'https://lessons.space';
      const joinUrl = `${baseUrl}/s/${spaceId}/session`;
      window.open(joinUrl, '_blank');
    } else {
      toast.error('No Lesson Space room available');
    }
    setIsLoading(false);
  };

  const handleExternalAgoraJoin = () => {
    setIsLoading(true);
    if (agoraChannelName && agoraToken && agoraAppId) {
      // Construct the URL with parameters
      const baseUrl = process.env.NEXT_PUBLIC_AGORA_EXTERNAL_LINK || 'https://example.com/agora';
      const agoraUrl = `${baseUrl}?channel=${agoraChannelName}&token=${agoraToken}&appid=${agoraAppId}&role=${userRole}&lessonId=${lessonId}`;
      window.open(agoraUrl, '_blank');
    } else {
      toast.error('Missing Agora credentials');
    }
    setIsLoading(false);
  };

  const handleFlexibleClassroomJoin = () => {
    if (!flexibleClassroomSessionData) {
      toast.error('Flexible Classroom session data not available');
      return;
    }

    try {
      const sessionData = JSON.parse(flexibleClassroomSessionData);
      
      // Generate the Agora Flexible Classroom URL with parameters
      const baseUrl = 'https://solutions.agora.io/education/web';
      const params = new URLSearchParams({
        appId: sessionData.appId,
        region: 'AP', // Asia Pacific
        roomUuid: sessionData.roomId,
        userUuid: sessionData.userUuid,
        userName: sessionData.userName,
        roleType: sessionData.userRole === 'teacher' ? '1' : '2',
        roomType: studentCount <= 1 ? '0' : '10', // 0 = 1v1, 10 = Cloud Class
        roomName: sessionData.lessonTitle || `Lesson ${sessionData.roomId}`,
        rtmToken: sessionData.rtmToken,
        language: 'en',
        duration: '3600' // 1 hour
      });

      const classroomUrl = `${baseUrl}?${params.toString()}`;
      
      // Open in new window for better experience
      window.open(classroomUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } catch (error) {
      console.error('Error parsing flexible classroom session data:', error);
      toast.error('Failed to join Flexible Classroom');
    }
  };

  const renderJoinButton = () => {
    if (provider === 'flexible_classroom' && flexibleClassroomRoomId) {
      return (
        <Button
          onClick={handleFlexibleClassroomJoin}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          disabled={!flexibleClassroomSessionData}
        >
          <GraduationCap className="h-4 w-4" />
          Join Flexible Classroom
        </Button>
      );
    }

    if (provider === 'lesson_space' && hasLessonSpace && spaceId) {
      return (
        <Button onClick={handleLessonSpaceJoin} className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Join Lesson Space
        </Button>
      );
    }

    if (provider === 'external_agora' && agoraChannelName && agoraToken && agoraAppId) {
      return (
        <Button onClick={handleExternalAgoraJoin} className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Join External Agora
        </Button>
      );
    }

    if (link) {
      return (
        <Button onClick={handleJoin} className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          Join Video Conference
        </Button>
      );
    }

    return null;
  };

  return (
    <div className={`${className} flex items-center justify-between border rounded-lg p-4 bg-gray-50`}>
      <div>
        <h3 className="font-medium text-sm">
          {provider === 'lesson_space' ? 'Lesson Space Room' :
           provider === 'google_meet' ? 'Google Meet' :
           provider === 'zoom' ? 'Zoom Meeting' :
           provider === 'agora' ? 'Agora.io' :
           provider === 'external_agora' ? 'External Agora App' :
           provider === 'flexible_classroom' ? 'Flexible Classroom' :
           'Video Conference'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {provider === 'lesson_space' && hasLessonSpace && spaceId ? `Join your Lesson Space at ${spaceId}` :
           provider === 'google_meet' ? 'Join your Google Meet session' :
           provider === 'zoom' ? 'Join your Zoom meeting' :
           provider === 'agora' ? 'Join your Agora.io session' :
           provider === 'external_agora' ? 'Join your external Agora application' :
           provider === 'flexible_classroom' ? 'Join your Flexible Classroom' :
           'No video conference details available'}
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
        renderJoinButton()
      )}
    </div>
  );
};

export default VideoConferenceLink;
