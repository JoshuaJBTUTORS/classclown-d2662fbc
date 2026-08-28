import React from 'react';
import { Filter, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoodleChat, DoodleCoin } from '@/components/progress/ProgressDoodles';

interface CalendarHeroProps {
  canUseFilters: boolean;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  canScheduleLessons: boolean;
  onSchedule: () => void;
  showFamilyActions: boolean;
  onRequestTopic: () => void;
  onReferFriend: () => void;
}

const pillBase =
  'inline-flex items-center gap-2 rounded-full px-5 h-11 text-sm font-medium transition-all duration-200 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const pillSoft = cn(pillBase, 'bg-card text-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5');
const pillDark = cn(pillBase, 'bg-foreground text-background hover:-translate-y-0.5 hover:opacity-90');

const chipBase = cn(
  pillBase,
  'pl-2 pr-4 gap-2.5 bg-transparent text-foreground border border-foreground hover:-translate-y-0.5 hover:bg-foreground/5',
);
const chipIcon =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground';


export const CalendarHero: React.FC<CalendarHeroProps> = ({
  canUseFilters,
  filtersOpen,
  onToggleFilters,
  canScheduleLessons,
  onSchedule,
  showFamilyActions,
  onRequestTopic,
  onReferFriend,
}) => {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Cleo Calendar
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Every lesson, trial and tutor slot in one soft, scrollable view.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canUseFilters && (
          <button type="button" onClick={onToggleFilters} className={filtersOpen ? pillDark : pillSoft}>
            <Filter className="h-4 w-4" />
            {filtersOpen ? 'Hide filters' : 'Filters'}
          </button>
        )}

        {showFamilyActions && (
          <>
            <button
              type="button"
              onClick={onRequestTopic}
              className={cn(chipBase, 'bg-pastel-sky text-pastel-sky-foreground')}
            >
              <span className={chipIcon}>
                <DoodleChat className="h-4 w-4" />
              </span>
              Request topic
            </button>
            <button
              type="button"
              onClick={onReferFriend}
              className={cn(chipBase, 'bg-pastel-blush text-pastel-blush-foreground')}
            >
              <span className={chipIcon}>
                <DoodleCoin className="h-4 w-4" />
              </span>
              Refer a friend
              <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                £100
              </span>
            </button>
          </>
        )}


        {canScheduleLessons && (
          <button type="button" onClick={onSchedule} className={pillDark}>
            <CalendarPlus className="h-4 w-4" />
            Schedule lesson
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarHero;
