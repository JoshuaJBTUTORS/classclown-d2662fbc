import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { Users, Video, FileText, User, Play, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <BookOpen className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rotate-12 opacity-[0.07]" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <h3 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                {lesson.title}
              </h3>

              <div className="space-y-2 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(lessonDate, 'MMM d, yyyy • h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{lesson.tutor.first_name} {lesson.tutor.last_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {lesson.lesson_students.length} student{lesson.lesson_students.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {lesson.subject && (
              <span className="rounded-full bg-background/70 px-4 py-2 text-xs font-medium shadow-[var(--shadow-soft)]">
                {lesson.subject}
              </span>
            )}
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
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{lesson.title} - Recording</DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6">
            {lesson.lesson_space_recording_url ? (
              <iframe
                src={lesson.lesson_space_recording_url}
                className="w-full h-full rounded-lg border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                title={`Recording: ${lesson.title} - ${format(lessonDate, 'MMM d, yyyy')}`}
              />
            ) : hasRecording ? (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading recording...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recording available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lesson.title} - Student Summaries</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
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
      />
    </>
  );
};

export default LessonSummaryCard;