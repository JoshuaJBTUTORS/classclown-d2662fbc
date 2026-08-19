import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, FileWarning } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
}

const RevisionNotesDialog: React.FC<RevisionNotesDialogProps> = ({ isOpen, onClose, lesson }) => {
  const { toast } = useToast();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Revision Notes — {lesson.title}
          </DialogTitle>
        </DialogHeader>

        {students.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {students.map((student) => (
              <Button
                key={student.id}
                size="sm"
                variant={selectedStudentId === student.id ? 'default' : 'outline'}
                className={cn('rounded-full')}
                onClick={() => setSelectedStudentId(student.id)}
              >
                {student.first_name} {student.last_name}
              </Button>
            ))}
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-purple-600" />
              <p className="text-sm">Building your revision notes...</p>
            </div>
          ) : notice ? (
            <div className="py-12 text-center">
              <FileWarning className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{notice}</p>
            </div>
          ) : cards && cards.length ? (
            <>
              <FlashcardDeck cards={cards} />
              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectedStudentId && load(selectedStudentId, true)}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Regenerate
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No revision notes available for this lesson yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionNotesDialog;
