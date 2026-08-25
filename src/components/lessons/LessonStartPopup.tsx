import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Clock, Video, Bell } from 'lucide-react';
import { useLiveLessonAlert } from '@/hooks/useLiveLessonAlert';

export const LessonStartPopup: React.FC = () => {
  const navigate = useNavigate();
  const { activeLesson, dismiss } = useLiveLessonAlert();

  if (!activeLesson) return null;

  const startTime = parseISO(activeLesson.start_time);
  const now = new Date();
  const hasStarted = startTime <= now;

  const tutorName = activeLesson.tutor
    ? `${activeLesson.tutor.first_name} ${activeLesson.tutor.last_name}`.trim()
    : null;

  const handleJoin = () => {
    dismiss(activeLesson.id);
    navigate(`/join-lesson/${activeLesson.id}`);
  };

  const handleSnooze = () => {
    dismiss(activeLesson.id, 5); // remind in 5 minutes
  };

  const handleDismiss = () => {
    dismiss(activeLesson.id);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-14 w-14 rounded-full bg-mint-100 flex items-center justify-center">
              <Bell className="h-7 w-7 text-mint-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {hasStarted ? 'Your lesson has started!' : 'It\u2019s time for your lesson'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {hasStarted
              ? 'Join your tutor below so you don\u2019t miss any more time.'
              : 'Join below when you\u2019re ready \u2014 your tutor is waiting.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-mint-200 bg-mint-50/60 p-3 flex items-start gap-2">
            <span className="text-lg leading-none" aria-hidden="true">👋</span>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Message from Cleo:</span>{' '}
              {hasStarted
                ? 'Your lesson is live right now — hop in and say hello to your tutor!'
                : 'Your lesson is about to begin — get comfy and join when you\u2019re ready!'}
            </p>
          </div>

          <div className="rounded-lg border border-mint-200 bg-mint-50 p-4 space-y-2">

            <p className="font-semibold text-foreground text-center">{activeLesson.title}</p>
            {activeLesson.subject && (
              <p className="text-sm text-muted-foreground text-center">{activeLesson.subject}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(startTime, 'EEEE, MMMM d \u00b7 h:mm a')}</span>
            </div>
            {tutorName && (
              <p className="text-sm text-muted-foreground text-center">
                Tutor: {tutorName}
              </p>
            )}
          </div>

          <Button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-foreground"
            size="lg"
          >
            <Video className="h-5 w-5 mr-2" />
            Join Now
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSnooze}
              className="flex-1"
            >
              Remind me in 5 min
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonStartPopup;
