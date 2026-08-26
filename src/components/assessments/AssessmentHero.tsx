import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  pendingCount: number;
  dueSoonCount: number;
  completedCount: number;
}

const StatPill: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className={cn('rounded-full px-5 py-2.5 shadow-[var(--shadow-soft)]', tone)}>
    <span className="font-heading text-lg font-extrabold tracking-tight">{value}</span>
    <span className="ml-2 text-sm opacity-80">{label}</span>
  </div>
);

export const AssessmentHero: React.FC<AssessmentHeroProps> = ({
  searchTerm,
  onSearchChange,
  pendingCount,
  dueSoonCount,
  completedCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Assessment Center
        </h1>
        <p className="text-muted-foreground">
          Complete your assigned assessments and track your progress
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'h-14 rounded-full border-0 bg-card pl-14 pr-5 text-base',
              'shadow-[var(--shadow-soft)] placeholder:text-muted-foreground',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0'
            )}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <StatPill label="To do" value={pendingCount} tone="bg-pastel-mint text-pastel-mint-foreground" />
          <StatPill label="Due soon" value={dueSoonCount} tone="bg-pastel-butter text-pastel-butter-foreground" />
          <StatPill label="Completed" value={completedCount} tone="bg-pastel-sky text-pastel-sky-foreground" />
        </div>
      </div>
    </div>
  );
};

export default AssessmentHero;
