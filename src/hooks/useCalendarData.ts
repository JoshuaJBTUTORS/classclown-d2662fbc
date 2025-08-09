
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { getCalendarColor, getCalendarTextColor } from '@/utils/calendarColors';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  textColor: string;
  className?: string;
  extendedProps: {
    subject: string;
    tutorName: string;
    tutorId: string;
    studentNames: string[];
    studentIds: number[];
    isRecurring: boolean;
    isRecurringInstance?: boolean;
    originalLessonId?: string;
    instanceDate?: string;
    isTrial?: boolean;
    status: string;
    cancelled_at?: string;
    cancelled_count?: number;
  };
}

export const useCalendarData = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole } = useAuth();

  const fetchLessons = useCallback(async (start?: Date, end?: Date) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('lessons')
        .select(`
          id,
          title,
          subject,
          start_time,
          end_time,
          tutor:tutors(id, first_name, last_name),
          lesson_students(student:students(id, first_name, last_name)),
          is_recurring,
          recurring_lesson_id,
          is_trial,
          status,
          cancelled_at,
          cancelled_count
        `)
        .order('start_time', { ascending: true });

      // Apply role-based filtering
      if (userRole === 'tutor') {
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('id')
          .eq('email', user.email)
          .single();

        if (tutorData) {
          query = query.eq('tutor_id', tutorData.id);
        }
      } else if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .single();

        if (studentData) {
          query = query.in('id', 
            supabase
              .from('lesson_students')
              .select('lesson_id')
              .eq('student_id', studentData.id)
          );
        }
      }

      // Apply date filters if provided
      if (start) {
        query = query.gte('start_time', start.toISOString());
      }
      if (end) {
        query = query.lte('start_time', end.toISOString());
      }

      const { data: lessons, error } = await query;

      if (error) {
        throw error;
      }

      const calendarEvents: CalendarEvent[] = lessons?.map((lesson: any) => {
        const tutorName = lesson.tutor 
          ? `${lesson.tutor.first_name} ${lesson.tutor.last_name}`
          : 'Unassigned';

        const studentNames = lesson.lesson_students?.map((ls: any) => 
          `${ls.student.first_name} ${ls.student.last_name}`
        ) || [];

        const studentIds = lesson.lesson_students?.map((ls: any) => ls.student.id) || [];

        const backgroundColor = getCalendarColor(lesson.subject);
        const textColor = getCalendarTextColor(lesson.subject);

        // Determine CSS class based on lesson status
        const eventClasses = [];
        if (lesson.status === 'cancelled' || lesson.cancelled_at) {
          eventClasses.push('cancelled-event');
        }

        return {
          id: lesson.id,
          title: lesson.title,
          start: lesson.start_time,
          end: lesson.end_time,
          backgroundColor,
          textColor,
          className: eventClasses.join(' '),
          extendedProps: {
            subject: lesson.subject || 'General',
            tutorName,
            tutorId: lesson.tutor?.id || '',
            studentNames,
            studentIds,
            isRecurring: lesson.is_recurring || false,
            isRecurringInstance: !!lesson.recurring_lesson_id,
            originalLessonId: lesson.recurring_lesson_id,
            isTrial: lesson.is_trial || false,
            status: lesson.status || 'scheduled',
            cancelled_at: lesson.cancelled_at,
            cancelled_count: lesson.cancelled_count
          }
        };
      }) || [];

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole]);

  const refreshData = useCallback(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    events,
    isLoading,
    error,
    fetchLessons,
    refreshData
  };
};
