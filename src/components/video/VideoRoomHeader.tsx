
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserPlus, Settings, MoreVertical, Share, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoRoomHeaderProps {
  lessonTitle: string;
  participantCount: number;
  expectedParticipantCount?: number;
  userRole: 'tutor' | 'student';
  isRecording?: boolean;
  onLeave: () => void;
}

const VideoRoomHeader: React.FC<VideoRoomHeaderProps> = ({
  lessonTitle,
  participantCount,
  expectedParticipantCount,
  userRole,
  isRecording = false,
  onLeave
}) => {
  const isMobile = useIsMobile();
  const participantText = expectedParticipantCount 
    ? `${participantCount}/${expectedParticipantCount} participants`
    : `${participantCount} participants`;

  return (
    <div className="bg-[hsl(var(--deep-purple-blue))] border-b border-border/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-elegant">
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "sm"}
          onClick={onLeave}
          className="text-white hover:text-white/80 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
          {!isMobile && "Leave"}
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center min-w-0">
        <div className="flex items-center gap-2 md:gap-3 justify-center">
          <h1 className="text-lg md:text-2xl font-bold text-white font-bubble text-center">
            {lessonTitle}
          </h1>
          {isRecording && (
            <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
              <Circle className="h-2 w-2 md:h-3 md:w-3 fill-current" />
              {!isMobile && "Recording"}
            </Badge>
          )}
        </div>
        {!isMobile && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-white/70 mt-1">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span>{participantText}</span>
            <span>•</span>
            <span className="capitalize">{userRole}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {userRole === 'tutor' && !isMobile && (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white/80 hover:bg-white/10"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white/80 hover:bg-white/10"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
            <div className="h-6 w-px bg-white/20 mx-1" />
          </>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-white/80 hover:bg-white/10"
        >
          <Settings className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-white/80 hover:bg-white/10"
        >
          <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VideoRoomHeader;
