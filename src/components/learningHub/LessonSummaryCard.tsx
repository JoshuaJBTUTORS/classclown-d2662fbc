import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { Users, Video, FileText, User, Play, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import StudentLessonSummary from '@/components/calendar/StudentLessonSummary';
import RevisionNotesDialog from './RevisionNotesDialog';

interface LessonSummaryCardProps {
  lesson: {
    id: string;
    title: string;
    subject: string;
    start_time: string;
    end_time: string;
    lesson_space_session_id?: string;
    lesson_space_recording_url?: string;
    tutor: {
      first_name: string;
      last_name: string;
    };
    lesson_students: Array<{
      student: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
      };
    }>;
  };
}

const LessonSummaryCard: React.FC<LessonSummaryCardProps> = ({ lesson }) => {
  const [showRecording, setShowRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showRevisionNotes, setShowRevisionNotes] = useState(false);
  const lessonDate = parseISO(lesson.start_time);

  const hasRecording = lesson.lesson_space_recording_url || lesson.lesson_space_session_id;
  const hasStudents = (lesson.lesson_students || []).length > 0;

  const tone = getPastelTone(lesson.subject || lesson.title || 'lesson');

  const actionClass = cn(
    'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-background/80 px-5',
    'text-sm font-medium text-foreground shadow-[var(--shadow-soft)]',
    'transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'
  );

  const dialogShell =
    'overflow-hidden border-0 p-0 rounded-[var(--radius-soft,1.5rem)] shadow-[var(--shadow-soft-lg)]';

  const DialogHero: React.FC<{ eyebrow: string; icon: React.ReactNode }> = ({ eyebrow, icon }) => (
    <DialogHeader className={cn('relative overflow-hidden px-6 py-6 text-left sm:px-8', tone.bg, tone.text)}>
      <ScribbleStroke className="pointer-events-none absolute -right-8 -top-10 h-40 w-64 text-current opacity-[0.14]" />
      <div className="relative space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium shadow-[var(--shadow-soft)]">
          {icon}
          {eyebrow}
        </span>
        <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {lesson.title}
        </DialogTitle>
        <p className="text-sm opacity-80">
          {format(lessonDate, 'MMM d, yyyy • h:mm a')} · {lesson.tutor.first_name} {lesson.tutor.last_name}
          {lesson.subject ? ` · ${lesson.subject}` : ''}
        </p>
      </div>
    </DialogHeader>
  );

  const emptyPanel = (message: string) => (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-[var(--radius-soft,1.5rem)] border-2 border-dashed border-border/60 bg-muted/30 p-10 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-[var(--shadow-soft)]">
        <Video className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-soft,1.5rem)] p-6 shadow-[var(--shadow-soft)] sm:p-8',
          'transition-shadow hover:shadow-[var(--shadow-soft-lg)]',
          tone.bg,
          tone.text
        )}
      >
        <ScribbleStroke className="pointer-events-none absolute -right-6 -top-8 h-40 w-64 text-current opacity-[0.12]" />

        {lesson.subject && (
          <span className="absolute right-6 top-6 z-10 max-w-[45%] truncate rounded-full bg-background/70 px-4 py-2 text-xs font-medium shadow-[var(--shadow-soft)]">
            {lesson.subject}
          </span>
        )}

        <div className="relative flex flex-col gap-6">
          <div className="space-y-3 pr-[48%]">
            <h3 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {lesson.title}
            </h3>

            <div className="space-y-2 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{format(lessonDate, 'MMM d, yyyy • h:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0" />
                <span>
                  {lesson.lesson_students.length} student{lesson.lesson_students.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={actionClass}
              onClick={() => setShowRecording(true)}
              disabled={!hasRecording}
            >
              <Play className="h-4 w-4" />
              Recording
            </button>

            <button type="button" className={actionClass} onClick={() => setShowSummary(true)}>
              <FileText className="h-4 w-4" />
              Summary
            </button>

            {hasStudents && (
              <button type="button" className={actionClass} onClick={() => setShowRevisionNotes(true)}>
                <Sparkles className="h-4 w-4" />
                Revision Notes
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Recording Modal */}
      <Dialog open={showRecording} onOpenChange={setShowRecording}>
        <DialogContent className={cn(dialogShell, 'flex h-[90vh] w-[95vw] max-w-6xl flex-col')}>
          <DialogHero eyebrow="Lesson recording" icon={<Play className="h-3.5 w-3.5" />} />
          <div className="flex-1 overflow-hidden bg-card p-6 sm:p-8">
            {lesson.lesson_space_recording_url ? (
              <iframe
                src={lesson.lesson_space_recording_url}
                className="h-full w-full rounded-[var(--radius-soft,1.5rem)] border-0 shadow-[var(--shadow-soft)]"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title={`Recording: ${lesson.title} - ${format(lessonDate, 'MMM d, yyyy')}`}
              />
            ) : hasRecording ? (
              emptyPanel('Loading recording...')
            ) : (
              emptyPanel('No recording available for this lesson.')
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className={cn(dialogShell, 'max-h-[85vh] max-w-2xl overflow-y-auto')}>
          <DialogHero eyebrow="Student summaries" icon={<FileText className="h-3.5 w-3.5" />} />
          <div className="bg-card px-6 py-6 sm:px-8">
            <StudentLessonSummary
              lessonId={lesson.id}
              students={lesson.lesson_students}
              lesson={lesson}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Notes Modal */}
      <RevisionNotesDialog
        isOpen={showRevisionNotes}
        onClose={() => setShowRevisionNotes(false)}
        lesson={lesson}
        tone={tone}
        subtitle={`${format(lessonDate, 'MMM d, yyyy • h:mm a')}${lesson.subject ? ` · ${lesson.subject}` : ''}`}
      />
    </>
  );
};

export default LessonSummaryCard;
