
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Mic } from 'lucide-react';
import { DoodleVideo, DoodleClock, DoodlePerson, DoodlePeople, DoodleAlert, DoodleSparkle } from '@/components/calendar/LessonDoodles';
import { format, parseISO } from 'date-fns';

interface LessonConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  lesson: {
    title: string;
    description?: string;
    start_time: string;
    tutor?: {
      first_name: string;
      last_name: string;
    };
    is_group?: boolean;
    lesson_students?: any[];
  };
  studentName: string;
}

const LessonConsentDialog: React.FC<LessonConsentDialogProps> = ({
  isOpen,
  onClose,
  onAccept,
  lesson,
  studentName
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAcceptClick = () => {
    setHasAccepted(true);
    setTimeout(() => {
      onAccept();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cc-dialog flex max-h-[92dvh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[var(--radius-soft)] border border-foreground/20 p-5 sm:max-w-[600px] sm:p-6">
        <DoodleSparkle className="absolute right-12 top-6 h-5 w-5 text-foreground/30" />
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 font-heading text-xl">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
              <DoodleVideo className="h-6 w-6" />
            </span>
            Join Lesson - Camera & Microphone Agreement
          </DialogTitle>
          <DialogDescription>
            Please review and accept the requirements before joining your lesson
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {/* Lesson Details */}
          <div className="space-y-3 rounded-[1.25rem] border border-foreground/15 bg-card p-4">
            <div>
              <h3 className="font-heading text-lg font-semibold">{lesson.title}</h3>
              {lesson.description && (
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                <DoodleClock className="h-4 w-4" />
              </span>
              <span>{format(parseISO(lesson.start_time), 'MMM d, yyyy h:mm a')}</span>
            </div>

            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                <DoodlePerson className="h-4 w-4" />
              </span>
              <span>
                Teacher: {lesson.tutor?.first_name} {lesson.tutor?.last_name}
              </span>
            </div>

            {lesson.is_group && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodlePeople className="h-4 w-4" />
                </span>
                <span>Group lesson • {lesson.lesson_students?.length || 0} students</span>
              </div>
            )}
          </div>

          {/* Camera Rules */}
          <div className="rounded-[1.25rem] border border-foreground/15 bg-pastel-blush/30 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                <DoodleAlert className="h-5 w-5" />
              </span>
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-foreground">
                  Important: Camera & Microphone Requirements
                </h4>
                <div className="space-y-3 text-sm text-foreground/80">
                  <div className="flex items-start gap-2">
                    <Camera className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      <strong>Please ensure your camera is working and remains on for the entire duration of the lesson</strong>, unless previously agreed upon with your instructor.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mic className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Your microphone should be ready to use when called upon by your teacher.</span>
                  </div>
                  <div className="rounded-xl border border-foreground/20 bg-card p-3">
                    <p className="text-sm font-medium text-foreground">
                      ⚠️ <strong>Important Notice:</strong> Failure to comply with the camera policy may result in removal from the lesson.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Student Welcome */}
          <div className="rounded-[1.25rem] border border-foreground/15 bg-card p-4">
            <p className="text-sm text-foreground/80">
              <strong>Welcome, {studentName}!</strong>
              <br />
              By clicking "I Accept & Join Lesson" below, you confirm that you understand and agree to follow the camera and microphone requirements.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-foreground/15 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={hasAccepted}
            className="rounded-full border border-foreground bg-transparent text-foreground hover:bg-foreground/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptClick}
            disabled={hasAccepted}
            className="min-w-[180px] rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            {hasAccepted ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Joining...
              </span>
            ) : (
              'I Accept & Join Lesson'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonConsentDialog;
