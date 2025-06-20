
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';
import { useLessonCompletion } from './useLessonCompletion';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  refreshKey?: number;
  filters?: {
    selectedStudents: string[];
    selectedTutors: string[];
  };
}

export const useCalendarData = ({ 
  userRole, 
  userEmail, 
  isAuthenticated, 
  refreshKey,
  filters 
}: UseCalendarDataProps) => {
  const [rawLessons, setRawLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fixed: Create stable lessonIds memoization with null safety
  const lessonIds = useMemo(() => {
    if (!rawLessons || rawLessons.length === 0) {
      return [];
    }
    return rawLessons.map(lesson => lesson?.id).filter(id => id != null);
  }, [rawLessons]);

  // Wrap lesson completion hook in error boundary
  const { completionData } = useLessonCompletion(lessonIds);

  // Move generateRecurringEvents function before useMemo to fix hoisting issue
  const generateRecurringEvents = (lesson: any, userRole: AppRole | null, completionData: any) => {
    const events = [];
    
    try {
      // Safety checks
      if (!lesson || !lesson.start_time || !lesson.end_time || !lesson.recurrence_interval) {
        console.warn('Invalid lesson data for recurring events:', lesson);
        return events;
      }

      console.log('Generating recurring events for lesson:', lesson.id, lesson.recurrence_interval);
      
      const startDate = parseISO(lesson.start_time);
      const endDate = parseISO(lesson.end_time);
      const recurrenceEndDate = lesson.recurrence_end_date 
        ? parseISO(lesson.recurrence_end_date) 
        : addDays(startDate, 90);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date format in lesson:', lesson);
        return events;
      }

      const durationMs = endDate.getTime() - startDate.getTime();
      
      let currentDate = startDate;
      let eventCount = 0;
      const MAX_EVENTS = 365; // Safety limit to prevent infinite loops
      
      while (currentDate <= recurrenceEndDate && eventCount < MAX_EVENTS) {
        if (format(currentDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
          const instanceStartDate = new Date(currentDate);
          const instanceEndDate = new Date(instanceStartDate.getTime() + durationMs);
          const instanceId = `${lesson.id}-${format(currentDate, 'yyyy-MM-dd')}`;
          
          // Recurring instances are typically not completed (they inherit from main lesson)
          const completionInfo = completionData[lesson.id];
          const isCompleted = completionInfo?.isCompleted || false;
          
          let className = 'recurring-instance';
          if (isCompleted) {
            className += ' completed-event';
          }
          
          events.push({
            id: instanceId,
            title: lesson.title,
            start: instanceStartDate.toISOString(),
            end: instanceEndDate.toISOString(),
            className,
            extendedProps: {
              isRecurringInstance: true,
              originalLessonId: lesson.id,
              description: lesson.description,
              subject: lesson.subject,
              userRole: userRole,
              tutor: (userRole === 'admin' || userRole === 'owner') && lesson.tutor ? {
                id: lesson.tutor.id,
                first_name: lesson.tutor.first_name,
                last_name: lesson.tutor.last_name,
                email: lesson.tutor.email
              } : null,
              students: lesson.lesson_students?.map((ls: any) => ({
                id: ls.student_id,
                name: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
              })) || [],
              isCompleted: isCompleted,
              completionDetails: completionInfo,
              eventType: 'lesson'
            }
          });

          eventCount++;
        }
        
        if (lesson.recurrence_interval === 'daily') {
          currentDate = addDays(currentDate, 1);
        } else if (lesson.recurrence_interval === 'weekly') {
          currentDate = addDays(currentDate, 7);
        } else if (lesson.recurrence_interval === 'biweekly') {
          currentDate = addDays(currentDate, 14);
        } else if (lesson.recurrence_interval === 'monthly') {
          currentDate = addDays(currentDate, 30);
        } else {
          currentDate = addDays(currentDate, 7);
        }
      }

      if (eventCount >= MAX_EVENTS) {
        console.warn(`Recurring event generation stopped at ${MAX_EVENTS} events for lesson ${lesson.id}`);
      }
      
      console.log(`Generated ${events.length} recurring events for lesson ${lesson.id}`);
      return events;
    } catch (error) {
      console.error('Error generating recurring events for lesson:', lesson.id, error);
      return events;
    }
  };

  // Memoize events to prevent unnecessary recalculations
  const events = useMemo(() => {
    const calendarEvents = [];

    // Add lesson events
    if (rawLessons && rawLessons.length > 0) {
      const lessonEvents = rawLessons.map(lesson => {
        if (!lesson || !lesson.id) return null;
        
        // Get completion status for this lesson
        const completionInfo = completionData[lesson.id];
        const isCompleted = completionInfo?.isCompleted || false;

        let className = 'calendar-event';
        if (isCompleted) {
          className += ' completed-event';
        }
        
        return {
          id: lesson.id,
          title: lesson.title || 'Untitled Lesson',
          start: lesson.start_time,
          end: lesson.end_time,
          className,
          extendedProps: {
            isRecurring: lesson.is_recurring,
            recurrenceInterval: lesson.recurrence_interval,
            recurrenceEndDate: lesson.recurrence_end_date,
            description: lesson.description,
            subject: lesson.subject,
            userRole: userRole,
            tutor: (userRole === 'admin' || userRole === 'owner') && lesson.tutor ? {
              id: lesson.tutor.id,
              first_name: lesson.tutor.first_name,
              last_name: lesson.tutor.last_name,
              email: lesson.tutor.email
            } : null,
            students: lesson.lesson_students?.map((ls: any) => ({
              id: ls.student_id,
              name: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
            })) || [],
            isCompleted: isCompleted,
            completionDetails: completionInfo,
            eventType: 'lesson'
          }
        };
      }).filter(event => event !== null);

      calendarEvents.push(...lessonEvents);

      // Add recurring events
      for (const lesson of rawLessons) {
        if (lesson && lesson.is_recurring && lesson.recurrence_interval) {
          const recurringEvents = generateRecurringEvents(lesson, userRole, completionData);
          calendarEvents.push(...recurringEvents);
        }
      }
    }

    return calendarEvents;
  }, [rawLessons, userRole, completionData]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!isAuthenticated || !userRole || !userEmail) {
        setRawLessons([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching lessons from Supabase for role:", userRole);
        let query;

        // Define the base lesson fields including all Agora-related fields
        const lessonFields = `
          *,
          agora_channel_name,
          agora_token,
          agora_uid,
          agora_rtm_token,
          netless_room_uuid,
          netless_room_token,
          netless_app_identifier
        `;

        if (userRole === 'student') {
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
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          query = supabase
            .from('lessons')
            .select(`
              ${lessonFields},
              lesson_students!inner(
                student_id,
                lesson_space_url
              )
            `)
            .eq('lesson_students.student_id', studentData.id);

        } else if (userRole === 'parent') {
          // For parents, first get the parent record
          const { data: parentData, error: parentError } = await supabase
            .from('parents')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (parentError) {
            console.error('Error fetching parent data:', parentError);
            toast.error('Failed to load parent data');
            setIsLoading(false);
            return;
          }

          if (!parentData) {
            console.log('No parent record found for email:', userEmail);
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          // Get all students linked to this parent
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('parent_id', parentData.id);

          if (studentError) {
            console.error('Error fetching parent\'s students:', studentError);
            toast.error('Failed to load student data');
            setIsLoading(false);
            return;
          }

          if (!studentData || studentData.length === 0) {
            console.log('No students found for parent:', parentData.id);
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          const studentIds = studentData.map(s => s.id);

          query = supabase
            .from('lessons')
            .select(`
              ${lessonFields},
              lesson_students!inner(
                student_id,
                lesson_space_url,
                student:students(id, first_name, last_name)
              )
            `)
            .in('lesson_students.student_id', studentIds);

        } else if (userRole === 'tutor') {
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
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          query = supabase
            .from('lessons')
            .select(`
              ${lessonFields},
              lesson_students(
                student_id,
                lesson_space_url,
                student:students(id, first_name, last_name)
              )
            `)
            .eq('tutor_id', tutorData.id);

        } else if (userRole === 'admin' || userRole === 'owner') {
          query = supabase
            .from('lessons')
            .select(`
              ${lessonFields},
              tutor:tutors!inner(id, first_name, last_name, email),
              lesson_students(
                student_id,
                lesson_space_url,
                student:students(id, first_name, last_name)
              )
            `);

          if (filters?.selectedTutors && filters.selectedTutors.length > 0) {
            query = query.in('tutor_id', filters.selectedTutors);
          }

          if (filters?.selectedStudents && filters.selectedStudents.length > 0) {
            query = query.in('lesson_students.student_id', filters.selectedStudents.map(id => parseInt(id)));
          }

        } else {
          setRawLessons([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log("Lessons fetched:", data);
        
        let filteredData = data || [];
        if ((userRole === 'admin' || userRole === 'owner') && filters?.selectedStudents && filters.selectedStudents.length > 0) {
          filteredData = filteredData.filter(lesson => {
            if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
            return lesson.lesson_students.some(ls => 
              filters.selectedStudents.includes(ls.student_id.toString())
            );
          });
        }

        setRawLessons(filteredData);

      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [userRole, userEmail, isAuthenticated, refreshKey, filters]);

  return {
    events,
    isLoading
  };
};
