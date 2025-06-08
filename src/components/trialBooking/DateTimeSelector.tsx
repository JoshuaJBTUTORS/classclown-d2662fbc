
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

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
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  slots,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  isLoading
}) => {
  const availableSlots = slots.filter(slot => slot.available);

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="preferredDate">Preferred Date *</Label>
          <Input
            id="preferredDate"
            type="date"
            value={selectedDate || ''}
            onChange={(e) => onDateSelect(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-2"
          />
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
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Please select a date to see available times</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No availability</h3>
              <p className="text-gray-500">
                No tutors are available on {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
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
