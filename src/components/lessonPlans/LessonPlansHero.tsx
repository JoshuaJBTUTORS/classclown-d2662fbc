import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrentWeekBanner } from './CurrentWeekBanner';

interface LessonPlansHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalSubjects: number;
  totalPlans: number;
  totalWeeks: number;
}

const stats = (totalSubjects: number, totalPlans: number, totalWeeks: number) => [
  { label: 'Active subjects', value: totalSubjects, tone: 'bg-pastel-mint text-pastel-mint-foreground' },
  { label: 'Lesson plans', value: totalPlans, tone: 'bg-pastel-lilac text-pastel-lilac-foreground' },
  { label: 'Weeks covered', value: totalWeeks, tone: 'bg-pastel-butter text-pastel-butter-foreground' },
];

export const LessonPlansHero: React.FC<LessonPlansHeroProps> = ({
  searchTerm,
  onSearchChange,
  totalSubjects,
  totalPlans,
  totalWeeks
}) => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <CurrentWeekBanner />

      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Lesson Plans
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Browse every subject, see what is being taught each week, and keep your materials in one calm place.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subjects, topics or terms..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'h-14 rounded-full border-0 bg-card pl-14 pr-5 text-base',
              'shadow-[var(--shadow-soft)] placeholder:text-muted-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats(totalSubjects, totalPlans, totalWeeks).map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-[var(--radius-soft)] p-6 transition-transform duration-300 hover:-translate-y-1',
                'shadow-[var(--shadow-soft)]',
                stat.tone
              )}
            >
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              <div className="mt-1 text-sm font-medium opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
