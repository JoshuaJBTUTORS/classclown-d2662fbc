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

  // Simplified event color logic - use primary pink for all lessons
  const getEventColor = (event: any) => {
    return 'hsl(342 77% 60%)'; // Primary pink for all lessons
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
                const subject = eventInfo.event.extendedProps.subject;
                
                return (
                  <div className="fc-event-main-frame p-1">
                    <div className="fc-event-title-container flex items-center gap-1">
                      <div className="fc-event-title text-xs font-medium truncate">
                        {(isWeekView || isDayView) && (
                          <>
                            <span className="event-title font-semibold">{eventInfo.event.title}</span>
                            {subject && (
                              <div className="text-xs opacity-75 truncate mt-1">
                                {subject}
                              </div>
                            )}
                          </>
                        )}
                        {isMonthView && (
                          <>
                            <span className="fc-event-time text-xs opacity-90 mr-1">
                              {eventInfo.timeText}
                            </span>
                            <span className="event-title">{eventInfo.event.title}</span>
                            {subject && (
                              <div className="text-xs opacity-75 truncate">
                                {subject}
                              </div>
                            )}
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
                    
                    {/* Show tutor info for admin/owner views */}
                    {eventInfo.event.extendedProps.tutor && (isWeekView || isDayView) && (
                      <div className="fc-event-tutor text-xs opacity-75 truncate mt-1">
                        {eventInfo.event.extendedProps.tutor.first_name} {eventInfo.event.extendedProps.tutor.last_name}
                      </div>
                    )}
                    
                    {/* Show student count for group lessons */}
                    {eventInfo.event.extendedProps.students && eventInfo.event.extendedProps.students.length > 1 && (isWeekView || isDayView) && (
                      <div className="fc-event-students text-xs opacity-75 truncate">
                        {eventInfo.event.extendedProps.students.length} students
                      </div>
                    )}
                    
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
