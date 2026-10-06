import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UK_TIMEZONE } from '@/utils/timezone';

const ASSESSMENT_WEEK_START = '2026-10-05';
const ASSESSMENT_WEEK_END = '2026-10-11';

const isAssessmentWeek = () => {
  const londonDate = formatInTimeZone(new Date(), UK_TIMEZONE, 'yyyy-MM-dd');
  return londonDate >= ASSESSMENT_WEEK_START && londonDate <= ASSESSMENT_WEEK_END;
};

export const AssessmentWeekPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(isAssessmentWeek);

  if (!isAssessmentWeek()) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pastel-butter text-pastel-butter-foreground">
              <ClipboardCheck className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Assessment Week: 5th October - 11th October
          </DialogTitle>
          <DialogDescription className="sr-only">
            Important information about Assessment Week
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg border border-pastel-butter-foreground/20 bg-pastel-butter/60 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              Please note that this week is Assessment Week across our lessons. Lessons may look a
              little different than usual, as we’ll be assessing students to better understand their
              current progress and identify the areas where they may need additional support going
              forward.
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={() => setIsOpen(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentWeekPopup;