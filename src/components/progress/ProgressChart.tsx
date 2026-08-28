import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useHeyCleoProgress } from '@/hooks/useHeyCleoProgress';
import ProgressPanel from './ProgressPanel';
import { DoodleEmpty } from './ProgressDoodles';

interface ProgressChartProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedStudents: string[];
    selectedSubjects: string[];
  };
  userRole: string;
}

interface HomeworkScore {
  date: string;
  percentage: number;
  subject: string;
  homework_title: string;
  student_name?: string;
}

const Pill: React.FC<{ tone: 'mint' | 'sky' | 'butter'; label: string; value: string }> = ({
  tone,
  label,
  value,
}) => {
  const tones = {
    mint: 'bg-pastel-mint text-pastel-mint-foreground',
    sky: 'bg-pastel-sky text-pastel-sky-foreground',
    butter: 'bg-pastel-butter text-pastel-butter-foreground',
  } as const;

  return (
    <div className={`flex items-baseline gap-2 rounded-full px-4 py-2 ${tones[tone]}`}>
      <span className="text-[11px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-heading text-sm font-semibold">{value}</span>
    </div>
  );
};

const ProgressChart: React.FC<ProgressChartProps> = ({ filters, userRole }) => {
  const { data: heycleo, isLoading: loading } = useHeyCleoProgress(filters.selectedStudents);

  const nameByHeycleoId = useMemo(() => {
    const map = new Map<string, string>();
    heycleo.students.forEach((s) => {
      if (s.heycleoStudentId) map.set(s.heycleoStudentId, s.name);
    });
    return map;
  }, [heycleo.students]);

  const data = useMemo<HomeworkScore[]>(() => {
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
      .map(({ hw, raw }) => ({
        date: format(parseISO(raw as string), 'MMM dd'),
        percentage: Math.round(Number(hw.percentage)),
        subject: hw.subject || 'General',
        homework_title: hw.title || 'Homework',
        student_name:
          heycleo.students.length > 1 && hw.student_id
            ? nameByHeycleoId.get(hw.student_id)
            : undefined,
      }))
      .filter((item) =>
        filters.selectedSubjects.length > 0 ? filters.selectedSubjects.includes(item.subject) : true,
      );
  }, [heycleo, filters.dateRange.from, filters.dateRange.to, filters.selectedSubjects, nameByHeycleoId]);

  const summary = useMemo(() => {
    if (data.length === 0) return null;
    const scores = data.map((d) => d.percentage);
    const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
    return {
      average,
      latest: scores[scores.length - 1],
      best: Math.max(...scores),
      count: scores.length,
    };
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="rounded-[1rem] border border-border/60 bg-card px-4 py-3 shadow-lg">
          <p className="font-heading text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm font-medium text-pastel-blush-foreground">Score: {point.percentage}%</p>
          <p className="text-xs text-muted-foreground">{point.subject}</p>
          <p className="text-xs text-muted-foreground">{point.homework_title}</p>
          {point.student_name && <p className="text-xs text-muted-foreground">Student: {point.student_name}</p>}
        </div>
      );
    }
    return null;
  };

  const description =
    userRole === 'owner' ? 'Student homework scores over time' : 'Your homework scores over time';

  if (loading) {
    return (
      <ProgressPanel title="Homework over time" description="Loading homework scores...">
        <div className="h-80 animate-pulse rounded-[1.25rem] bg-muted" />
      </ProgressPanel>
    );
  }

  return (
    <ProgressPanel
      title="Homework over time"
      description={description}
      action={
        summary ? (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Pill tone="sky" label="Average" value={`${summary.average}%`} />
          </div>
        ) : undefined
      }
    >
      <div className="h-80 rounded-[1.25rem] bg-muted/30 p-3">
        {data.length > 0 && summary ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="homeworkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="[stop-color:hsl(var(--pastel-blush-foreground))]" stopOpacity={0.35} />
                  <stop offset="100%" className="[stop-color:hsl(var(--pastel-blush-foreground))]" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* pastel guide bands instead of gridlines */}
              <ReferenceArea
                y1={0}
                y2={40}
                className="fill-pastel-blush"
                fillOpacity={0.35}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
              <ReferenceArea
                y1={40}
                y2={70}
                className="fill-pastel-butter"
                fillOpacity={0.35}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />
              <ReferenceArea
                y1={70}
                y2={100}
                className="fill-pastel-mint"
                fillOpacity={0.35}
                strokeOpacity={0}
                ifOverflow="extendDomain"
              />

              <XAxis
                dataKey="date"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 40, 70, 100]}
                fontSize={11}
                width={34}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />

              {/* average baseline */}
              <ReferenceLine
                y={summary.average}
                strokeDasharray="6 6"
                strokeWidth={2}
                className="stroke-pastel-lilac-foreground"
                label={{
                  value: `avg ${summary.average}%`,
                  position: 'right',
                  fontSize: 11,
                  className: 'fill-muted-foreground',
                }}
              />

              <Area
                type="monotone"
                dataKey="percentage"
                strokeWidth={3}
                fill="url(#homeworkFill)"
                className="stroke-pastel-blush-foreground"
                activeDot={{ r: 7, strokeWidth: 2, className: 'fill-card stroke-pastel-blush-foreground' }}
                dot={{ r: 4, strokeWidth: 2, className: 'fill-card stroke-pastel-blush-foreground' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <DoodleEmpty className="h-16 w-20 text-muted-foreground/50" />
            <p className="mt-3 font-heading text-sm font-semibold text-muted-foreground">No homework scores yet</p>
            <p className="text-xs text-muted-foreground/80">Nothing matches these filters</p>
          </div>
        )}
      </div>

      {summary && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Pill tone="mint" label="Latest" value={`${summary.latest}%`} />
          <Pill tone="butter" label="Best" value={`${summary.best}%`} />
          <Pill tone="sky" label="Marked" value={`${summary.count}`} />
        </div>
      )}
    </ProgressPanel>
  );
};

export default ProgressChart;
