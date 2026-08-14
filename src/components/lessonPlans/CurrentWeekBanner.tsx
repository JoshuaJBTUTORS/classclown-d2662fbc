import { Calendar, Clock } from 'lucide-react';
import { getAcademicWeekInfo } from '@/utils/academicWeekUtils';

export const CurrentWeekBanner = () => {
  const weekInfo = getAcademicWeekInfo();

  return (
    <div className="rounded-[var(--radius-soft)] bg-pastel-sky p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm font-medium text-pastel-sky-foreground/70">{weekInfo.academicYear}</p>
          <h2 className="text-4xl font-bold tracking-tight text-pastel-sky-foreground sm:text-5xl">
            Week {weekInfo.currentWeek}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-pastel-sky-foreground">
              <Calendar className="h-3 w-3" />
              {weekInfo.weekRange}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-pastel-sky-foreground">
              <Clock className="h-3 w-3" />
              {weekInfo.currentTerm}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3 lg:w-80">
          <div className="flex items-center justify-between text-sm text-pastel-sky-foreground">
            <span className="font-medium">Year progress</span>
            <span className="opacity-70">
              {weekInfo.currentWeek} / {weekInfo.totalWeeks} weeks
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-pastel-sky-foreground transition-all duration-500"
              style={{ width: `${Math.min(Math.max(weekInfo.weekProgress, 0), 100)}%` }}
            />
          </div>

          <p className="text-xs font-medium text-pastel-sky-foreground/80">
            {Math.round(weekInfo.weekProgress)}% complete
          </p>
        </div>
      </div>
    </div>
  );
};
