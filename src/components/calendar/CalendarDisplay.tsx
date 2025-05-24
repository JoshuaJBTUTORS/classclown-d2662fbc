
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
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [homeworkLessonId, setHomeworkLessonId] = useState<string | null>(null);
  const [preloadedLessonData, setPreloadedLessonData] = useState<any>(null);

  const handleEventClick = (info: any) => {
    setSelectedLessonId(info.event.id);
    setIsDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setIsDetailsOpen(false);
    setSelectedLessonId(null);
  };

  const handleAssignHomework = (lessonId: string, lessonData: any) => {
    setHomeworkLessonId(lessonId);
    setPreloadedLessonData(lessonData);
    setIsAssigningHomework(true);
    setIsDetailsOpen(false);
  };

  const handleHomeworkDialogClose = () => {
    setIsAssigningHomework(false);
    setHomeworkLessonId(null);
    setPreloadedLessonData(null);
  };

  // Enhanced event color logic based on lesson properties
  const getEventColor = (event: any) => {
    if (event.extendedProps?.isRecurring || event.extendedProps?.isRecurringInstance) {
      return 'hsl(174 51% 51%)'; // Accent turquoise for recurring lessons
    }
    if (event.extendedProps?.isGroup) {
      return 'hsl(45 93% 59%)'; // Secondary yellow for group lessons
    }
    return 'hsl(342 77% 60%)'; // Primary pink for regular lessons
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
              dayMaxEvents={false}
              eventClassNames={(info) => {
                let classes = ['custom-calendar-event'];
                
                if (info.event.extendedProps.isRecurring || info.event.extendedProps.isRecurringInstance) {
                  classes.push('recurring-event');
                }
                if (info.event.extendedProps.isGroup) {
                  classes.push('group-event');
                }
                
                return classes;
              }}
              eventContent={(eventInfo) => {
                const isMonthView = eventInfo.view.type === 'dayGridMonth';
                const isWeekView = eventInfo.view.type === 'timeGridWeek';
                const isDayView = eventInfo.view.type === 'timeGridDay';
                const isRecurring = eventInfo.event.extendedProps.isRecurring || 
                                  eventInfo.event.extendedProps.isRecurringInstance;
                
                return (
                  <div className="fc-event-main-frame p-1">
                    <div className="fc-event-title-container flex items-center gap-1">
                      <div className="fc-event-title text-xs font-medium truncate">
                        {/* Show lesson name in week and day view instead of time */}
                        {(isWeekView || isDayView) && (
                          <span className="event-title font-semibold">{eventInfo.event.title}</span>
                        )}
                        {/* Show both time and title in month view */}
                        {isMonthView && (
                          <>
                            <span className="fc-event-time text-xs opacity-90 mr-1">
                              {eventInfo.timeText}
                            </span>
                            <span className="event-title">{eventInfo.event.title}</span>
                          </>
                        )}
                        {isRecurring && (
                          <span className="inline-flex items-center justify-center ml-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
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
                    {eventInfo.event.extendedProps.tutor && (isWeekView || isDayView) && (
                      <div className="fc-event-tutor text-xs opacity-75 truncate mt-1">
                        {eventInfo.event.extendedProps.tutor.first_name} {eventInfo.event.extendedProps.tutor.last_name}
                      </div>
                    )}
                    {/* Show time below title in week/day view */}
                    {(isWeekView || isDayView) && eventInfo.timeText && (
                      <div className="fc-event-time text-xs opacity-75 mt-1">
                        {eventInfo.timeText}
                      </div>
                    )}
                  </div>
                );
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short'
              }}
              eventDidMount={(info) => {
                const color = getEventColor(info.event);
                info.el.style.backgroundColor = color;
                info.el.style.borderColor = color;
                info.el.style.color = 'white';
              }}
            />
          </div>
        )}

        <LessonDetailsDialog
          isOpen={isDetailsOpen}
          onClose={handleDetailsClose}
          lessonId={selectedLessonId}
          onAssignHomework={handleAssignHomework}
        />

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
