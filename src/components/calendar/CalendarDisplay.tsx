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

  // Enhanced event color logic with completion status
  const getEventColor = (event: any) => {
    // Check completion status
    if (event.extendedProps.attendance_completed) {
      return 'hsl(142 76% 36%)'; // Green for fully completed
    } else if (event.extendedProps.homework_assigned || event.extendedProps.status === 'completed') {
      return 'hsl(45 93% 47%)'; // Yellow for homework assigned but attendance pending
    } else {
      return 'hsl(342 77% 60%)'; // Primary pink for scheduled
    }
  };

  // Helper function to get completion indicator
  const getCompletionIndicator = (event: any, view: string) => {
    if (event.extendedProps.attendance_completed) {
      return '✓'; // Green checkmark for fully completed
    } else if (event.extendedProps.homework_assigned || event.extendedProps.status === 'completed') {
      return '●'; // Yellow dot for homework assigned
    } else {
      return ''; // No indicator for scheduled
    }
  };

  // Helper function to truncate text intelligently
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    const words = text.split(' ');
    if (words.length === 1) {
      return text.substring(0, maxLength - 1) + '…';
    }
    let result = '';
    for (const word of words) {
      if ((result + word).length > maxLength - 1) break;
      result += (result ? ' ' : '') + word;
    }
    return result + '…';
  };

  // Helper function to abbreviate subject names
  const abbreviateSubject = (subject: string) => {
    if (!subject) return '';
    const abbreviations = {
      '11 Plus Maths': '11+ Math',
      '11 Plus English': '11+ Eng',
      '11 Plus VR': '11+ VR',
      '11 Plus NVR': '11+ NVR',
      'Early KS2 Maths': 'KS2 Math',
      'Early KS2 English': 'KS2 Eng',
      'KS2 Maths': 'KS2 Math',
      'KS2 English': 'KS2 Eng',
      'Sats Maths': 'SATs Math',
      'Sats English': 'SATs Eng',
      'KS3 Maths': 'KS3 Math',
      'KS3 English': 'KS3 Eng',
      'KS3 Science': 'KS3 Sci',
      'GCSE Maths': 'GCSE Math',
      'GCSE English': 'GCSE Eng',
      'GCSE Combined Science': 'GCSE Sci',
      'Year 11 Maths': 'Y11 Math',
      'Year 11 English': 'Y11 Eng',
      'Year 11 Combined Science': 'Y11 Sci',
      'GCSE Physics': 'GCSE Phys',
      'GCSE Chemistry': 'GCSE Chem',
      'GCSE Biology': 'GCSE Bio',
      'Year 11 Physics': 'Y11 Phys',
      'Year 11 Biology': 'Y11 Bio',
      'Year 11 Chemistry': 'Y11 Chem'
    };
    return abbreviations[subject] || subject.substring(0, 8) + (subject.length > 8 ? '…' : '');
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
                const completionIndicator = getCompletionIndicator(eventInfo.event, eventInfo.view.type);
                
                return (
                  <div className="fc-event-main-frame p-0.5 min-h-0 overflow-hidden">
                    <div className="fc-event-title-container flex flex-col gap-0 min-h-0">
                      {isMonthView && (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="fc-event-time text-[10px] leading-tight opacity-90 flex-shrink-0">
                            {eventInfo.timeText}
                          </span>
                          <span className="event-title text-[10px] leading-tight font-medium truncate min-w-0">
                            {truncateText(eventInfo.event.title, 12)}
                          </span>
                          {completionIndicator && (
                            <span className="inline-flex items-center justify-center flex-shrink-0 text-[10px]">
                              {completionIndicator}
                            </span>
                          )}
                          {isRecurring && (
                            <span className="inline-flex items-center justify-center flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9"></path>
                                <path d="M3 12h.01M21 12h.01M12 21v.01"></path>
                                <path d="m9 3 3 3 3-3M3 9l3 3-3 3"></path>
                                <path d="M21 9-3 3 3 3"></path>
                                <path d="M9 21l3-3 3 3"></path>
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {(isWeekView || isDayView) && (
                        <>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="event-title text-xs leading-tight font-semibold truncate min-w-0">
                              {truncateText(eventInfo.event.title, isWeekView ? 20 : 30)}
                            </span>
                            {completionIndicator && (
                              <span className="inline-flex items-center justify-center flex-shrink-0 text-xs">
                                {completionIndicator}
                              </span>
                            )}
                            {isRecurring && (
                              <span className="inline-flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                  <path d="M21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9"></path>
                                  <path d="M3 12h.01M21 12h.01M12 21v.01"></path>
                                  <path d="m9 3 3 3 3-3M3 9l3 3-3 3"></path>
                                  <path d="M21 9-3 3 3 3"></path>
                                  <path d="M9 21l3-3 3 3"></path>
                                </svg>
                              </span>
                            )}
                          </div>
                          {subject && (
                            <div className="text-[10px] leading-tight opacity-75 truncate">
                              {abbreviateSubject(subject)}
                            </div>
                          )}
                          {eventInfo.timeText && (
                            <div className="fc-event-time text-[10px] leading-tight opacity-75">
                              {eventInfo.timeText}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Show tutor info for admin/owner views - only in day view to save space */}
                    {eventInfo.event.extendedProps.tutor && isDayView && (
                      <div className="fc-event-tutor text-[10px] leading-tight opacity-75 truncate mt-0.5">
                        {truncateText(`${eventInfo.event.extendedProps.tutor.first_name} ${eventInfo.event.extendedProps.tutor.last_name}`, 20)}
                      </div>
                    )}
                    
                    {/* Show student count for group lessons - only in day view */}
                    {eventInfo.event.extendedProps.students && eventInfo.event.extendedProps.students.length > 1 && isDayView && (
                      <div className="fc-event-students text-[10px] leading-tight opacity-75 truncate">
                        {eventInfo.event.extendedProps.students.length} students
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
