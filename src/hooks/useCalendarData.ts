
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { TimeOffRequest } from '@/types/availability';

export const useCalendarData = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both lessons and time off requests in parallel
        const [lessonsResponse, timeOffResponse] = await Promise.all([
          fetchLessons(),
          fetchTimeOffRequests()
        ]);
        
        // Combine the events
        const allEvents = [
          ...(lessonsResponse || []),
          ...(timeOffResponse || [])
        ];
        
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const fetchTimeOffRequests = async () => {
    try {
      // Only fetch approved time off requests
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('tutor_time_off')
        .select('*')
        .eq('status', 'approved');
        
      if (timeOffError) throw timeOffError;
      
      // Convert to calendar events
      return timeOffData.map((timeOff: any) => ({
        id: timeOff.id,
        title: 'Time Off',
        start: timeOff.start_date,
        end: timeOff.end_date,
        allDay: true,
        extendedProps: {
          isTimeOff: true,
          tutorId: timeOff.tutor_id
        },
        display: 'background',
        backgroundColor: 'rgba(255, 99, 71, 0.2)',
        borderColor: 'rgba(255, 99, 71, 0.5)'
      }));
    } catch (error) {
      console.error('Error fetching time off requests:', error);
      return [];
    }
  };

  const fetchLessons = async () => {
    try {
      console.log("Fetching lessons from Supabase");
      const { data, error } = await supabase
        .from('lessons')
        .select('*');

      if (error) throw error;

      console.log("Lessons fetched:", data);
      
      // Process regular lessons
      const calendarEvents = (data || []).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        start: lesson.start_time,
        end: lesson.end_time,
        extendedProps: {
          isRecurring: lesson.is_recurring,
          recurrenceInterval: lesson.recurrence_interval,
          recurrenceEndDate: lesson.recurrence_end_date,
          description: lesson.description
        }
      }));

      // Process recurring lessons
      for (const lesson of data || []) {
        if (lesson.is_recurring && lesson.recurrence_interval) {
          const recurringEvents = generateRecurringEvents(lesson);
          calendarEvents.push(...recurringEvents);
        }
      }

      return calendarEvents;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  };

  // Function to generate recurring events
  const generateRecurringEvents = (lesson) => {
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
            description: lesson.description
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
    isLoading
  };
};
