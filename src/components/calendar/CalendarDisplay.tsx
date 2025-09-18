
import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import { DatesSetArg } from '@fullcalendar/core';
import { useTutorAvailability } from '@/hooks/useTutorAvailability';
import { format, startOfDay, endOfDay, addHours, parseISO, eachDayOfInterval } from 'date-fns';

interface CalendarDisplayProps {
  isLoading: boolean;
  events?: any[];
  onLessonsUpdated: () => void;
  onViewChange?: (viewInfo: { start: Date; end: Date; view: string }) => void;
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  isLoading,
  events,
  onLessonsUpdated,
  onViewChange
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [instanceDetails, setInstanceDetails] = useState<{
    date?: string;
    start?: string;
    end?: string;
  }>({});
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });

  // Extract unique tutor IDs from events
  const tutorIds = useMemo(() => {
    const ids = new Set<string>();
    (events || []).forEach(event => {
      if (event.extendedProps?.tutor?.id) {
        ids.add(event.extendedProps.tutor.id);
      }
    });
    return Array.from(ids);
  }, [events]);

  // Fetch availability data for tutors in current view
  const { availabilityData } = useTutorAvailability({
    tutorIds,
    dateRange: currentDateRange,
    viewType: 'teacherDay' // Use day view logic for more granular availability
  });

  // Generate background events for availability
  const backgroundEvents = useMemo(() => {
    const availEvents: any[] = [];
    
    Object.entries(availabilityData).forEach(([tutorId, slots]) => {
      Object.entries(slots).forEach(([slotKey, isAvailable]) => {
        if (isAvailable) {
          // Parse slot key to get date and hour
          const [dateStr, hourStr] = slotKey.split('-');
          const hour = parseInt(hourStr);
          
          if (!isNaN(hour)) {
            const startTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
            const endTime = new Date(startTime);
            endTime.setHours(hour + 1);

            availEvents.push({
              id: `availability-${tutorId}-${slotKey}`,
              start: startTime,
              end: endTime,
              display: 'background',
              backgroundColor: '#dcfce7', // green-100
              borderColor: '#bbf7d0', // green-200
              extendedProps: {
                type: 'availability',
                tutorId: tutorId
              }
            });
          }
        }
      });
    });
    
    return availEvents;
  }, [availabilityData]);

  // Combine lesson events with availability background events
  const allEvents = useMemo(() => {
    return [...(events || []), ...backgroundEvents];
  }, [events, backgroundEvents]);

  const handleEventClick = (eventInfo: any) => {
    const extendedProps = eventInfo.event.extendedProps;
    
    // For regular lessons, use the event ID
    setSelectedLessonId(eventInfo.event.id);
    
    if (extendedProps.isRecurringInstance) {
      setInstanceDetails({
        date: extendedProps.instanceDate,
        start: eventInfo.event.start?.toISOString(),
        end: eventInfo.event.end?.toISOString()
      });
    } else {
      setInstanceDetails({});
    }
  };

  const handleCloseDialog = () => {
    setSelectedLessonId(null);
  };

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    console.log('📅 Calendar view changed:', {
      viewType: dateInfo.view.type,
      start: dateInfo.start,
      end: dateInfo.end
    });
    
    // Update current date range for availability fetching
    setCurrentDateRange({
      start: startOfDay(dateInfo.start),
      end: endOfDay(dateInfo.end)
    });
    
    if (onViewChange) {
      onViewChange({
        start: dateInfo.start,
        end: dateInfo.end,
        view: dateInfo.view.type
      });
    }
  };

  const renderEventContent = (eventInfo: any) => {
    return (
      <div className="calendar-event-content">
        <p className="event-title">{eventInfo.event.title}</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative calendar-container">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="timeGridWeek"
            events={allEvents}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="100%"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        )}
      </div>
      
      <LessonDetailsDialog 
        lessonId={selectedLessonId} 
        isOpen={!!selectedLessonId}
        onClose={handleCloseDialog}
        onLessonUpdated={onLessonsUpdated}
        instanceDate={instanceDetails.date} 
        instanceStart={instanceDetails.start} 
        instanceEnd={instanceDetails.end} 
      />
    </div>
  );
};

export default CalendarDisplay;
