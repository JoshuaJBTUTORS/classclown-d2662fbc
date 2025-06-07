
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSlot {
  time: string;
  datetime: Date;
  available: boolean;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot?: string;
  onSlotSelect: (time: string) => void;
  selectedDate?: string;
  isLoading?: boolean;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
  selectedDate,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableSlots = slots.filter(slot => slot.available);
  const unavailableSlots = slots.filter(slot => !slot.available);

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No availability</h3>
            <p className="text-gray-500">
              {selectedDate 
                ? `No time slots available for ${format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}`
                : 'Please select a date to see available times'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {availableSlots.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedSlot === slot.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSlotSelect(slot.time)}
                  className={`text-sm ${
                    selectedSlot === slot.time 
                      ? "bg-[#e94b7f] hover:bg-[#d63d6f] text-white" 
                      : "hover:border-[#e94b7f] hover:text-[#e94b7f]"
                  }`}
                >
                  {slot.time}
                </Button>
              ))}
            </div>
            
            {unavailableSlots.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Unavailable times:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {unavailableSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-sm text-gray-400 border-gray-200"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">All time slots are booked for this date.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimeSlotSelector;
