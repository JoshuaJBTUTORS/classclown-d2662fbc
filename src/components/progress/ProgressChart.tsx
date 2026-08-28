import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';
import ProgressPanel from './ProgressPanel';
import { DoodleEmpty } from './ProgressDoodles';
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
  shortLabel: string;
  average: number | null;
  count: number;
  items: HomeworkScore[];
}

/** Number of months visible in the chart window at once. */
const WINDOW = 6;

type ChartPoint = { key: string; x: number; y: number };

/**
 * Smooth, slightly wobbly path through the points (Catmull-Rom style smoothing
 * with a small alternating lift so the line reads as hand-drawn).
 */
const squigglePath = (pts: ChartPoint[]) => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.01} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const wobble = i % 2 === 0 ? -2.2 : 2.2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6 + wobble;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6 - wobble;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const HomeworkByMonth: React.FC<ProgressChartProps> = ({ filters, userRole }) => {
  const { data: heycleo, isLoading: loading } = useHeyCleoProgress(filters.selectedStudents);
  const [offset, setOffset] = useState(0);
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
    while (cursor <= end) {
      const key = format(cursor, 'yyyy-MM');
      const items = grouped.get(key) ?? [];
      list.push({
        key,
        label: format(cursor, 'MMMM yyyy'),
        shortLabel: format(cursor, 'MMM'),
        average:
          items.length > 0
            ? Math.round(items.reduce((sum, i) => sum + i.percentage, 0) / items.length)
            : null,
        count: items.length,
        items: [...items].sort((a, b) => b.date.getTime() - a.date.getTime()),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return list;
  }, [scores, filters.dateRange.from, filters.dateRange.to]);

  const maxOffset = Math.max(0, months.length - WINDOW);

  // Always land on the most recent window when the data or range changes.
  useEffect(() => {
    setOffset(Math.max(0, months.length - WINDOW));
  }, [months.length]);

  const clampedOffset = Math.min(offset, maxOffset);
  const visible = months.slice(clampedOffset, clampedOffset + WINDOW);

  const overall = useMemo(() => {
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length);
  }, [scores]);

  const windowLabel =
    visible.length > 0
      ? visible.length === 1
        ? visible[0].label
        : `${format(new Date(`${visible[0].key}-01`), 'MMM yyyy')} – ${format(
            new Date(`${visible[visible.length - 1].key}-01`),
            'MMM yyyy',
          )}`
      : '';

  /** Points in the 0–100 SVG space (x = centre of each month column). */
  const points = useMemo<ChartPoint[]>(() => {
    const step = 100 / Math.max(visible.length, 1);
    return visible
      .map((month, i) =>
        month.average == null
          ? null
          : { key: month.key, x: step * i + step / 2, y: 100 - month.average },
      )
      .filter((p): p is ChartPoint => p !== null);
  }, [visible]);

  /** Contiguous runs of months with data, so gaps break the line. */
  const segments = useMemo<ChartPoint[][]>(() => {
    const step = 100 / Math.max(visible.length, 1);
    const runs: ChartPoint[][] = [];
    let current: ChartPoint[] = [];
    visible.forEach((month, i) => {
      if (month.average == null) {
        if (current.length) runs.push(current);
        current = [];
        return;
      }
      current.push({ key: month.key, x: step * i + step / 2, y: 100 - month.average });
    });
    if (current.length) runs.push(current);
    return runs;
  }, [visible]);

  const description =
    userRole === 'owner' ? 'Student homework, month by month' : 'Your homework, month by month';


  if (loading) {
    return (
      <ProgressPanel title="Homework by month" description="Loading homework scores...">
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-muted" />
      </ProgressPanel>
    );
  }

  if (months.length === 0) {
    return (
      <ProgressPanel title="Homework by month" description={description}>
        <div className="flex h-64 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-foreground/20 text-center">
          <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
          <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No homework scores yet</p>
          <p className="text-xs text-muted-foreground/80">Try a wider date range</p>
        </div>
      </ProgressPanel>
    );
  }

  return (
    <ProgressPanel
      title="Homework by month"
      description={description}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous months"
            disabled={clampedOffset === 0}
            onClick={() => setOffset(Math.max(0, clampedOffset - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9.5rem] text-center font-heading text-sm font-semibold text-foreground">
            {windowLabel}
          </span>
          <button
            type="button"
            aria-label="Next months"
            disabled={clampedOffset >= maxOffset}
            onClick={() => setOffset(Math.min(maxOffset, clampedOffset + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground transition-colors hover:bg-foreground hover:text-background disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <TooltipProvider delayDuration={80}>
        <div className="relative rounded-[1.25rem] border border-foreground/10 bg-background p-5 pt-8">
          {/* Gridlines */}
          <div className="relative h-64">
            {[100, 75, 50, 25, 0].map((line) => (
              <div
                key={line}
                className="absolute left-0 right-0 flex items-center gap-3"
                style={{ bottom: `${line}%` }}
              >
                <span className="w-8 shrink-0 text-right text-[10px] font-medium text-muted-foreground">{line}</span>
                <span className="h-px flex-1 bg-foreground/10" />
              </div>
            ))}

            {/* Average baseline */}
            {overall != null && (
              <div
                className="absolute left-11 right-0 flex items-center"
                style={{ bottom: `${overall}%` }}
              >
                <span className="h-px flex-1 border-t border-dashed border-foreground/50" />
                <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                  avg {overall}%
                </span>
              </div>
            )}

            {/* Squiggle line */}
            <div className="absolute inset-y-0 left-11 right-0">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                {segments.map((segment, i) => (
                  <g key={`seg-${i}`}>
                    {segment.length > 1 && (
                      <path
                        d={`${squigglePath(segment)} L ${segment[segment.length - 1].x} 100 L ${segment[0].x} 100 Z`}
                        fill="hsl(var(--progress-bar-fill))"
                      />
                    )}
                    <motion.path
                      d={squigglePath(segment)}
                      fill="none"
                      stroke="hsl(var(--progress-bar-line))"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      initial={reduceMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    />
                  </g>
                ))}
                {points.map((point) => (
                  <circle
                    key={`dot-${point.key}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--progress-bar-line))"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                ))}
              </svg>

              {/* Hover columns */}
              <div className="absolute inset-0 flex">
                {visible.map((month) => {
                  const hasData = month.average != null;
                  return (
                    <Tooltip key={month.key}>
                      <TooltipTrigger asChild>
                        <div className="h-full flex-1 cursor-default rounded-lg transition-colors hover:bg-foreground/[0.04]" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[16rem] rounded-xl">
                        <p className="font-semibold">{month.label}</p>
                        {hasData ? (
                          <>
                            <p className="text-xs">
                              {month.average}% average · {month.count} piece{month.count === 1 ? '' : 's'} marked
                            </p>
                            <ul className="mt-1 space-y-0.5 text-xs opacity-80">
                              {month.items.slice(0, 3).map((item, i) => (
                                <li key={`${month.key}-t-${i}`} className="truncate">
                                  {item.homework_title} · {item.percentage}%
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="text-xs">Nothing marked</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Month labels */}
          <div className="mt-3 flex gap-3 pl-11">
            {visible.map((month) => (
              <div key={`${month.key}-label`} className="flex-1 text-center">
                <p className="font-heading text-xs font-semibold text-foreground">{month.shortLabel}</p>
                <p className="text-[10px] text-muted-foreground">{month.key.slice(0, 4)}</p>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </ProgressPanel>
  );
};

export default HomeworkByMonth;
