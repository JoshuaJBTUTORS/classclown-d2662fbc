import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNextAvailableDates } from '@/hooks/useNextAvailableDates';

interface AggregatedTimeSlot {
  time: string; // Display time (15 minutes earlier)
  datetime: Date; // Display datetime (15 minutes earlier)
  lessonTime: string; // Actual lesson time
  lessonDatetime: Date; // Actual lesson datetime
  available: boolean;
  tutorCount: number;
  availableTutorIds: string[];
}

interface DateTimeSelectorProps {
  slots: AggregatedTimeSlot[];
  selectedDate?: string;
  selectedTime?: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
  isLoading?: boolean;
  subjectId?: string;
}

const SectionHeading: React.FC<{ icon: React.ReactNode; tone: string; title: string; suffix?: React.ReactNode }> = ({
  icon,
  tone,
  title,
  suffix
}) => (
  <div className="flex flex-wrap items-center gap-3 mb-4">
    <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-foreground/80', tone)}>
      {icon}
    </span>
    <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
    {suffix}
  </div>
);

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  slots,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  isLoading,
  subjectId
}) => {
  const availableSlots = slots?.filter(slot => slot.available) || [];
  const { nextAvailableDates, isLoading: loadingNextDates } = useNextAvailableDates(
    subjectId,
    selectedDate
  );

  // Calculate date restrictions
  const today = startOfDay(new Date());
  const minDate = addDays(today, 1); // Tomorrow (no same-day booking)
  const maxDate = addDays(today, 7); // 7 days from today

  const selectedDateObj = selectedDate ? new Date(selectedDate) : undefined;

  // Helper function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const normalizedDate = startOfDay(date);
    return isBefore(normalizedDate, minDate) || isAfter(normalizedDate, maxDate);
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      onDateSelect(dateString);
      // Reset time selection when date changes
      onTimeSelect('');
    }
  };

  if (!subjectId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-muted/30 text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
          <p className="text-muted-foreground">Please select a subject first to see available times</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Date Selection */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <SectionHeading
          icon={<CalendarIcon className="h-5 w-5 text-foreground" />}
          tone="bg-pastel-lilac"
          title="Select Date"
        />
        <Label htmlFor="dateSelector" className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground">
          Preferred Date *
        </Label>
        <div className="mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-full border-2 border-foreground/70 bg-transparent hover:bg-muted h-11',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-2 border-foreground/80" align="start">
              <Calendar
                mode="single"
                selected={selectedDateObj}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Booking restrictions info */}
        <div className="mt-4 rounded-2xl border-2 border-foreground/80 bg-pastel-sky p-4">
          <p className="text-sm text-foreground">
            <strong>Booking Window:</strong> You can book lessons from tomorrow up to 7 days in advance.
          </p>
          <p className="text-xs text-foreground/70 mt-1">
            Available dates: {format(minDate, 'MMM d')} - {format(maxDate, 'MMM d')}
          </p>
        </div>
      </div>

      {/* Time Selection */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <SectionHeading
          icon={<Clock className="h-5 w-5 text-foreground" />}
          tone="bg-pastel-butter"
          title="Available Times"
          suffix={
            selectedDate ? (
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {format(new Date(selectedDate), 'EEEE, MMM d')}
              </span>
            ) : undefined
          }
        />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-11 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
        ) : !selectedDate ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-border bg-muted/20">
            <CalendarIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <p className="text-muted-foreground">Please select a date to see available times</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-6 rounded-2xl border border-dashed border-border bg-muted/20">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">No availability</h3>
              <p className="text-sm text-muted-foreground">
                No tutors are available on {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            {/* Next Available Dates Suggestions */}
            {loadingNextDates ? (
              <div className="border-t border-border pt-4">
                <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-3">Finding next available dates...</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : nextAvailableDates.length > 0 ? (
              <div className="border-t border-border pt-4">
                <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-3">
                  Try these available dates instead
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {nextAvailableDates.map((availableDate) => (
                    <button
                      key={availableDate.date}
                      type="button"
                      className="rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-foreground/70 hover:-translate-y-0.5"
                      onClick={() => onDateSelect(availableDate.date)}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-foreground truncate">{availableDate.dayName}</p>
                          <p className="text-sm text-muted-foreground truncate">{availableDate.formattedDate}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-t border-border pt-4">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    No availability found in the next 7 days.
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Please try selecting a different subject or contact us for assistance.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => onTimeSelect(slot.time)}
                  className={cn(
                    'rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all',
                    isSelected
                      ? 'border-foreground bg-foreground text-background shadow-[0_3px_0_0_hsl(var(--foreground)/0.25)]'
                      : 'border-border bg-card text-foreground hover:border-foreground/70 hover:-translate-y-0.5'
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
        )}

        {availableSlots.length > 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">How it works:</strong> We'll automatically match you with the best available tutor
              for your selected time slot based on expertise and availability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeSelector;
