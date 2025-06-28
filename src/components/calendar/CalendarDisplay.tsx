
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/lesson';
import LessonDetailsDialog from './LessonDetailsDialog';
import { toast } from 'sonner';

interface CalendarDisplayProps {
  events: CalendarEvent[];
  onDateSelect?: (selectInfo: any) => void;
  onEventClick?: (clickInfo: any) => void;
  viewMode: 'month' | 'week' | 'day';
  onRefresh: () => void;
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  events,
  onDateSelect,
  onEventClick,
  viewMode,
  onRefresh
}) => {
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  const processedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    extendedProps: event,
    backgroundColor: event.status === 'completed' ? '#a3e635' : (event.is_recurring ? '#a855f7' : '#3b82f6'),
    borderColor: event.status === 'completed' ? '#84cc16' : (event.is_recurring ? '#9333ea' : '#2563eb'),
    textColor: '#ffffff',
  }));

  const handleDateSelect = (selectInfo: any) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const lessonData = clickInfo.event.extendedProps;
    setSelectedLesson(lessonData);
    setIsDialogOpen(true);
    
    if (onEventClick) {
      onEventClick(clickInfo);
    }
  };

  const handleLessonUpdated = () => {
    setIsDialogOpen(false);
    onRefresh();
    toast.success('Lesson updated successfully');
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView={
            viewMode === 'month' ? 'dayGridMonth' :
            viewMode === 'week' ? 'timeGridWeek' : 'timeGridDay'
          }
          events={processedEvents}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={onDateSelect}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          eventBackgroundColor="#3b82f6"
          eventBorderColor="#2563eb"
          eventTextColor="#ffffff"
          nowIndicator={true}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          expandRows={true}
        />
      </div>

      <LessonDetailsDialog
        lesson={selectedLesson}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onLessonUpdated={handleLessonUpdated}
      />
    </>
  );
};

export default CalendarDisplay;
