import React, { useState } from 'react';
import { ClipboardCheck, Info } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UK_TIMEZONE } from '@/utils/timezone';

const ASSESSMENT_WEEK_START = '2026-10-05';
const ASSESSMENT_WEEK_END = '2026-10-11';

const isAssessmentWeek = () => {
  const londonDate = formatInTimeZone(new Date(), UK_TIMEZONE, 'yyyy-MM-dd');
  return londonDate >= ASSESSMENT_WEEK_START && londonDate <= ASSESSMENT_WEEK_END;
};

export const AssessmentWeekBanner: React.FC = () => {
  const [open, setOpen] = useState(false);

  if (!isAssessmentWeek()) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-soft)] bg-foreground px-4 py-3 text-background shadow-[var(--shadow-soft)]"
    >
      <ClipboardCheck className="h-5 w-5 shrink-0" aria-hidden="true" />

      <p className="font-heading text-sm font-bold tracking-tight sm:text-base">
        Assessment Week: 5th October - 11th October
      </p>

      <TooltipProvider delayDuration={100}>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen((o) => !o)}
              className="h-7 w-7 shrink-0 rounded-full text-background hover:bg-background/10 hover:text-background"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">What is Assessment Week?</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="max-w-md rounded-xl p-4 text-sm leading-relaxed shadow-[var(--shadow-soft-lg)]"
          >
            <p>
              Please note that this week is Assessment Week across our lessons. Lessons may look a
              little different than usual, as we’ll be assessing students to better understand their
              current progress and identify the areas where they may need additional support going
              forward.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AssessmentWeekBanner;
