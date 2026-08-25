import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useHeyCleoStudentHomework } from '@/hooks/useHeyCleoStudentHomework';
import type { HeyCleoHomeworkRow } from '@/hooks/useHeyCleoStudents';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  heycleoStudentId?: string | null;
}

const fmt = (v?: string | null, pattern = 'MMM d, yyyy') => {
  if (!v) return null;
  try {
    return format(parseISO(v), pattern);
  } catch {
    return null;
  }
};

const statusBadge = (hw: HeyCleoHomeworkRow) => {
  if (hw.completed) return <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">Completed</Badge>;
  if (hw.started) return <Badge className="bg-amber-100 text-amber-800 border-amber-200" variant="outline">Started</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">Not started</Badge>;
};

const HomeworkRow: React.FC<{ hw: HeyCleoHomeworkRow; highlight?: boolean }> = ({ hw, highlight }) => (
  <div className={`rounded-lg border p-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'bg-card'}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{hw.title || 'Homework'}</p>
        <p className="text-xs text-muted-foreground">
          {[hw.subject, hw.year_group, hw.assessment_type].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      {statusBadge(hw)}
    </div>
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {fmt(hw.due_date) && <p>Due {fmt(hw.due_date)}</p>}
      {hw.marks_available != null && hw.marks_available > 0 && (
        <p>
          Score {hw.marks_awarded ?? 0}/{hw.marks_available}
          {hw.percentage != null ? ` (${Math.round(Number(hw.percentage))}%)` : ''}
        </p>
      )}
      {fmt(hw.started_at, 'MMM d, HH:mm') && <p>Started {fmt(hw.started_at, 'MMM d, HH:mm')}</p>}
      {fmt(hw.submitted_at, 'MMM d, HH:mm') && <p>Submitted {fmt(hw.submitted_at, 'MMM d, HH:mm')}</p>}
    </div>
  </div>
);

const HomeworkDetailPanel: React.FC<Props> = ({ open, onOpenChange, studentName, heycleoStudentId }) => {
  const { data: homework, isLoading } = useHeyCleoStudentHomework(open ? heycleoStudentId : null);

  const now = Date.now();
  const past = (homework ?? []).filter((h) => h.due_date && new Date(h.due_date).getTime() < now);
  const latest = past[0] ?? null;
  const rest = (homework ?? []).filter((h) => h.assignment_id !== latest?.assignment_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{studentName}</SheetTitle>
          <SheetDescription>
            {heycleoStudentId ? 'HeyCleo homework activity' : 'No linked HeyCleo account'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {!heycleoStudentId ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <BookOpen className="h-5 w-5 mx-auto mb-2 opacity-60" />
              We couldn't match this student to a HeyCleo account, so no homework data is available.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !homework?.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              <BookOpen className="h-5 w-5 mx-auto mb-2 opacity-60" />
              No homework assignments found for this student yet.
            </div>
          ) : (
            <>
              {latest && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last week's homework</p>
                  <HomeworkRow hw={latest} highlight />
                </div>
              )}
              {rest.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Other recent homework</p>
                  <div className="space-y-2">
                    {rest.map((hw) => (
                      <HomeworkRow key={hw.assignment_id} hw={hw} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HomeworkDetailPanel;
