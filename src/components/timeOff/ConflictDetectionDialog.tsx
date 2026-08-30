import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Loader2 } from 'lucide-react';
import { formatInUKTime } from '@/utils/timezone';
import { TimeOffConflict } from '@/services/timeOffConflictService';
import { DoodleCalendar, DoodleClock, DoodlePeople, DoodleAlert, DoodleCheck, DoodleTag } from '@/components/calendar/LessonDoodles';

interface ConflictDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: TimeOffConflict[];
  isLoading: boolean;
  hasNoConflicts?: boolean;
  onNoConflictsContinue?: () => void;
  onGoToCalendar: () => void;
  tutorName: string;
  timeOffPeriod: string;
}

export const ConflictDetectionDialog: React.FC<ConflictDetectionDialogProps> = ({
  isOpen,
  onClose,
  conflicts,
  isLoading,
  hasNoConflicts = false,
  onNoConflictsContinue,
  onGoToCalendar,
  tutorName,
  timeOffPeriod
}) => {

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="cc-dialog max-w-2xl rounded-[var(--radius-soft)]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">Checking for Conflicts</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-3 h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Checking for scheduling conflicts...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No conflicts found - show success message
  if (hasNoConflicts && conflicts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="cc-dialog max-w-md rounded-[var(--radius-soft)]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">No Conflicts Found</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pastel-mint text-pastel-mint-foreground">
                <DoodleCheck className="h-10 w-10" />
              </span>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold text-foreground">No scheduling conflicts detected</p>
              <p className="text-sm text-muted-foreground">
                The time off request for <strong>{tutorName}</strong> during{' '}
                <strong>{timeOffPeriod}</strong> does not conflict with any existing lessons.
              </p>
              <p className="text-sm text-muted-foreground">
                The request can be approved safely.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
              >
                Cancel
              </Button>
              <Button
                onClick={onNoConflictsContinue}
                className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
              >
                Continue with Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show conflicts that need resolution in calendar
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cc-dialog max-h-[80vh] max-w-3xl rounded-[var(--radius-soft)]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">Scheduling Conflicts Detected</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex items-start gap-3 rounded-[1.25rem] bg-pastel-blush/60 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-blush text-pastel-blush-foreground">
            <DoodleAlert className="h-5 w-5" />
          </span>
          <p className="text-sm text-foreground">
            Found <strong>{conflicts.length}</strong> lesson{conflicts.length !== 1 ? 's' : ''} that conflict with the time off request for <strong>{tutorName}</strong> during {timeOffPeriod}.
          </p>
        </div>

        <div className="my-4">
          <p className="text-sm text-muted-foreground">
            Please resolve these conflicts in the calendar before approving this time off request.
            You can reassign tutors or reschedule lessons as needed.
          </p>
        </div>

        <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="rounded-[1.25rem] bg-pastel-sand/40 p-4">
              <p className="font-semibold text-foreground">{conflict.title}</p>
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <DoodleCalendar className="h-4 w-4 shrink-0 text-foreground/70" />
                    <span>{formatInUKTime(conflict.start_time, 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DoodleClock className="h-4 w-4 shrink-0 text-foreground/70" />
                    <span>
                      {formatInUKTime(conflict.start_time, 'p')} - {formatInUKTime(conflict.end_time, 'p')}
                    </span>
                  </div>
                </div>

                {conflict.students && conflict.students.length > 0 && (
                  <div className="flex items-start gap-2">
                    <DoodlePeople className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                    <div className="flex flex-wrap gap-1">
                      {conflict.students.map((student, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-pastel-sky px-2.5 py-0.5 text-xs font-semibold text-pastel-sky-foreground">
                          {student.first_name} {student.last_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {conflict.subject && (
                  <div className="flex items-center gap-2 text-sm">
                    <DoodleTag className="h-4 w-4 shrink-0 text-foreground/70" />
                    <span className="inline-flex items-center rounded-full bg-pastel-lilac px-2.5 py-0.5 text-xs font-semibold text-pastel-lilac-foreground">
                      {conflict.subject}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border-2 border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
          >
            Close
          </Button>
          <Button
            onClick={onGoToCalendar}
            className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            Go to Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
