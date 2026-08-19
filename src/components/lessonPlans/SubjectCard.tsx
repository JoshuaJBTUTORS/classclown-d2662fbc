import React from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { ScribbleStroke } from './ScribbleStroke';
import { getPastelTone } from './pastelPalette';
import { cn } from '@/lib/utils';

interface SubjectCardProps {
  subject: string;
  totalPlans: number;
  weeks: number;
  lastUpdated: string;
  onClick: () => void;
  index: number;
}

/** Radius of the circular arrow button + the notch punched out of the tile. */
const BUTTON_SIZE = 56;
const NOTCH_RADIUS = BUTTON_SIZE / 2 + 8;

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  totalPlans,
  weeks,
  lastUpdated,
  onClick,
  index
}) => {
  const tone = getPastelTone(subject);
  const isRecentlyUpdated = new Date(lastUpdated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Concave cut-out on the right edge so the arrow button looks punched out of the tile.
  const notch = `radial-gradient(circle ${NOTCH_RADIUS}px at calc(100% - ${BUTTON_SIZE / 2}px) 58%, transparent 99%, #000 100%)`;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      className={cn(
        'group relative w-full text-left animate-fade-in',
        'min-h-[236px]',
        'transition-transform duration-300 hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        'rounded-[var(--radius-soft)]'
      )}
    >
      {/* Masked pastel surface (holds the notch) */}
      <div
        style={{ WebkitMaskImage: notch, maskImage: notch }}
        className={cn(
          'absolute inset-0 rounded-[var(--radius-soft)] overflow-hidden',
          'shadow-[var(--shadow-soft)] group-hover:shadow-[var(--shadow-soft-lg)] transition-shadow duration-300',
          tone.bg
        )}
      >
        {/* painted scribble */}
        <ScribbleStroke
          className={cn(
            'pointer-events-none absolute -top-2 right-0 w-[85%] text-background',
            'transition-transform duration-500 group-hover:scale-105'
          )}
        />
      </div>

      {/* Content sits above the masked surface */}
      <div className="relative flex h-full min-h-[236px] flex-col justify-between p-6">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-[var(--shadow-soft)]">
          <Star className={cn('h-5 w-5', tone.text)} strokeWidth={2} />
          {isRecentlyUpdated && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-foreground ring-2 ring-background" />
          )}
        </div>

        <div className="pr-16">
          <h3 className={cn('font-heading text-2xl font-extrabold leading-tight tracking-tight', tone.text)}>
            {subject}
          </h3>
        </div>
      </div>

      {/* Arrow button sitting inside the cut-out */}
      <span
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, right: 0, top: '58%' }}
        className={cn(
          'absolute -translate-y-1/2 flex items-center justify-center rounded-full',
          'bg-foreground text-background'
        )}
      >
        <ArrowUpRight className="h-6 w-6" strokeWidth={2.25} />
      </span>
    </button>
  );
};
