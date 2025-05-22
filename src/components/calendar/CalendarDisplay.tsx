
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import LessonDetailsDialog from './LessonDetailsDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';

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
  // State for homework dialog
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [homeworkLessonId, setHomeworkLessonId] = useState<string | null>(null);
  const [preloadedLessonData, setPreloadedLessonData] = useState<any>(null);

  const handleEventClick = (info: any) => {
    // Don't open detail dialog for time-off events
    if (info.event.extendedProps.isTimeOff) {
      return;
    }
    
    setSelectedLessonId(info.event.id);
    setIsDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedLessonId(null);
  };

  // Handler for opening homework assignment dialog
  const handleAssignHomework = (lessonId: string, lessonData: any) => {
    setHomeworkLessonId(lessonId);
    setPreloadedLessonData(lessonData);
    setIsAssigningHomework(true);
    // Close details dialog
    setIsDetailsOpen(false);
  };

  // Handler for closing homework dialog
  const handleHomeworkDialogClose = () => {
    setIsAssigningHomework(false);
    setHomeworkLessonId(null);
    setPreloadedLessonData(null);
  };

  return (
    <Card className="border border-border/30 shadow-sm overflow-hidden rounded-xl">
      <CardContent className="pt-6 px-4 md:px-6">
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"></div>
            <p className="ml-2 text-muted-foreground">Loading calendar...</p>
          </div>
        ) : (
          <div className="h-[600px] calendar-container">
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
                let classes = ['calendar-event', 'rounded-md', 'border-l-4', 'shadow-sm', 'transition-all', 'hover:shadow-md'];
                
                // Add special styling for recurring events
                if (info.event.extendedProps.isRecurring) {
                  classes.push('recurring-event');
                }
                if (info.event.extendedProps.isRecurringInstance) {
                  classes.push('recurring-instance');
                }
                // Add special styling for time-off events
                if (info.event.extendedProps.isTimeOff) {
                  classes.push('time-off-event');
                }
                return classes;
              }}
              eventContent={(eventInfo) => {
                // For time-off events, display differently
                if (eventInfo.event.extendedProps.isTimeOff) {
                  return (
                    <div className="fc-event-main-frame p-1 text-red-800 bg-red-100 bg-opacity-70 rounded border-red-300 border">
                      <div className="fc-event-title-container flex items-center gap-1">
                        <div className="fc-event-title text-sm font-medium">
                          {eventInfo.event.title}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // For regular events
                return (
                  <div className="fc-event-main-frame p-1">
                    <div className="fc-event-title-container flex items-center gap-1">
                      <div className="fc-event-title text-sm font-medium">
                        {eventInfo.event.title}
                        {(eventInfo.event.extendedProps.isRecurring || 
                          eventInfo.event.extendedProps.isRecurringInstance) && (
                          <span className="inline-flex items-center justify-center ml-1 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                              <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9"></path>
                              <path d="M3 12h.01M21 12h.01M12 21v.01"></path>
                              <path d="m9 3 3 3 3-3M3 9l3 3-3 3"></path>
                              <path d="M21 9-3 3 3 3"></path>
                              <path d="M9 21l3-3 3 3"></path>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }}
              dayMaxEvents={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short'
              }}
            />
          </div>
        )}

        {/* Lesson Details Dialog with onAssignHomework prop */}
        <LessonDetailsDialog
          isOpen={isDetailsOpen}
          onClose={handleDetailsClose}
          lessonId={selectedLessonId}
          onAssignHomework={handleAssignHomework}
        />

        {/* AssignHomeworkDialog */}
        <AssignHomeworkDialog
          isOpen={isAssigningHomework}
          onClose={handleHomeworkDialogClose}
          preSelectedLessonId={homeworkLessonId}
          preloadedLessonData={preloadedLessonData}
        />
      </CardContent>
    </Card>
  );
};

export default CalendarDisplay;
