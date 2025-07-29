import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
interface CalendarDisplayProps {
  isLoading: boolean;
  events: any[];
}
const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  isLoading,
  events
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState<{
    date?: string;
    start?: string;
    end?: string;
  }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const handleLessonUpdated = () => {
    setRefreshKey(prev => prev + 1);
    // Force a refresh of the calendar data
    window.location.reload();
  };
  const handleEventClick = (eventInfo: any) => {
    const extendedProps = eventInfo.event.extendedProps;
    
    // Check if this is a demo session
    if (extendedProps.eventType === 'demo_session') {
      // For demo sessions, use the associated lesson ID
      setSelectedLessonId(extendedProps.lessonId);
    } else {
      // For regular lessons, use the event ID
      setSelectedLessonId(eventInfo.event.id);
    }
    
    if (extendedProps.isRecurringInstance) {
      setInstanceDetails({
        date: extendedProps.instanceDate,
        start: eventInfo.event.start,
        end: eventInfo.event.end
      });
    } else {
      setInstanceDetails({});
    }
    setIsLessonDialogOpen(true);
  };
  const renderEventContent = (eventInfo: any) => {
    return <div className="calendar-event-content">
        <p className="event-title">{eventInfo.event.title}</p>
      </div>;
  };
  return <div className="h-full flex flex-col">
      <div className="flex-1 relative calendar-container">
        {isLoading ? <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div> : <FullCalendar key={refreshKey} plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }} initialView="timeGridWeek" events={events} eventContent={renderEventContent} eventClick={handleEventClick} height="100%" slotMinTime="06:00:00" slotMaxTime="22:00:00" allDaySlot={false} nowIndicator={true} eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }} />}
      </div>
      
      {/* Lesson Details Dialog */}
      <LessonDetailsDialog lessonId={selectedLessonId} isOpen={isLessonDialogOpen} onClose={() => setIsLessonDialogOpen(false)} onLessonUpdated={handleLessonUpdated} instanceDate={instanceDetails.date} instanceStart={instanceDetails.start} instanceEnd={instanceDetails.end} />
    </div>;
};
export default CalendarDisplay;