
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Circle, FileText } from 'lucide-react';
import { DoodleClock, DoodlePerson } from '@/components/calendar/LessonDoodles';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, parseISO } from 'date-fns';
import QuickHomeworkSubmissionsModal from './QuickHomeworkSubmissionsModal';
import { cn } from '@/lib/utils';

interface VideoRoomHeaderProps {
  lessonTitle: string;
  lessonStartTime?: string;
  participantCount: number;
  expectedParticipantCount?: number;
  userRole: 'tutor' | 'student';
  isRecording?: boolean;
  onLeave: () => void;
  lessonId?: string;
  isRecurring?: boolean;
}

const chipBase =
  'inline-flex items-center gap-2 rounded-full h-9 px-3 text-sm font-medium transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const chipOutlined = cn(
  chipBase,
  'pl-2 pr-3 gap-2 bg-transparent text-foreground border border-foreground hover:bg-foreground/5',
);

const chipIcon =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground';

const VideoRoomHeader: React.FC<VideoRoomHeaderProps> = ({
  lessonTitle,
  lessonStartTime,
  participantCount,
  expectedParticipantCount,
  userRole,
  isRecording = false,
  onLeave,
  lessonId,
  isRecurring = false
}) => {
  const isMobile = useIsMobile();
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const participantText = expectedParticipantCount
    ? `${participantCount}/${expectedParticipantCount} participants`
    : `${participantCount} participants`;

  const formattedDate = lessonStartTime
    ? format(parseISO(lessonStartTime), 'EEE d MMM, h:mm a')
    : null;

  return (
    <div className="border-b border-foreground/15 bg-card px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 shadow-[var(--shadow-soft)]">
      {/* Left: Leave */}
      <div className="flex shrink-0 items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLeave}
          className={chipOutlined}
        >
          <span className={chipIcon}>
            <ArrowLeft className="h-4 w-4" />
          </span>
          {!isMobile && 'Leave'}
        </Button>
      </div>

      {/* Center: title + date + participants */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1">
        <h1 className="truncate text-center font-heading text-lg font-bold text-foreground md:text-xl">
          {lessonTitle}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {formattedDate && (
            <span className={cn(chipOutlined, 'h-7 px-2.5 text-xs')}>
              <span className={chipIcon}>
                <DoodleClock className="h-3.5 w-3.5" />
              </span>
              {formattedDate}
            </span>
          )}
          <span className={cn(chipOutlined, 'h-7 px-2.5 text-xs')}>
            <span className={chipIcon}>
              <DoodlePerson className="h-3.5 w-3.5" />
            </span>
            {participantText} • <span className="capitalize">{userRole}</span>
          </span>
          {isRecording && (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 text-xs font-medium text-red-600">
              <Circle className="h-2 w-2 fill-current" />
              {!isMobile && 'Recording'}
            </span>
          )}
        </div>
      </div>

      {/* Right: View Submissions */}
      <div className="flex shrink-0 items-center">
        {userRole === 'tutor' && isRecurring && lessonId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSubmissionsModal(true)}
            className={chipOutlined}
          >
            <span className={chipIcon}>
              <FileText className="h-4 w-4" />
            </span>
            {!isMobile && 'Submissions'}
          </Button>
        )}
      </div>

      {/* Homework Submissions Modal */}
      {lessonId && (
        <QuickHomeworkSubmissionsModal
          isOpen={showSubmissionsModal}
          onClose={() => setShowSubmissionsModal(false)}
          currentLessonId={lessonId}
          lessonTitle={lessonTitle}
        />
      )}
    </div>
  );
};

export default VideoRoomHeader;
