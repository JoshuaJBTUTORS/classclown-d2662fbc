import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';
import ProgressPanel from './ProgressPanel';
import {
  DoodleEmpty,
  DoodleFaceHappy,
  DoodleFaceLow,
  DoodleFaceSteady,
  DoodleStar,
} from './ProgressDoodles';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
  };
  userRole: string;
}

interface HomeworkScore {
  key: string;
  date: Date;
  percentage: number;
  subject: string;
  homework_title: string;
  student_name?: string;
}

interface MonthBucket {
  key: string;
  label: string;
  average: number | null;
  count: number;
  items: HomeworkScore[];
  delta: number | null;
}

const faceFor = (score: number) => {
  if (score >= 75) return { Icon: DoodleFaceHappy, mood: 'Flying' };
  if (score >= 50) return { Icon: DoodleFaceSteady, mood: 'Steady' };
  return { Icon: DoodleFaceLow, mood: 'Needs a hand' };
};

const dotTone = (score: number) =>
  score >= 75 ? 'bg-pastel-mint-foreground' : score >= 50 ? 'bg-pastel-butter-foreground' : 'bg-pastel-blush-foreground';

const HomeworkByMonth: React.FC<ProgressChartProps> = ({ filters, userRole }) => {
  const { data: heycleo, isLoading: loading } = useHeyCleoProgress(filters.selectedStudents);
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const nameByHeycleoId = useMemo(() => {
    const map = new Map<string, string>();
    heycleo.students.forEach((s) => {
      if (s.heycleoStudentId) map.set(s.heycleoStudentId, s.name);
    });
    return map;
  }, [heycleo.students]);

  const scores = useMemo<HomeworkScore[]>(() => {
    const from = filters.dateRange.from?.getTime();
    const to = filters.dateRange.to?.getTime();

    return heycleo.homework
      .filter((hw) => hw.percentage != null)
      .map((hw) => {
        const raw = hw.submitted_at ?? hw.due_date ?? hw.assigned_at;
        return { hw, time: raw ? new Date(raw).getTime() : NaN, raw };
      })
      .filter(({ time }) => !Number.isNaN(time))
      .filter(({ time }) => (from ? time >= from : true) && (to ? time <= to : true))
      .sort((a, b) => a.time - b.time)
      .map(({ hw, raw }) => {
        const date = parseISO(raw as string);
        return {
          key: format(date, 'yyyy-MM'),
          date,
          percentage: Math.round(Number(hw.percentage)),
          subject: hw.subject || 'General',
          homework_title: hw.title || 'Homework',
          student_name:
            heycleo.students.length > 1 && hw.student_id
              ? nameByHeycleoId.get(hw.student_id)
              : undefined,
        };
      });
  }, [heycleo, filters.dateRange.from, filters.dateRange.to, nameByHeycleoId]);

  const months = useMemo<MonthBucket[]>(() => {
    if (scores.length === 0) return [];

    const first = filters.dateRange.from ?? scores[0].date;
    const last = filters.dateRange.to ?? new Date();
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(last.getFullYear(), last.getMonth(), 1);

    const grouped = new Map<string, HomeworkScore[]>();
    scores.forEach((s) => {
      const arr = grouped.get(s.key);
      if (arr) arr.push(s);
      else grouped.set(s.key, [s]);
    });

    const list: MonthBucket[] = [];
    let previousAverage: number | null = null;

    while (cursor <= end) {
      const key = format(cursor, 'yyyy-MM');
      const items = grouped.get(key) ?? [];
      const average =
        items.length > 0
          ? Math.round(items.reduce((sum, i) => sum + i.percentage, 0) / items.length)
          : null;

      list.push({
        key,
        label: format(cursor, 'MMMM yyyy'),
        average,
        count: items.length,
        items: [...items].sort((a, b) => b.date.getTime() - a.date.getTime()),
        delta: average != null && previousAverage != null ? average - previousAverage : null,
      });

      if (average != null) previousAverage = average;
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return list.reverse();
  }, [scores, filters.dateRange.from, filters.dateRange.to]);

  const summary = useMemo(() => {
    const scored = months.filter((m) => m.average != null);
    if (scored.length === 0) return null;
    const overall = Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length);
    const best = scored.reduce((a, b) => ((b.average ?? 0) > (a.average ?? 0) ? b : a));

    // improving streak from the most recent scored month backwards
    let streak = 0;
    for (const month of scored) {
      if (month.delta != null && month.delta > 0) streak += 1;
      else break;
    }

    return { overall, best, marked: scores.length, streak };
  }, [months, scores]);

  const description =
    userRole === 'owner' ? 'Student homework, month by month' : 'Your homework, month by month';

  if (loading) {
    return (
      <ProgressPanel title="Homework by month" description="Loading homework scores...">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[1.25rem] bg-muted" />
          ))}
        </div>
      </ProgressPanel>
    );
  }

  return (
    <ProgressPanel title="Homework by month" description={description}>
      {summary && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="flex items-baseline gap-2 rounded-full bg-foreground px-4 py-2 text-background">
            <span className="text-[11px] uppercase tracking-wide opacity-70">Average</span>
            <span className="font-heading text-sm font-semibold">{summary.overall}%</span>
          </span>
          <span className="flex items-baseline gap-2 rounded-full border border-foreground/15 px-4 py-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Marked</span>
            <span className="font-heading text-sm font-semibold">{summary.marked}</span>
          </span>
          {summary.streak > 1 && (
            <span className="flex items-center gap-1.5 rounded-full bg-pastel-mint px-4 py-2 text-pastel-mint-foreground">
              <DoodleStar className="h-4 w-4" />
              <span className="text-xs font-semibold">{summary.streak} months improving</span>
            </span>
          )}
        </div>
      )}

      {months.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-foreground/20 text-center">
          <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
          <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No homework scores yet</p>
          <p className="text-xs text-muted-foreground/80">Try a wider date range</p>
        </div>
      ) : (
        <TooltipProvider delayDuration={100}>
          <div className="space-y-3">
            {months.map((month, index) => {
              const isBest = summary?.best.key === month.key && month.average != null;
              const isOpen = expanded === month.key;
              const hasData = month.average != null;
              const { Icon, mood } = faceFor(month.average ?? 0);

              return (
                <motion.div
                  key={month.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
                  whileHover={reduceMotion || !hasData ? undefined : { y: -3 }}
                  className={cn(
                    'group overflow-hidden rounded-[1.5rem] border transition-shadow',
                    isBest
                      ? 'border-foreground bg-foreground text-background shadow-md'
                      : hasData
                        ? 'border-foreground/15 bg-background hover:shadow-md'
                        : 'border-dashed border-foreground/10 bg-muted/30',
                  )}
                >
                  <button
                    type="button"
                    disabled={!hasData}
                    onClick={() => setExpanded(isOpen ? null : month.key)}
                    className="w-full px-5 py-5 text-left disabled:cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                          isBest
                            ? 'bg-background/15 text-background'
                            : hasData
                              ? 'bg-foreground/5 text-foreground'
                              : 'bg-foreground/5 text-muted-foreground',
                        )}
                      >
                        {isBest ? <DoodleStar className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-sm font-semibold">{month.label}</p>
                        <p className={cn('text-xs', isBest ? 'opacity-70' : 'text-muted-foreground')}>
                          {hasData
                            ? `${month.count} piece${month.count === 1 ? '' : 's'} · ${isBest ? 'Best month' : mood}`
                            : 'Nothing marked'}
                        </p>
                      </div>

                      {month.delta != null && month.delta !== 0 && (
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            isBest
                              ? 'bg-background/20 text-background'
                              : month.delta > 0
                                ? 'bg-pastel-mint text-pastel-mint-foreground'
                                : 'bg-pastel-blush text-pastel-blush-foreground',
                          )}
                        >
                          {month.delta > 0 ? '+' : ''}
                          {month.delta}
                        </span>
                      )}

                      <span className="font-heading text-3xl font-bold tabular-nums">
                        {hasData ? `${month.average}%` : '—'}
                      </span>

                      {hasData && (
                        <ChevronDown
                          className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                        />
                      )}
                    </div>

                    <div
                      className={cn(
                        'mt-4 h-3 overflow-hidden rounded-full',
                        isBest ? 'bg-background/25' : 'bg-foreground/10',
                      )}
                    >
                      <motion.div
                        initial={reduceMotion ? false : { width: 0 }}
                        animate={{ width: `${month.average ?? 0}%` }}
                        transition={{ duration: 0.7, delay: 0.1 + Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
                        className={cn('h-full rounded-full', isBest ? 'bg-background' : 'bg-foreground')}
                      />
                    </div>

                    {hasData && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {month.items.map((item, i) => (
                          <Tooltip key={`${month.key}-dot-${i}`}>
                            <TooltipTrigger asChild>
                              <span
                                className={cn(
                                  'h-2.5 w-2.5 rounded-full',
                                  isBest ? 'bg-background/70' : dotTone(item.percentage),
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="rounded-xl">
                              {item.homework_title} · {item.percentage}%
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="details"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div
                          className={cn(
                            'space-y-2 border-t px-5 py-4',
                            isBest ? 'border-background/20' : 'border-foreground/10',
                          )}
                        >
                          {month.items.map((item, i) => (
                            <motion.div
                              key={`${month.key}-item-${i}`}
                              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.04 }}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">{item.homework_title}</p>
                                <p className={cn('text-xs', isBest ? 'opacity-70' : 'text-muted-foreground')}>
                                  {format(item.date, 'dd MMM')} · {item.subject}
                                  {item.student_name ? ` · ${item.student_name}` : ''}
                                </p>
                              </div>
                              <span className="font-heading font-semibold tabular-nums">{item.percentage}%</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </ProgressPanel>
  );
};

export default HomeworkByMonth;
