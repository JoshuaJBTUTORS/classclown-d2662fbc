import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles, RefreshCw, FileWarning } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone, PastelTone } from '@/components/lessonPlans/pastelPalette';
import FlashcardDeck, { RevisionCard } from './FlashcardDeck';

interface StudentRef {
  student: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

interface RevisionNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
    lesson_students: StudentRef[];
  };
  tone?: PastelTone;
  subtitle?: string;
}

const RevisionNotesDialog: React.FC<RevisionNotesDialogProps> = ({
  isOpen,
  onClose,
  lesson,
  tone,
  subtitle,
}) => {
  const { toast } = useToast();
  const activeTone = tone || getPastelTone(lesson.title || 'lesson');
  const students = useMemo(
    () => (lesson.lesson_students || []).map((ls) => ls.student).filter(Boolean),
    [lesson.lesson_students]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [cards, setCards] = useState<RevisionCard[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && students.length && selectedStudentId === null) {
      setSelectedStudentId(students[0].id);
    }
    if (!isOpen) {
      setCards(null);
      setNotice(null);
      setSelectedStudentId(null);
    }
  }, [isOpen, students, selectedStudentId]);

  const load = async (studentId: number, force = false) => {
    setIsLoading(true);
    setNotice(null);
    setCards(null);
    try {
      if (!force) {
        const { data: existing } = await supabase
          .from('lesson_revision_notes')
          .select('cards')
          .eq('lesson_id', lesson.id)
          .eq('student_id', studentId)
          .maybeSingle();

        if (existing?.cards && Array.isArray(existing.cards) && existing.cards.length) {
          setCards(existing.cards as unknown as RevisionCard[]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-revision-notes', {
        body: { lessonId: lesson.id, studentId, force },
      });

      if (error) {
        let details = error.message;
        try {
          const ctx = (error as any).context;
          if (ctx?.text) details = await ctx.text();
        } catch {
          /* ignore */
        }
        if (details?.includes('no_transcript')) {
          setNotice('Revision notes become available once this lesson transcript has finished processing.');
        } else {
          setNotice(details || 'Something went wrong generating the revision notes.');
        }
        return;
      }

      if (data?.error) {
        setNotice(
          data.error === 'no_transcript'
            ? data.message
            : data.message || data.error
        );
        return;
      }

      setCards((data?.cards as RevisionCard[]) || []);
    } catch (err) {
      console.error('Revision notes error:', err);
      toast({
        title: 'Could not load revision notes',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedStudentId) {
      load(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedStudentId]);

  const panel = (icon: React.ReactNode, message: string) => (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-soft,1.5rem)] border-2 border-dashed border-border/60 bg-muted/30 px-6 py-14 text-center">
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-[var(--shadow-soft)]">
        {icon}
      </span>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto overflow-x-hidden rounded-[var(--radius-soft,1.5rem)] border-0 p-0 shadow-[var(--shadow-soft-lg)]">
        <DialogHeader
          className={cn('relative overflow-hidden px-6 py-6 text-left sm:px-8', activeTone.bg, activeTone.text)}
        >
          <ScribbleStroke className="pointer-events-none absolute -right-8 -top-10 h-40 w-64 text-current opacity-[0.14]" />
          <div className="relative space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium shadow-[var(--shadow-soft)]">
              <Sparkles className="h-3.5 w-3.5" />
              Revision notes
            </span>
            <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {lesson.title}
            </DialogTitle>
            {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
          </div>
        </DialogHeader>

        <div className="space-y-5 bg-card px-6 py-6 sm:px-8">
          {students.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                  className={cn(
                    'inline-flex h-11 items-center rounded-full px-5 text-sm font-medium shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5',
                    selectedStudentId === student.id
                      ? 'bg-foreground text-background'
                      : 'bg-muted/50 text-foreground'
                  )}
                >
                  {student.first_name} {student.last_name}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            panel(<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />, 'Building your revision notes...')
          ) : notice ? (
            panel(<FileWarning className="h-5 w-5 text-muted-foreground" />, notice)
          ) : cards && cards.length ? (
            <>
              <FlashcardDeck cards={cards} tone={activeTone} />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => selectedStudentId && load(selectedStudentId, true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-muted/50 px-5 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
                >
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </button>
              </div>
            </>
          ) : (
            panel(<Sparkles className="h-5 w-5 text-muted-foreground" />, 'No revision notes available for this lesson yet.')
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionNotesDialog;
