import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';
import ProgressPanel from './ProgressPanel';
import { DoodleEmpty } from './ProgressDoodles';

interface ProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
  };
  userRole: string;
}

interface HomeworkScore {
  key: string; // yyyy-MM
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

const StatPill: React.FC<{ label: string; value: string; solid?: boolean }> = ({
  label,
  value,
  solid,
}) => (
  <div
    className={cn(
      'flex items-baseline gap-2 rounded-full px-4 py-2',
      solid ? 'bg-foreground text-background' : 'border border-foreground/15 bg-background text-foreground',
    )}
  >
    <span className="text-[11px] uppercase tracking-wide opacity-70">{label}</span>
    <span className="font-heading text-sm font-semibold">{value}</span>
  </div>
);

const HomeworkByMonth: React.FC<ProgressChartProps> = ({ filters, userRole }) => {
  const { data: heycleo, isLoading: loading } = useHeyCleoProgress(filters.selectedStudents);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    const overall = Math.round(
      scores.reduce((sum, s) => sum + s.percentage, 0) / Math.max(scores.length, 1),
    );
    const best = scored.reduce((a, b) => ((b.average ?? 0) > (a.average ?? 0) ? b : a));
    return { overall, best, marked: scores.length };
  }, [months, scores]);

  const description =
    userRole === 'owner' ? 'Student homework results, month by month' : 'Your homework results, month by month';

  if (loading) {
    return (
      <ProgressPanel title="Homework by month" description="Loading homework scores...">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[1.25rem] bg-muted" />
          ))}
        </div>
      </ProgressPanel>
    );
  }

  return (
    <ProgressPanel
      title="Homework by month"
      description={description}
      action={
        summary ? (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <StatPill label="Average" value={`${summary.overall}%`} solid />
            <StatPill label="Marked" value={`${summary.marked}`} />
          </div>
        ) : undefined
      }
    >
      {months.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-foreground/20 text-center">
          <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
          <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No homework scores yet</p>
          <p className="text-xs text-muted-foreground/80">Nothing matches this date range</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map((month) => {
            const isBest = summary?.best.key === month.key && month.average != null;
            const isOpen = expanded === month.key;
            const hasData = month.average != null;

            return (
              <div
                key={month.key}
                className={cn(
                  'overflow-hidden rounded-[1.25rem] border transition-colors',
                  isBest
                    ? 'border-foreground bg-foreground text-background'
                    : hasData
                      ? 'border-foreground/15 bg-background'
                      : 'border-dashed border-foreground/10 bg-muted/30',
                )}
              >
                <button
                  type="button"
                  disabled={!hasData}
                  onClick={() => setExpanded(isOpen ? null : month.key)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left disabled:cursor-default"
                >
                  <div className="min-w-[9rem]">
                    <p className="font-heading text-sm font-semibold">{month.label}</p>
                    <p className={cn('text-xs', isBest ? 'opacity-70' : 'text-muted-foreground')}>
                      {hasData
                        ? `${month.count} piece${month.count === 1 ? '' : 's'} marked`
                        : 'Nothing marked'}
                    </p>
                  </div>

                  <div className="flex flex-1 items-center gap-4">
                    <div
                      className={cn(
                        'h-2.5 flex-1 overflow-hidden rounded-full',
                        isBest ? 'bg-background/25' : 'bg-foreground/10',
                      )}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          isBest ? 'bg-background' : 'bg-foreground',
                        )}
                        style={{ width: `${month.average ?? 0}%` }}
                      />
                    </div>
                    <span className="font-heading text-2xl font-bold tabular-nums">
                      {hasData ? `${month.average}%` : '—'}
                    </span>
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

                  {hasData && (
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                    />
                  )}
                </button>

                {isOpen && (
                  <div
                    className={cn(
                      'space-y-2 border-t px-5 py-4',
                      isBest ? 'border-background/20' : 'border-foreground/10',
                    )}
                  >
                    {month.items.map((item, index) => (
                      <div
                        key={`${item.homework_title}-${index}`}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ProgressPanel>
  );
};

export default HomeworkByMonth;
