import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatPeriodDisplay, getNextPaymentDate, isPeriodInFuture } from '@/utils/earningsPeriodUtils';
import { format, addDays } from 'date-fns';

interface EarningsPeriodSelectorProps {
  periodStart: Date;
  periodEnd: Date;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  isCurrentPeriod: boolean;
}

export const EarningsPeriodSelector = ({
  periodStart,
  periodEnd,
  onPreviousPeriod,
  onNextPeriod,
  isCurrentPeriod
}: EarningsPeriodSelectorProps) => {
  const paymentDate = getNextPaymentDate(periodEnd);
  const nextPeriodStart = addDays(periodEnd, 1);
  const isFuture = isPeriodInFuture(nextPeriodStart);

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPeriod}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium mb-1">
          <Calendar className="h-4 w-4" />
          Payment Period
        </div>
        <div className="text-lg font-semibold">
          {formatPeriodDisplay(periodStart, periodEnd)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Payment Date: {format(paymentDate, 'MMM d, yyyy')}
        </div>
        {isCurrentPeriod && (
          <div className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
            Current Period
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextPeriod}
        disabled={isFuture}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
