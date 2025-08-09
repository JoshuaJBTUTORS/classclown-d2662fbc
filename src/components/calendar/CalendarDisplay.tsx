
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import { DatesSetArg } from '@fullcalendar/core';

interface CalendarDisplayProps {
  isLoading: boolean;
  events: any[];
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
    
    if (onViewChange) {
      onViewChange({
        start: dateInfo.start,
        end: dateInfo.end,
        view: dateInfo.view.type
      });
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const isCancelled = eventInfo.event.extendedProps.status === 'cancelled' || 
                       eventInfo.event.extendedProps.cancelled_at;

    return (
      <div className="calendar-event-content relative">
        <p className="event-title">{eventInfo.event.title}</p>
        {isCancelled && (
          <div className="cancellation-indicator">
            ✖
          </div>
        )}
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
            events={events}
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
