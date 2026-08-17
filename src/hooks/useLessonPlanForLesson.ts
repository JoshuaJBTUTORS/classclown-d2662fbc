import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAcademicWeekForDate } from '@/utils/academicWeekUtils';
import { resolvePlanSubject } from '@/utils/lessonPlanSubjectMatch';

export interface LessonPlanMatch {
  id: string;
  subject: string;
  week_number: number;
  term: string;
  topic_title: string;
  description: string | null;
}

interface Result {
  plan: LessonPlanMatch | null;
  weekNumber: number | null;
  term: string | null;
  weekRange: string | null;
  academicYear: string | null;
  subjectHasPlans: boolean;
  planSubject: string | null;
  isLoading: boolean;
}

export function useLessonPlanForLesson(
  subject: string | null | undefined,
  startTime: string | null | undefined
): Result {
  const [plan, setPlan] = useState<LessonPlanMatch | null>(null);
  const [subjectHasPlans, setSubjectHasPlans] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const date = startTime ? new Date(startTime) : null;
  const weekInfo = date && !isNaN(date.getTime()) ? getAcademicWeekForDate(date) : null;
  const planSubject = resolvePlanSubject(subject);

  useEffect(() => {
    if (!planSubject || !weekInfo) {
      setPlan(null);
      setSubjectHasPlans(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('lesson_plans')
          .select('id, subject, week_number, term, topic_title, description')
          .ilike('subject', planSubject)
          .order('week_number', { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        const rows = (data ?? []) as LessonPlanMatch[];
        setSubjectHasPlans(rows.length > 0);
        setPlan(rows.find((r) => r.week_number === weekInfo.currentWeek) ?? null);
      } catch (err) {
        console.error('useLessonPlanForLesson error', err);
        if (!cancelled) {
          setPlan(null);
          setSubjectHasPlans(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSubject, weekInfo?.currentWeek]);

  return {
    plan,
    weekNumber: weekInfo?.currentWeek ?? null,
    term: weekInfo?.currentTerm ?? null,
    weekRange: weekInfo?.weekRange ?? null,
    academicYear: weekInfo?.academicYear ?? null,
    subjectHasPlans,
    planSubject,
    isLoading,
  };
}
