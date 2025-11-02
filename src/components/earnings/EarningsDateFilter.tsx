import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, X } from 'lucide-react';
import { format, addMonths } from 'date-fns';
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

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Date Range Filter
        </CardTitle>
        <CardDescription>
          Select your custom earnings period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-date">From Date</Label>
            <Popover open={fromPopoverOpen} onOpenChange={setFromPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="from-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP") : "Pick a start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from || undefined}
                  onSelect={handleFromSelect}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => {
                    // Disable dates after 'to' date if set
                    if (dateRange.to) {
                      return date > dateRange.to;
                    }
                    // Disable future dates
                    return date > new Date();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-date">To Date</Label>
            <Popover open={toPopoverOpen} onOpenChange={setToPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="to-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP") : "Pick an end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to || undefined}
                  onSelect={handleToSelect}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => {
                    // Disable dates before 'from' date if set
                    if (dateRange.from) {
                      return date < dateRange.from;
                    }
                    // Disable future dates
                    return date > new Date();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {(dateRange.from || dateRange.to) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear Filter
            </Button>
          </div>
        )}

        {periodDisplay && (
          <div className="pt-2 space-y-1 text-sm border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Period:</span>
              <span className="font-medium">{periodDisplay}</span>
            </div>
            {nextPaymentDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Payment Date:</span>
                <span className="font-medium text-primary">
                  {format(nextPaymentDate, 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
