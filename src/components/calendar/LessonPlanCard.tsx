import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DoodleBook } from './LessonDoodles';
import { useLessonPlanForLesson } from '@/hooks/useLessonPlanForLesson';

interface LessonPlanCardProps {
  subject: string | null | undefined;
  startTime: string | null | undefined;
  canManagePlans?: boolean;
}

const LessonPlanCard: React.FC<LessonPlanCardProps> = ({ subject, startTime, canManagePlans }) => {
  const { plan, weekNumber, term, weekRange, subjectHasPlans, planSubject, isLoading } =
    useLessonPlanForLesson(subject, startTime);

  if (!subject || !weekNumber) return null;

  return (
    <div className="rounded-[var(--radius-soft)] bg-pastel-mint p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight text-pastel-mint-foreground">
            <DoodleBook className="h-5 w-5" />
            Lesson Plan
          </h3>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground">{planSubject}</span>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-soft)]">

          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Week {weekNumber}</span>
            {term && <span>· {term} term</span>}
            {weekRange && <span>· {weekRange}</span>}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading plan...
            </div>
          ) : plan ? (
            <>
              <p className="text-sm font-medium">{plan.topic_title}</p>
              {plan.description && (
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              )}
            </>
          ) : subjectHasPlans ? (
            <p className="text-sm text-muted-foreground">No plan set for Week {weekNumber}.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No lesson plan linked for {planSubject}.
              {canManagePlans && (
                <>
                  {' '}
                  <Link to="/lesson-plans" className="text-primary underline underline-offset-2">
                    Open Lesson Plans
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonPlanCard;
