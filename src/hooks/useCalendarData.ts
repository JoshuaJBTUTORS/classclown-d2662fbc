
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
}

export const useCalendarData = ({ userRole, userEmail, isAuthenticated }: UseCalendarDataProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated || !userRole || !userEmail) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching lessons from Supabase for role:", userRole);
        let query;

        if (userRole === 'student') {
          // Students only see lessons they are enrolled in
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (studentError) {
            console.error('Error fetching student data:', studentError);
            toast.error('Failed to load student data');
            setIsLoading(false);
            return;
          }

          if (!studentData) {
            console.log('No student record found for email:', userEmail);
            setEvents([]);
            setIsLoading(false);
            return;
          }

          query = supabase
            .from('lessons')
            .select(`
              *,
              lesson_students!inner(student_id)
            `)
            .eq('lesson_students.student_id', studentData.id);

        } else if (userRole === 'tutor') {
          // Tutors only see lessons they are teaching
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutors')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (tutorError) {
            console.error('Error fetching tutor data:', tutorError);
            toast.error('Failed to load tutor data');
            setIsLoading(false);
            return;
          }

          if (!tutorData) {
            console.log('No tutor record found for email:', userEmail);
            setEvents([]);
            setIsLoading(false);
            return;
          }

          query = supabase
            .from('lessons')
            .select('*')
            .eq('tutor_id', tutorData.id);

        } else if (userRole === 'admin' || userRole === 'owner') {
          // Admins and owners see all lessons
          query = supabase
            .from('lessons')
            .select('*');
        } else {
          // Unknown role, show no lessons
          setEvents([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await query;

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

        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userRole, userEmail, isAuthenticated]);

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
