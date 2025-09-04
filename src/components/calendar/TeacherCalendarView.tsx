import React, { useMemo, useState } from 'react';
import { format, addHours, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import TutorRow from './TutorRow';
import LessonDetailsDialog from './LessonDetailsDialog';
import TeacherViewNavigation from './TeacherViewNavigation';
import { convertUTCToUK } from '@/utils/timezone';

interface TeacherCalendarViewProps {
  events: any[];
  viewType: 'teacherWeek' | 'teacherDay';
  currentDate: Date;
  isLoading: boolean;
  onLessonsUpdated?: () => void;
  onDateChange?: (date: Date) => void;
}

const TeacherCalendarView: React.FC<TeacherCalendarViewProps> = ({
  events,
  viewType,
  currentDate,
  isLoading,
  onLessonsUpdated,
  onDateChange
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);

  // Handle event click
  const handleEventClick = (event: any) => {
    setSelectedLessonId(event.id);
    if (event.extendedProps.isRecurringInstance) {
      setInstanceDetails({
        parentLessonId: event.extendedProps.parentLessonId,
        instanceDate: event.extendedProps.instanceDate
      });
    } else {
      setInstanceDetails(null);
    }
  };

  const handleCloseDialog = () => {
    setSelectedLessonId(null);
    setInstanceDetails(null);
  };
  // Group events by tutor
  const tutorGroups = useMemo(() => {
    const groups: { [tutorId: string]: { tutor: any; events: any[] } } = {};
    
    events.forEach(event => {
      const tutor = event.extendedProps?.tutor;
      if (!tutor) return;
      
      const tutorId = tutor.id;
      if (!groups[tutorId]) {
        groups[tutorId] = {
          tutor,
          events: []
        };
      }
      groups[tutorId].events.push(event);
    });
    
    return Object.values(groups).sort((a, b) => 
      `${a.tutor.first_name} ${a.tutor.last_name}`.localeCompare(
        `${b.tutor.first_name} ${b.tutor.last_name}`
      )
    );
  }, [events]);

  // Generate time slots based on view type
  const timeSlots = useMemo(() => {
    if (viewType === 'teacherDay') {
      // Generate hourly slots for a single day (8 AM to 8 PM)
      const slots = [];
      for (let hour = 8; hour <= 20; hour++) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          date: currentDate,
          key: `${format(currentDate, 'yyyy-MM-dd')}-${hour}`
        });
      }
      return slots;
    } else {
      // Generate daily slots for a week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
      const slots = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        slots.push({
          time: format(date, 'EEE dd'),
          date,
          key: format(date, 'yyyy-MM-dd')
        });
      }
      return slots;
    }
  }, [viewType, currentDate]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="teacher-calendar-view h-full w-full max-w-full min-w-0 flex flex-col bg-background border rounded-lg overflow-hidden">
      {/* Navigation Header */}
      {onDateChange && (
        <TeacherViewNavigation
          currentDate={currentDate}
          viewType={viewType}
          onDateChange={onDateChange}
        />
      )}
      
      {/* Single horizontal scroll container */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex flex-col">
          {/* Header with time slots */}
          <div className="flex border-b bg-muted/50">
            <div className="w-48 flex-shrink-0 p-3 border-r bg-background">
              <h3 className="font-medium text-sm text-muted-foreground">Tutors</h3>
            </div>
            <div className="flex">
              {timeSlots.map(slot => (
                <div
                  key={slot.key}
                  className="w-40 p-3 border-r last:border-r-0 text-center flex-shrink-0"
                >
                  <span className="text-sm font-medium">{slot.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable content area */}
          <ScrollArea className="flex-1">
            <div className="min-h-full">
              {tutorGroups.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <p>No tutors found for the selected period</p>
                </div>
              ) : (
                tutorGroups.map(group => (
                  <TutorRow
                    key={group.tutor.id}
                    tutor={group.tutor}
                    events={group.events}
                    timeSlots={timeSlots}
                    viewType={viewType}
                    onEventClick={handleEventClick}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Lesson Details Dialog */}
      {selectedLessonId && (
        <LessonDetailsDialog
          lessonId={selectedLessonId}
          isOpen={!!selectedLessonId}
          onClose={handleCloseDialog}
          onLessonUpdated={onLessonsUpdated}
          instanceDate={instanceDetails?.instanceDate}
        />
      )}
    </div>
  );
};

export default TeacherCalendarView;