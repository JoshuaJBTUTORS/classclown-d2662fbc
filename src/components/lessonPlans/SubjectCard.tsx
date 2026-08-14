import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SubjectIcon } from './SubjectIcon';
import { getPastelTone } from './pastelPalette';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  subject: string;
  totalPlans: number;
  terms: number;
  weeks: number;
  lastUpdated: string;
  onClick: () => void;
  index: number;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  totalPlans,
  terms,
  weeks,
  lastUpdated,
  onClick,
  index
}) => {
  const tone = getPastelTone(subject);
  const isRecentlyUpdated = new Date(lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      className={cn(
        'group relative w-full text-left overflow-hidden animate-fade-in',
        'rounded-[var(--radius-soft)] p-6 min-h-[190px]',
        'shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-lg)]',
        'transition-all duration-300 hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        tone.bg
      )}
    >
      {/* soft scribble-style highlight, purely decorative */}
      <div className="pointer-events-none absolute -top-10 -right-6 h-32 w-32 rounded-full bg-background/25 blur-2xl" />

      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-background/70', tone.text)}>
            <SubjectIcon subject={subject} className="h-5 w-5" />
          </div>

          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background',
              'transition-transform duration-300 group-hover:rotate-45'
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-3">
          <h3 className={cn('text-xl font-bold leading-snug tracking-tight', tone.text)}>
            {subject}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
              {weeks} week{weeks !== 1 ? 's' : ''}
            </span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
              {terms} term{terms !== 1 ? 's' : ''}
            </span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', tone.chip)}>
              {totalPlans} plan{totalPlans !== 1 ? 's' : ''}
            </span>
            {isRecentlyUpdated && (
              <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                Updated
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
