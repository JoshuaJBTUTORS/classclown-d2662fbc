import React from 'react';
import { ArrowUpRight, Clock, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import { cn } from '@/lib/utils';
import type { AssessmentAssignment } from '@/services/assessmentAssignmentService';

interface AssessmentCardProps {
  assignment: AssessmentAssignment;
  onClick: () => void;
  index: number;
}

const BUTTON_SIZE = 56;
const NOTCH_RADIUS = BUTTON_SIZE / 2 + 8;

const STATUS_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  assigned: { label: 'Assigned', icon: FileText },
  in_progress: { label: 'In progress', icon: Clock },
  submitted: { label: 'Submitted', icon: CheckCircle2 },
  reviewed: { label: 'Reviewed', icon: CheckCircle2 },
};

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ assignment, onClick, index }) => {
  const assessment = assignment.assessment;
  const subject = assessment?.subject || assessment?.title || 'Assessment';
  const tone = getPastelTone(subject);

  const isComplete = assignment.status === 'submitted' || assignment.status === 'reviewed';
  const due = assignment.due_date ? new Date(assignment.due_date) : null;
  const isOverdue = !!due && !isComplete && isPast(due);
  const isDueSoon =
    !!due && !isComplete && !isOverdue && isWithinInterval(due, { start: new Date(), end: addDays(new Date(), 3) });

  const status = STATUS_LABELS[assignment.status] ?? STATUS_LABELS.assigned;
  const StatusIcon = status.icon;

  const notch = `radial-gradient(circle ${NOTCH_RADIUS}px at calc(100% - ${BUTTON_SIZE / 2}px) 88%, transparent 99%, #000 100%)`;

  const chip = cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
    'bg-background/60',
    tone.text
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      className={cn(
        'group relative w-full text-left animate-fade-in min-h-[248px]',
        'transition-transform duration-300 hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        'rounded-[var(--radius-soft)]'
      )}
    >
      <div
        style={{ WebkitMaskImage: notch, maskImage: notch }}
        className={cn(
          'absolute inset-0 overflow-hidden rounded-[var(--radius-soft)]',
          'shadow-[var(--shadow-soft)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-soft-lg)]',
          tone.bg
        )}
      >
        <ScribbleStroke
          className={cn(
            'pointer-events-none absolute -top-2 right-0 w-[85%] text-background',
            'transition-transform duration-500 group-hover:scale-105'
          )}
        />
      </div>

      <div className="relative flex h-full min-h-[248px] flex-col gap-4 p-6">
        <div className="flex items-start justify-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <span className={chip}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
            {isDueSoon && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-butter px-3 py-1 text-xs font-medium text-pastel-butter-foreground">
                <Clock className="h-3 w-3" />
                Due soon
              </span>
            )}
          </div>
        </div>

        <div className="pr-4">
          <h3 className={cn('font-heading text-xl font-extrabold leading-tight tracking-tight', tone.text)}>
            {assessment?.title || 'Untitled Assessment'}
          </h3>
          <p className={cn('mt-1 text-sm opacity-80', tone.text)}>
            {[assessment?.subject, assessment?.exam_board, assessment?.year].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pr-16">
          {due && (
            <span className={chip}>
              <Calendar className="h-3 w-3" />
              {format(due, 'dd MMM yyyy')}
            </span>
          )}
        </div>

        {assignment.notes && (
          <p className={cn('line-clamp-2 pr-16 text-xs leading-relaxed opacity-75', tone.text)}>
            <span className="font-semibold">Instructions:</span> {assignment.notes}
          </p>
        )}
      </div>

      <span
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, right: 0, top: '88%' }}
        className="absolute flex -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background"
      >
        <ArrowUpRight className="h-6 w-6" strokeWidth={2.25} />
      </span>
    </button>
  );
};

export default AssessmentCard;
