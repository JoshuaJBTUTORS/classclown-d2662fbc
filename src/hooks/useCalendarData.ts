
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';

export const useCalendarData = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
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
        const recurringEvents = [];
        for (const lesson of data || []) {
          if (lesson.is_recurring && lesson.recurrence_interval) {
            const recurringEvents = generateRecurringEvents(lesson);
            calendarEvents.push(...recurringEvents);
          }
        }

        // Fetch tutor availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('tutor_availability')
          .select(`
            id, 
            day_of_week, 
            start_time, 
            end_time,
            tutors (
              first_name,
              last_name
            )
          `);

        if (availabilityError) {
          console.error('Error fetching tutor availability:', availabilityError);
        } else if (availabilityData) {
          // Add availability as calendar events with a different style
          const availabilityEvents = generateAvailabilityEvents(availabilityData);
          calendarEvents.push(...availabilityEvents);
        }

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Function to generate availability events
  const generateAvailabilityEvents = (availabilityData: any[]) => {
    const availabilityEvents = [];
    const daysOfWeek = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };
    
    // Get current date and start of week
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    for (const slot of availabilityData) {
      const slotDayOfWeek = daysOfWeek[slot.day_of_week as keyof typeof daysOfWeek];
      if (slotDayOfWeek === undefined) continue;
      
      // Calculate days to add to get to the desired day of week
      const daysToAdd = (slotDayOfWeek - currentDayOfWeek + 7) % 7;
      const slotDate = addDays(today, daysToAdd);
      
      // Format the date string for the event
      const dateStr = format(slotDate, 'yyyy-MM-dd');
      
      // Create the availability event
      availabilityEvents.push({
        id: `availability-${slot.id}`,
        title: `${slot.tutors?.first_name} ${slot.tutors?.last_name} - Available`,
        start: `${dateStr}T${slot.start_time}`,
        end: `${dateStr}T${slot.end_time}`,
        backgroundColor: 'rgba(74, 222, 128, 0.2)', // Light green
        borderColor: 'rgb(74, 222, 128)',
        textColor: 'rgb(22, 101, 52)',
        display: 'block',
        extendedProps: {
          isAvailability: true,
          tutorId: slot.tutor_id
        }
      });
      
      // Also add events for next 4 weeks
      for (let week = 1; week <= 4; week++) {
        const futureDate = addDays(slotDate, week * 7);
        const futureDateStr = format(futureDate, 'yyyy-MM-dd');
        
        availabilityEvents.push({
          id: `availability-${slot.id}-week${week}`,
          title: `${slot.tutors?.first_name} ${slot.tutors?.last_name} - Available`,
          start: `${futureDateStr}T${slot.start_time}`,
          end: `${futureDateStr}T${slot.end_time}`,
          backgroundColor: 'rgba(74, 222, 128, 0.2)', // Light green
          borderColor: 'rgb(74, 222, 128)',
          textColor: 'rgb(22, 101, 52)',
          display: 'block',
          extendedProps: {
            isAvailability: true,
            tutorId: slot.tutor_id
          }
        });
      }
    }
    
    return availabilityEvents;
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
