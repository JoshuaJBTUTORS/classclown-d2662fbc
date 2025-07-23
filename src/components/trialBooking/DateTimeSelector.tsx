import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, Calendar as CalendarIcon, Users, ArrowRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNextAvailableDates } from '@/hooks/useNextAvailableDates';

interface AggregatedTimeSlot {
  time: string;
  datetime: Date;
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

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  slots,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  isLoading,
  subjectId
}) => {
  const availableSlots = slots.filter(slot => slot.available);
  const { nextAvailableDates, isLoading: loadingNextDates } = useNextAvailableDates(
    subjectId, 
    selectedDate
  );
  
  // Calculate date restrictions
  const today = new Date();
  const minDate = addDays(today, 1); // Tomorrow (no same-day booking)
  const maxDate = addDays(today, 7); // 7 days from today
  
  const selectedDateObj = selectedDate ? new Date(selectedDate) : undefined;
  
  // Helper function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDate) || isAfter(date, maxDate);
  };
  
  // Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      onDateSelect(dateString);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="dateSelector">Preferred Date *</Label>
          <div className="mt-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
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
              <PopoverContent className="w-auto p-0" align="start">
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
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Booking Window:</strong> You can book lessons from tomorrow up to 7 days in advance.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Available dates: {format(minDate, 'MMM d')} - {format(maxDate, 'MMM d')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
            {selectedDate && (
              <span className="text-sm font-normal text-gray-600">
                for {format(new Date(selectedDate), 'EEEE, MMM d')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : !selectedDate ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Please select a date to see available times</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No availability</h3>
                <p className="text-gray-500 mb-4">
                  No tutors are available on {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {/* Next Available Dates Suggestions */}
              {loadingNextDates ? (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Finding next available dates...</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ) : nextAvailableDates.length > 0 ? (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Try these available dates instead:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {nextAvailableDates.map((availableDate) => (
                      <Button
                        key={availableDate.date}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start hover:border-[#e94b7f] hover:bg-[#e94b7f]/5 transition-colors"
                        onClick={() => onDateSelect(availableDate.date)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{availableDate.dayName}</p>
                            <p className="text-sm text-gray-500">{availableDate.formattedDate}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>{availableDate.tutorCount} tutor{availableDate.tutorCount !== 1 ? 's' : ''}</span>
                          <span className="text-gray-400">•</span>
                          <span>{availableDate.availableSlots} slot{availableDate.availableSlots !== 1 ? 's' : ''}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-2">
                      No availability found in the next 7 days.
                    </p>
                    <p className="text-xs text-gray-500">
                      Please try selecting a different subject or contact us for assistance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimeSelect(slot.time)}
                  className={`flex flex-col items-center p-3 h-auto ${
                    selectedTime === slot.time 
                      ? "bg-[#e94b7f] hover:bg-[#d63d6f] text-white" 
                      : "hover:border-[#e94b7f] hover:text-[#e94b7f]"
                  }`}
                >
                  <span className="font-medium">{slot.time}</span>
                  <span className="text-xs flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {slot.tutorCount} tutor{slot.tutorCount !== 1 ? 's' : ''}
                  </span>
                </Button>
              ))}
            </div>
          )}
          
          {availableSlots.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> We'll automatically match you with the best available tutor 
                for your selected time slot based on expertise and availability.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimeSelector;
