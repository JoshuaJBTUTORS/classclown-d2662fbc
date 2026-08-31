import React, { useMemo, useState } from 'react';
import { format, addHours, startOfWeek, addDays, isSameDay, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import TutorRow from './TutorRow';
import LessonDetailsDialog from './LessonDetailsDialog';
import TeacherViewNavigation from './TeacherViewNavigation';
import { convertUTCToUK } from '@/utils/timezone';
import { useTutorAvailability } from '@/hooks/useTutorAvailability';
import LoadingHand from '@/components/ui/loading-hand';

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

  // Calculate date range and tutor IDs for availability hook
  const { tutorIds, dateRange } = useMemo(() => {
    const ids = tutorGroups.map(group => group.tutor.id);
    
    let range;
    if (viewType === 'teacherDay') {
      range = {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate)
      };
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      range = {
        start: startOfDay(weekStart),
        end: endOfDay(endOfWeek(weekStart))
      };
    }
    
    return { tutorIds: ids, dateRange: range };
  }, [tutorGroups, viewType, currentDate]);

  // Fetch tutor availability data
  const { availabilityData, isLoading: availabilityLoading } = useTutorAvailability({
    tutorIds,
    dateRange,
    viewType
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingHand />
      </div>
    );
  }

  return (
    <div className="h-full w-full min-w-0 flex flex-col">
      <div className="flex-1 min-w-0 relative calendar-container">
        <div className="teacher-calendar-view h-full w-full min-w-0 flex flex-col bg-background border rounded-lg overflow-hidden">
          {/* Navigation Header */}
          {onDateChange && (
            <TeacherViewNavigation
              currentDate={currentDate}
              viewType={viewType}
              onDateChange={onDateChange}
            />
          )}

          {/* Single scroll container (horizontal + vertical) */}
          <div className="flex-1 min-w-0 overflow-auto">
            <div className="min-w-max">
              {/* Header with time slots */}
              <div
                className="grid border-b bg-muted/50 sticky top-0 z-20"
                style={{
                  gridTemplateColumns: `minmax(140px, 180px) repeat(${timeSlots.length}, minmax(${viewType === 'teacherDay' ? '96px' : '120px'}, 1fr))`
                }}
              >
                <div className="sticky left-0 z-10 p-3 border-r bg-background">
                  <h3 className="font-medium text-sm text-muted-foreground">Tutors</h3>
                </div>
                {timeSlots.map(slot => (
                  <div
                    key={slot.key}
                    className="p-3 border-r last:border-r-0 text-center min-w-0"
                  >
                    <span className="text-sm font-medium">{slot.time}</span>
                  </div>
                ))}
              </div>

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
                    availabilityData={availabilityData[group.tutor.id]}
                  />
                ))
              )}
            </div>
          </div>
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