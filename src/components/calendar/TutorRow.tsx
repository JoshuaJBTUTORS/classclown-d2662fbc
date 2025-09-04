import React from 'react';
import { format, isSameDay, parseISO, isSameHour } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users } from 'lucide-react';
import { useTutorSlotAvailability, SlotAvailability } from '@/hooks/useTutorSlotAvailability';

interface TutorRowProps {
  tutor: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  events: any[];
  timeSlots: Array<{
    time: string;
    date: Date;
    key: string;
  }>;
  viewType: 'teacherWeek' | 'teacherDay';
  onEventClick?: (event: any) => void;
}

const TutorRow: React.FC<TutorRowProps> = ({
  tutor,
  events,
  timeSlots,
  viewType,
  onEventClick
}) => {
  // Get availability data for this tutor
  const { availability, isLoading: availabilityLoading } = useTutorSlotAvailability(
    [tutor],
    timeSlots,
    viewType
  );
  // Find events for each time slot
  const getEventsForSlot = (slot: { time: string; date: Date; key: string }) => {
    return events.filter(event => {
      const eventStart = parseISO(event.start);
      
      if (viewType === 'teacherDay') {
        // For day view, match by hour
        const slotHour = parseInt(slot.time.split(':')[0]);
        return isSameDay(eventStart, slot.date) && 
               isSameHour(eventStart, new Date(slot.date.getFullYear(), slot.date.getMonth(), slot.date.getDate(), slotHour));
      } else {
        // For week view, match by day
        return isSameDay(eventStart, slot.date);
      }
    });
  };

  const renderEventBlock = (event: any) => {
    const students = event.extendedProps?.students || [];
    const studentNames = students.map((s: any) => s.name).join(', ');
    const subject = event.extendedProps?.subject || '';
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    
    return (
      <Button
        key={event.id}
        variant="outline"
        size="sm"
        className="w-full mb-1 p-2 h-auto text-left justify-start hover:bg-accent/50 transition-colors"
        onClick={() => onEventClick?.(event)}
      >
        <div className="flex flex-col w-full min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium truncate">
              {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
            </span>
          </div>
          
          {subject && (
            <Badge variant="secondary" className="mb-1 text-xs w-fit">
              {subject}
            </Badge>
          )}
          
          {students.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {studentNames}
              </span>
            </div>
          )}
        </div>
      </Button>
    );
  };

  const getAvailabilityTooltip = (availabilityStatus: SlotAvailability) => {
    switch (availabilityStatus) {
      case 'available':
        return 'Available for booking';
      case 'unavailable':
        return 'Not available (outside schedule or time off)';
      case 'booked':
        return 'Has existing lesson';
      default:
        return '';
    }
  };

  return (
    <div className="flex border-b hover:bg-muted/30 transition-colors">
      {/* Tutor info column */}
      <div className="w-48 flex-shrink-0 p-3 border-r bg-background">
        <div className="flex flex-col">
          <h4 className="font-medium text-sm truncate">
            {tutor.first_name} {tutor.last_name}
          </h4>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {tutor.email}
          </p>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-max">
          {timeSlots.map(slot => {
            const slotEvents = getEventsForSlot(slot);
            
            return (
              <div
                key={slot.key}
                className="flex-1 min-w-32 p-2 border-r last:border-r-0 min-h-20"
              >
                {slotEvents.length === 0 ? (
                  <AvailabilitySlot
                    slotKey={slot.key}
                    tutorId={tutor.id}
                    availability={availability}
                    isLoading={availabilityLoading}
                  />
                ) : (
                  <div className="space-y-1">
                    {slotEvents.map(renderEventBlock)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Component for rendering availability slots
const AvailabilitySlot: React.FC<{
  slotKey: string;
  tutorId: string;
  availability: { [tutorId: string]: { [slotKey: string]: SlotAvailability } };
  isLoading: boolean;
}> = ({ slotKey, tutorId, availability, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const availabilityStatus = availability[tutorId]?.[slotKey] || 'unavailable';
  
  const getSlotClass = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'slot-available h-full flex items-center justify-center';
      case 'unavailable':
        return 'slot-unavailable h-full flex items-center justify-center';
      default:
        return 'h-full flex items-center justify-center bg-muted/30';
    }
  };

  const getTooltip = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'Available for booking';
      case 'unavailable':
        return 'Not available (outside schedule or time off)';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div 
      className={getSlotClass()}
      title={getTooltip()}
    >
      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {availabilityStatus === 'available' ? '✓' : '✗'}
      </span>
    </div>
  );
};

export default TutorRow;