import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScribbleStroke } from './ScribbleStroke';
import { getPastelTone } from './pastelPalette';
import { cn } from '@/lib/utils';

interface SubjectCategorySectionProps {
  label: string;
  count: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

/** Radius of the circular arrow button + the notch punched out of the tile. */
const BUTTON_SIZE = 56;
const NOTCH_RADIUS = BUTTON_SIZE / 2 + 8;

export const SubjectCategorySection: React.FC<SubjectCategorySectionProps> = ({
  label,
  count,
  isOpen,
  onOpenChange,
  children,
}) => {
  const tone = getPastelTone(label);

  // Concave cut-out on the right edge so the arrow button looks punched out of the tile.
  const notch = `radial-gradient(circle ${NOTCH_RADIUS}px at calc(100% - ${BUTTON_SIZE / 2}px) 50%, transparent 99%, #000 100%)`;

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange} className="mb-6">
      <CollapsibleTrigger
        className={cn(
          'group relative flex w-full text-left',
          'min-h-[110px]',
          'transition-transform duration-300 hover:-translate-y-0.5',
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
              'pointer-events-none absolute -top-2 right-0 w-[60%] text-background',
              'transition-transform duration-500 group-hover:scale-105'
            )}
          />
        </div>

        {/* Content sits above the masked surface */}
        <div className="relative flex w-full min-h-[110px] items-center justify-between px-6 py-5 pr-20">
          <span className="min-w-0">
            <span className={cn('block font-heading text-2xl font-extrabold tracking-tight', tone.text)}>
              {label}
            </span>
            <span className={cn('mt-0.5 block text-sm font-medium opacity-70', tone.text)}>
              {count} subject{count !== 1 ? 's' : ''}
            </span>
          </span>
        </div>

        {/* Arrow button sitting inside the cut-out */}
        <span
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, right: 0, top: '50%' }}
          className={cn(
            'absolute -translate-y-1/2 flex items-center justify-center rounded-full',
            'bg-foreground text-background'
          )}
        >
          <ArrowUpRight className="h-6 w-6" strokeWidth={2.25} />
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="pt-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
