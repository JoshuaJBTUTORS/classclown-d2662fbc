import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewedSubmissionCardProps {
  assignmentId: string;
  assessmentId: string;
  userId: string;
  assessmentTitle?: string;
  subject?: string;
  examBoard?: string;
  studentName: string;
  submittedAt?: string;
  reviewedAt?: string;
  onOpenMarking: () => void;
  onDelete: () => void;
}

interface ResponseRow {
  id: string;
  question_id: string;
  student_answer: string | null;
  marks_awarded: number | null;
  ai_feedback: string | null;
  marked_at: string | null;
}

/**
 * Reviewed assignment card that expands in place to show the full marked
 * paper: every question, the student's answer, the marks awarded and the
 * AI feedback. Data is only fetched once the card is opened.
 */
export const ReviewedSubmissionCard: React.FC<ReviewedSubmissionCardProps> = ({
  assignmentId,
  assessmentId,
  userId,
  assessmentTitle,
  subject,
  examBoard,
  studentName,
  submittedAt,
  reviewedAt,
  onOpenMarking,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reviewed-submission', assessmentId, userId],
    enabled: expanded,
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

  // Only questions the student genuinely attempted count towards the score
  const attemptedQuestions = questions.filter((q: any) => {
    const r = responseByQuestion.get(q.id);
    return !!r?.student_answer?.trim();
  });

  const totalAvailable =
    attemptedQuestions.reduce((s, q: any) => s + (Number(q.marks_available) || 0), 0) || 0;
  const totalAchieved = attemptedQuestions.reduce(
    (s, q: any) => s + (Number(responseByQuestion.get(q.id)?.marks_awarded) || 0),
    0
  );
  const percentage = totalAvailable > 0 ? Math.round((totalAchieved / totalAvailable) * 100) : 0;
  const skippedCount = questions.length - attemptedQuestions.length;


  const gradeLabel =
    percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Developing' : 'Needs work';

  return (
    <Card key={assignmentId}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-start gap-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-base">{assessmentTitle || 'Untitled Assessment'}</CardTitle>
              <CardDescription>
                {studentName}
                {subject ? ` • ${subject}` : ''}
                {examBoard ? ` • ${examBoard}` : ''}
              </CardDescription>
              <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                {submittedAt && <span>Submitted {format(new Date(submittedAt), 'dd MMM yyyy HH:mm')}</span>}
                {reviewedAt && <span>Reviewed {format(new Date(reviewedAt), 'dd MMM yyyy')}</span>}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenMarking}>
              <Eye className="h-4 w-4 mr-1" />
              View &amp; Mark
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !session ? (
            <p className="text-sm text-muted-foreground">No attempt found for this student.</p>
          ) : (
            <>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall score</span>
                  <span className="text-lg font-semibold">
                    {totalAchieved}/{totalAvailable} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex items-center gap-2">
                  <Badge variant={percentage >= 60 ? 'default' : 'secondary'}>{gradeLabel}</Badge>
                  {skippedCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {skippedCount} unattempted question{skippedCount === 1 ? '' : 's'} excluded
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {attemptedQuestions.map((question: any) => {
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
                        <span className="text-muted-foreground">Student answer: </span>
                        {response?.student_answer?.trim() ? (
                          <span className="whitespace-pre-wrap">{response.student_answer}</span>
                        ) : (
                          <span className="italic text-muted-foreground">No answer given</span>
                        )}
                      </div>

                      {question.correct_answer && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Expected answer: </span>
                          <span className="whitespace-pre-wrap">{question.correct_answer}</span>
                        </div>
                      )}

                      {response?.ai_feedback && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">AI feedback</p>
                          <p className="text-sm whitespace-pre-wrap">{response.ai_feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ReviewedSubmissionCard;
