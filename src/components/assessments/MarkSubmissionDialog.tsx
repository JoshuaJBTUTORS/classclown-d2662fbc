import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { markSession } from '@/services/assessmentMarkingService';

interface MarkSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  userId: string;
  assessmentTitle?: string;
  studentName?: string;
}

interface ResponseRow {
  id: string;
  question_id: string;
  student_answer: string | null;
  marks_awarded: number | null;
  ai_feedback: string | null;
  marked_at: string | null;
}

export const MarkSubmissionDialog: React.FC<MarkSubmissionDialogProps> = ({
  open,
  onOpenChange,
  assessmentId,
  userId,
  assessmentTitle,
  studentName,
}) => {
  const queryClient = useQueryClient();
  const [marking, setMarking] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['submission-review', assessmentId, userId],
    enabled: open && !!assessmentId && !!userId,
    queryFn: async () => {
      const { data: sessions, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select('id, started_at, completed_at, status, total_marks_achieved, total_marks_available')
        .eq('assessment_id', assessmentId)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;
      const session = sessions?.[0];
      if (!session) return { session: null, questions: [], responses: [] as ResponseRow[] };

      const [{ data: questions, error: qError }, { data: responses, error: rError }] = await Promise.all([
        supabase
          .from('assessment_questions')
          .select('id, question_number, question_text, marks_available, correct_answer')
          .eq('assessment_id', assessmentId)
          .order('question_number'),
        supabase
          .from('student_responses')
          .select('id, question_id, student_answer, marks_awarded, ai_feedback, marked_at')
          .eq('session_id', session.id),
      ]);

      if (qError) throw qError;
      if (rError) throw rError;

      return { session, questions: questions ?? [], responses: (responses ?? []) as ResponseRow[] };
    },
  });

  const session = data?.session;
  const questions = data?.questions ?? [];
  const responses = data?.responses ?? [];
  const responseByQuestion = new Map(responses.map((r) => [r.question_id, r]));

  const unmarkedCount = responses.filter((r) => !r.marked_at).length;
  const totalAvailable = questions.reduce((s, q: any) => s + (Number(q.marks_available) || 0), 0);
  const totalAchieved = responses.reduce((s, r) => s + (Number(r.marks_awarded) || 0), 0);
  const markedCount = responses.length - unmarkedCount;

  const runMarking = async (remark: boolean) => {
    if (!session) return;
    setMarking(true);
    const total = remark ? responses.length : unmarkedCount;
    setProgress({ done: 0, total });
    try {
      let doneCount = 0;
      // The edge function marks as many answers as it can inside its time
      // budget, so keep calling it until it reports there is nothing left.
      for (let pass = 0; pass < 20; pass++) {
        const result = await markSession(session.id, pass === 0 ? remark : false);
        doneCount += result.marked ?? 0;
        setProgress({ done: Math.min(doneCount, total), total });
        if (result.done) break;
      }
      await queryClient.invalidateQueries({ queryKey: ['submission-review', assessmentId, userId] });
      await queryClient.invalidateQueries({ queryKey: ['all-assignments'] });
      toast.success('Marking complete');
    } catch (error: any) {
      toast.error(error?.message || 'Marking failed');
    } finally {
      setMarking(false);
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assessmentTitle || 'Submission'}</DialogTitle>
          <DialogDescription>
            {studentName ? `${studentName} • ` : ''}
            {session
              ? `${markedCount}/${responses.length} answers marked • ${totalAchieved}/${totalAvailable} marks`
              : 'No attempt found for this student'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !session ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            This student has not started the assessment yet.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button onClick={() => runMarking(false)} disabled={marking || unmarkedCount === 0}>
                {marking ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {unmarkedCount === 0 ? 'All answers marked' : `Mark with AI (${unmarkedCount})`}
              </Button>
              {markedCount > 0 && (
                <Button variant="outline" onClick={() => runMarking(true)} disabled={marking}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-mark all
                </Button>
              )}
            </div>

            {progress && progress.total > 0 && (
              <Progress value={(progress.done / progress.total) * 100} className="h-2" />
            )}

            <div className="space-y-4">
              {questions.map((question: any) => {
                const response = responseByQuestion.get(question.id);
                return (
                  <div key={question.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">
                        Q{question.question_number}. {question.question_text}
                      </p>
                      <Badge variant={response?.marked_at ? 'default' : 'secondary'}>
                        {response?.marked_at
                          ? `${response.marks_awarded ?? 0}/${question.marks_available}`
                          : `– /${question.marks_available}`}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Answer: </span>
                      {response?.student_answer?.trim() ? (
                        <span className="whitespace-pre-wrap">{response.student_answer}</span>
                      ) : (
                        <span className="italic text-muted-foreground">No answer given</span>
                      )}
                    </div>
                    {response?.ai_feedback && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 whitespace-pre-wrap">
                        {response.ai_feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarkSubmissionDialog;
