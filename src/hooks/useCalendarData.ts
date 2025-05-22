import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay, isWithinInterval } from 'date-fns';
import { TimeOffRequest, TimeOffStatus } from '@/types/availability';

export const useCalendarData = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeOffPeriods, setTimeOffPeriods] = useState<TimeOffRequest[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*');

        if (lessonsError) throw lessonsError;
        
        // Fetch approved time-off periods
        const { data: timeOffData, error: timeOffError } = await supabase
          .from('tutor_time_off')
          .select('*')
          .eq('status', 'approved');
        
        if (timeOffError) throw timeOffError;
        
        // Use type assertion to ensure the data is properly typed
        const typedTimeOffData = (timeOffData || []).map((item: any) => ({
          ...item,
          status: item.status as TimeOffStatus
        })) as TimeOffRequest[];
        
        setTimeOffPeriods(typedTimeOffData);
        
        // Process regular lessons
        const calendarEvents = (lessonsData || []).map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          start: lesson.start_time,
          end: lesson.end_time,
          extendedProps: {
            isRecurring: lesson.is_recurring,
            recurrenceInterval: lesson.recurrence_interval,
            recurrenceEndDate: lesson.recurrence_end_date,
            description: lesson.description,
            tutorId: lesson.tutor_id
          }
        }));

        // Process time-off periods for calendar display
        const timeOffEvents = typedTimeOffData.map((timeOff: TimeOffRequest) => ({
          id: `timeoff-${timeOff.id}`,
          title: `Time Off: ${timeOff.reason || 'No reason provided'}`,
          start: timeOff.start_date,
          end: timeOff.end_date,
          allDay: true,
          extendedProps: {
            isTimeOff: true,
            tutorId: timeOff.tutor_id
          },
          display: 'background',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          borderColor: 'transparent'
        }));

        // Process recurring lessons
        const recurringEvents = [];
        for (const lesson of lessonsData || []) {
          if (lesson.is_recurring && lesson.recurrence_interval) {
            const lessonRecurringEvents = generateRecurringEvents(lesson, typedTimeOffData);
            recurringEvents.push(...lessonRecurringEvents);
          }
        }

        setEvents([...calendarEvents, ...recurringEvents, ...timeOffEvents]);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to check if a date is within an approved time-off period
  const isDateInTimeOffPeriod = (date: Date, tutorId: string, timeOffPeriods: TimeOffRequest[]) => {
    return timeOffPeriods.some(period => {
      if (period.tutor_id !== tutorId) return false;
      
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  // Function to generate recurring events
  const generateRecurringEvents = (lesson: any, timeOffPeriods: TimeOffRequest[]) => {
    const events = [];
    const startDate = parseISO(lesson.start_time);
    const endDate = parseISO(lesson.end_time);
    const recurrenceEndDate = lesson.recurrence_end_date 
      ? parseISO(lesson.recurrence_end_date) 
      : addDays(startDate, 90); // Default to 3 months if no end date

    // Calculate duration in milliseconds
    const durationMs = endDate.getTime() - startDate.getTime();
    
    let currentDate = startDate;
    
    // Generate instances based on recurrence pattern
    while (currentDate <= recurrenceEndDate) {
      // Skip the original date as it's already included
      if (format(currentDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        const instanceStartDate = new Date(currentDate);
        const instanceEndDate = new Date(instanceStartDate.getTime() + durationMs);
        
        // Skip this instance if it falls within a time-off period for this tutor
        if (isDateInTimeOffPeriod(instanceStartDate, lesson.tutor_id, timeOffPeriods)) {
          // Increment the date based on recurrence interval
          if (lesson.recurrence_interval === 'daily') {
            currentDate = addDays(currentDate, 1);
          } else if (lesson.recurrence_interval === 'weekly') {
            currentDate = addDays(currentDate, 7);
          } else if (lesson.recurrence_interval === 'biweekly') {
            currentDate = addDays(currentDate, 14);
          } else if (lesson.recurrence_interval === 'monthly') {
            // This is a simplification - a more accurate implementation would account for month lengths
            currentDate = addDays(currentDate, 30);
          } else {
            // Default to weekly if interval is not recognized
            currentDate = addDays(currentDate, 7);
          }
          continue;
        }
        
        // Create a unique ID for this instance by combining the original ID with the date
        const instanceId = `${lesson.id}-${format(currentDate, 'yyyy-MM-dd')}`;
        
        events.push({
          id: instanceId,
          title: lesson.title,
          start: instanceStartDate.toISOString(),
          end: instanceEndDate.toISOString(),
          extendedProps: {
            isRecurringInstance: true,
            originalLessonId: lesson.id,
            description: lesson.description,
            tutorId: lesson.tutor_id
          },
          // Add a slightly different styling for recurring instances
          className: 'recurring-instance'
        });
      }
      
      // Increment the date based on recurrence interval
      if (lesson.recurrence_interval === 'daily') {
        currentDate = addDays(currentDate, 1);
      } else if (lesson.recurrence_interval === 'weekly') {
        currentDate = addDays(currentDate, 7);
      } else if (lesson.recurrence_interval === 'biweekly') {
        currentDate = addDays(currentDate, 14);
      } else if (lesson.recurrence_interval === 'monthly') {
        // This is a simplification - a more accurate implementation would account for month lengths
        currentDate = addDays(currentDate, 30);
      } else {
        // Default to weekly if interval is not recognized
        currentDate = addDays(currentDate, 7);
      }
    }
    
    return events;
  };

  return {
    events,
    isLoading,
    timeOffPeriods
  };
};
