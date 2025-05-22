
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import LessonDetailsDialog from './LessonDetailsDialog';

interface CalendarDisplayProps {
  isLoading: boolean;
  events: any[];
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  isLoading,
  events
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleEventClick = (info: any) => {
    setSelectedLessonId(info.event.id);
    setIsDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedLessonId(null);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"></div>
            <p className="ml-2">Loading calendar...</p>
          </div>
        ) : (
          <div className="h-[600px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              height="100%"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              eventClick={handleEventClick}
              eventClassNames={(info) => {
                // Add special styling for recurring events
                if (info.event.extendedProps.isRecurring) {
                  return ['recurring-event'];
                }
                if (info.event.extendedProps.isRecurringInstance) {
                  return ['recurring-instance'];
                }
                return [];
              }}
              eventContent={(eventInfo) => {
                return (
                  <div className="fc-event-main-frame">
                    <div className="fc-event-title-container">
                      <div className="fc-event-title">
                        {eventInfo.event.title}
                        {(eventInfo.event.extendedProps.isRecurring || 
                          eventInfo.event.extendedProps.isRecurringInstance) && (
                          <span className="ml-1">🔄</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Lesson Details Dialog */}
        <LessonDetailsDialog
          isOpen={isDetailsOpen}
          onClose={handleDetailsClose}
          lessonId={selectedLessonId}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarDisplay;
