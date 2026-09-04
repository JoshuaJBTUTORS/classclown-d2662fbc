
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mic } from 'lucide-react';
import { DoodleVideo, DoodleAlert, DoodleSparkle } from '@/components/calendar/LessonDoodles';
import { supabase } from '@/integrations/supabase/client';

interface LessonConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  lessonId?: string;
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
  lessonId,
  studentName
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasRequest, setHasRequest] = useState<boolean | null>(null);
  const [topicRequest, setTopicRequest] = useState('');

  const canContinue =
    hasRequest === false || (hasRequest === true && topicRequest.trim().length > 0);

  const saveTopicRequest = async () => {
    const text = topicRequest.trim().slice(0, 500);
    if (!lessonId || !text) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (student) {
        await supabase.from('topic_requests').insert({
          lesson_id: lessonId,
          student_id: student.id,
          requested_topic: text,
        });
        return;
      }

      const { data: parent } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (parent) {
        const { data: rows } = await supabase
          .from('lesson_students')
          .select('student:students(id, parent_id)')
          .eq('lesson_id', lessonId);
        const child = (rows ?? []).find((r: any) => r.student?.parent_id === parent.id);
        await supabase.from('topic_requests').insert({
          lesson_id: lessonId,
          parent_id: parent.id,
          student_id: child?.student?.id ?? null,
          requested_topic: text,
        });
      }
    } catch (e) {
      console.error('Failed to save topic request:', e);
    }
  };

  const handleAcceptClick = async () => {
    if (!canContinue) return;
    setHasAccepted(true);
    if (hasRequest) {
      await saveTopicRequest();
    }
    setTimeout(() => {
      onAccept();
    }, 300);
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

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 pt-3">
          {/* Topic request */}
          <div
            className={`relative space-y-3 rounded-[1.25rem] border-2 p-4 transition-all ${
              hasRequest === null
                ? 'border-primary animate-pulse-soft bg-primary/5'
                : 'border-foreground/15 bg-card'
            }`}
          >
            {hasRequest === null && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                Required to join
              </span>
            )}
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-semibold">
                Is there anything specific you'd like covered in this session?
              </h3>
              <p className="text-sm text-foreground/70">
                Your tutor has a lesson plan ready, but would love to prioritise anything you're struggling with.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setHasRequest(true)}
                disabled={hasAccepted}
                className={`rounded-full px-6 ${
                  hasRequest === true
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'border border-foreground bg-transparent text-foreground hover:bg-foreground/5'
                }`}
              >
                Yes
              </Button>
              <Button
                type="button"
                onClick={() => { setHasRequest(false); setTopicRequest(''); }}
                disabled={hasAccepted}
                className={`rounded-full px-6 ${
                  hasRequest === false
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'border border-foreground bg-transparent text-foreground hover:bg-foreground/5'
                }`}
              >
                No
              </Button>
            </div>

            {hasRequest === true && (
              <Textarea
                value={topicRequest}
                onChange={(e) => setTopicRequest(e.target.value.slice(0, 500))}
                disabled={hasAccepted}
                placeholder="Tell your teacher what you'd like to focus on..."
                className="min-h-[90px] rounded-[1rem] border-foreground/20"
              />
            )}

            {hasRequest === null && (
              <p className="text-xs text-muted-foreground">
                Please choose Yes or No before joining.
              </p>
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
            disabled={hasAccepted || !canContinue}
            className="min-w-[180px] rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
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
