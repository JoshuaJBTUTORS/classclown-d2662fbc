
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Check } from 'lucide-react';
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

  // Vibrant subject color mapping function
  const getSubjectColor = (subject: string): string => {
    if (!subject) {
      console.log('No subject provided, using default color');
      return '#FF7043'; // Default to bright orange
    }
    
    const subjectLower = subject.toLowerCase();
    console.log('Processing subject:', subject, 'lowercased:', subjectLower);
    
    // KS2 subjects - Bright Orange
    if (subjectLower.includes('ks2') || subjectLower.includes('early ks2')) {
      console.log('Matched KS2 subject, using orange');
      return '#FF7043';
    }
    
    // 11 Plus subjects - Royal Purple
    if (subjectLower.includes('11 plus') || subjectLower.includes('11+')) {
      console.log('Matched 11 Plus subject, using purple');
      return '#7B1FA2';
    }
    
    // KS3 subjects - Electric Blue
    if (subjectLower.includes('ks3')) {
      console.log('Matched KS3 subject, using blue');
      return '#1976D2';
    }
    
    // GCSE subjects - Emerald Green
    if (subjectLower.includes('gcse')) {
      console.log('Matched GCSE subject, using green');
      return '#388E3C';
    }
    
    // SATS subjects - Coral Red
    if (subjectLower.includes('sats')) {
      console.log('Matched SATS subject, using red');
      return '#E53935';
    }
    
    // Year 11 subjects - Teal
    if (subjectLower.includes('year 11')) {
      console.log('Matched Year 11 subject, using teal');
      return '#00796B';
    }
    
    // A-Level subjects - Deep Orange
    if (subjectLower.includes('a-level') || subjectLower.includes('a level')) {
      console.log('Matched A-Level subject, using deep orange');
      return '#F57C00';
    }
    
    // Trial lessons - Pink
    if (subjectLower.includes('trial')) {
      console.log('Matched Trial subject, using pink');
      return '#C2185B';
    }
    
    // Check if it's a UUID (indicating invalid data)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(subject)) {
      console.warn('Subject appears to be a UUID, indicating data issue:', subject);
      return '#E91E63'; // Magenta to highlight data issues
    }
    
    // Default fallback - use bright orange instead of blue
    console.log('No specific match found for subject:', subject, 'using default orange');
    return '#FF7043';
  };

  const handleEventClick = (info: any) => {
    console.log("Event clicked:", info.event.id, info.event);
    
    setSelectedLessonId(info.event.id);
    setIsDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    console.log("Closing lesson details dialog");
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

  const handleRefresh = () => {
    console.log("Refresh called from CalendarDisplay");
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
    <div className="h-full w-full">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"></div>
          <p className="ml-2 text-muted-foreground">Loading calendar...</p>
        </div>
      ) : (
        <div className="h-full w-full calendar-container">
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
              if (info.event.extendedProps.isCompleted) {
                classes.push('completed-event');
              }
              
              return classes;
            }}
            eventContent={(eventInfo) => {
              const isMonthView = eventInfo.view.type === 'dayGridMonth';
              const isWeekView = eventInfo.view.type === 'timeGridWeek';
              const isDayView = eventInfo.view.type === 'timeGridDay';
              
              // Regular lesson event rendering
              const isRecurring = eventInfo.event.extendedProps.isRecurring || 
                                eventInfo.event.extendedProps.isRecurringInstance;
              const isCompleted = eventInfo.event.extendedProps.isCompleted;
              const subject = eventInfo.event.extendedProps.subject;
              
              return (
                <div className="fc-event-main-frame p-0.5 min-h-0 overflow-hidden relative">
                  {/* Completion indicator */}
                  {isCompleted && (
                    <div className="absolute top-0 right-0 z-10">
                      <div className="bg-green-500 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}
                  
                  <div className="fc-event-title-container flex flex-col gap-0 min-h-0">
                    {isMonthView && (
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="fc-event-time text-[10px] leading-tight opacity-90 flex-shrink-0">
                          {eventInfo.timeText}
                        </span>
                        <span className="event-title text-[10px] leading-tight font-medium truncate min-w-0">
                          {truncateText(eventInfo.event.title, 12)}
                        </span>
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
              const subject = info.event.extendedProps.subject || '';
              const color = getSubjectColor(subject);
              console.log('Setting event color for subject:', subject, 'color:', color);
              info.el.style.backgroundColor = color;
              info.el.style.borderColor = color;
              info.el.style.color = 'white';
              // Semi-transparency is now handled by CSS class .fc-event with opacity: 0.75
            }}
          />
        </div>
      )}

      <LessonDetailsDialog
        lessonId={selectedLessonId}
        open={isDetailsOpen}
        onClose={handleDetailsClose}
        onLessonUpdated={handleRefresh}
      />

      <AssignHomeworkDialog
        isOpen={isAssigningHomework}
        onClose={handleHomeworkDialogClose}
        preSelectedLessonId={homeworkLessonId}
        preloadedLessonData={preloadedLessonData}
        onSuccess={handleHomeworkDialogClose}
      />
    </div>
  );
};

export default CalendarDisplay;
