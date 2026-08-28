import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
        <div className="h-72 animate-pulse rounded-[1.25rem] bg-muted" />
      </ProgressPanel>
    );
  }

  return (
    <ProgressPanel title="Homework over time" description={description}>
      <div className="h-72">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="homeworkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="[stop-color:hsl(var(--pastel-blush-foreground))]" stopOpacity={0.28} />
                  <stop offset="100%" className="[stop-color:hsl(var(--pastel-blush-foreground))]" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                fontSize={11}
                width={34}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area
                type="monotone"
                dataKey="percentage"
                strokeWidth={3}
                fill="url(#homeworkFill)"
                className="stroke-pastel-blush-foreground"
                activeDot={{ r: 6, strokeWidth: 0, className: 'fill-pastel-blush-foreground' }}
                dot={{ r: 4, strokeWidth: 0, className: 'fill-pastel-blush-foreground' }}
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
    </ProgressPanel>
  );
};

export default ProgressChart;
