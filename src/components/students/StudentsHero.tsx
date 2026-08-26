import React from 'react';
import { cn } from '@/lib/utils';

interface StudentsHeroProps {
  title: string;
  totalCount: number;
  activeCount: number;
  trialCount: number;
  actions?: React.ReactNode;
}

const StatPill: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className={cn('rounded-full px-5 py-2.5 shadow-[var(--shadow-soft)]', tone)}>
    <span className="font-heading text-lg font-extrabold tracking-tight">{value}</span>
    <span className="ml-2 text-sm opacity-80">{label}</span>
  </div>
);

export const StudentsHero: React.FC<StudentsHeroProps> = ({
  title,
  totalCount,
  activeCount,
  trialCount,
  actions,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="flex flex-wrap gap-3">
        <StatPill label="Total" value={totalCount} tone="bg-pastel-sky text-pastel-sky-foreground" />
        <StatPill label="Active" value={activeCount} tone="bg-pastel-mint text-pastel-mint-foreground" />
        <StatPill label="Trial" value={trialCount} tone="bg-pastel-butter text-pastel-butter-foreground" />
      </div>
    </div>
  );
};

export default StudentsHero;
