import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, X } from 'lucide-react';
import { DoodleCalendar } from '@/components/calendar/LessonDoodles';
import { getMonthlyEarningsPeriod } from '@/utils/earningsPeriodUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EarningsDateFilterProps {
  dateRange: { from: Date | null; to: Date | null };
  onDateRangeChange: (dateRange: { from: Date | null; to: Date | null }) => void;
  nextPaymentDate?: Date | null;
  periodDisplay?: string;
}

export const EarningsDateFilter = ({
  dateRange,
  onDateRangeChange,
  nextPaymentDate,
  periodDisplay
}: EarningsDateFilterProps) => {
  const [fromPopoverOpen, setFromPopoverOpen] = useState(false);
  const [toPopoverOpen, setToPopoverOpen] = useState(false);

  const handleClear = () => {
    onDateRangeChange({ from: null, to: null });
  };

  const handleFromSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({ from: date, to: dateRange.to });
      setFromPopoverOpen(false);
    }
  };

  const handleToSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({ from: dateRange.from, to: date });
      setToPopoverOpen(false);
    }
  };

  const triggerClass =
    'h-11 w-full justify-start rounded-full border-2 border-foreground/10 bg-card px-4 text-left font-normal hover:bg-card hover:text-foreground';

  const suggestedPeriod = getMonthlyEarningsPeriod(new Date());

  const isSameDay = (a: Date | null, b: Date) =>
    !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const isSuggestionActive = (period: { start: Date; end: Date }) =>
    isSameDay(dateRange.from, period.start) && isSameDay(dateRange.to, period.end);

  return (
    <section className="animate-fade-in rounded-[var(--radius-soft)] bg-pastel-sky/40 p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="mb-4 flex items-center gap-3 px-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/70 bg-card text-foreground">
          <DoodleCalendar className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            Date Range Filter
          </h2>
          <p className="text-xs text-muted-foreground">Select your custom earnings period</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onDateRangeChange({ from: suggestedPeriod.start, to: suggestedPeriod.end })}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-full border-2 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
              isSuggestionActive(suggestedPeriod)
                ? 'border-foreground bg-foreground text-background'
                : 'border-foreground/15 bg-card text-foreground hover:border-foreground/40 hover:bg-foreground/[0.03]'
            )}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                  isSuggestionActive(suggestedPeriod) ? 'border-background/40 text-background' : 'border-foreground/15 text-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </span>
              <span className="flex flex-col">
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    isSuggestionActive(suggestedPeriod) ? 'text-background/80' : 'text-muted-foreground'
                  )}
                >
                  Suggested Pay Period
                </span>
                <span className="text-sm font-bold">
                  {format(suggestedPeriod.start, 'd MMM')} – {format(suggestedPeriod.end, 'd MMM')}
                </span>
              </span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-bold',
                isSuggestionActive(suggestedPeriod)
                  ? 'bg-background text-foreground'
                  : 'bg-foreground text-background'
              )}
            >
              {isSuggestionActive(suggestedPeriod) ? 'Active' : 'Apply'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="from-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              From Date
            </Label>
            <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="from-date"
                  variant="outline"
                  className={cn(triggerClass, !dateRange.from && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto rounded-[1.25rem] border-2 border-foreground/10 bg-card p-0 shadow-[var(--shadow-soft)]"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dateRange.from || undefined}
                  onSelect={handleFromSelect}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => {
                    if (dateRange.to) {
                      return date > dateRange.to;
                    }
                    return date > new Date();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="to-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              To Date
            </Label>
            <Popover open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="to-date"
                  variant="outline"
                  className={cn(triggerClass, !dateRange.to && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick an end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto rounded-[1.25rem] border-2 border-foreground/10 bg-card p-0 shadow-[var(--shadow-soft)]"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={dateRange.to || undefined}
                  onSelect={handleToSelect}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => {
                    if (dateRange.from) {
                      return date < dateRange.from;
                    }
                    return date > new Date();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {(dateRange.from || dateRange.to) && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 rounded-full border border-foreground/15 px-3 text-xs hover:bg-card"
            >
              <X className="mr-1 h-3 w-3" />
              Clear Filter
            </Button>
          </div>
        )}

        {periodDisplay && (
          <div className="space-y-1 rounded-[1.25rem] bg-card/80 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Period:</span>
              <span className="font-semibold text-foreground">{periodDisplay}</span>
            </div>
            {nextPaymentDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Payment Date:</span>
                <span className="font-semibold text-foreground">
                  {format(nextPaymentDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
