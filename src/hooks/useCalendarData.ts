
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';
import { useLessonCompletion } from './useLessonCompletion';
import { getSubjectClass } from '@/utils/calendarColors';
import { convertUTCToUK } from '@/utils/timezone';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  refreshKey?: number;
  filters?: {
    selectedStudents: string[];
    selectedTutors: string[];
    selectedSubjects: string[];
    selectedAdminDemos: string[];
    selectedLessonType: string;
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
  
  // Add ref to track current fetch to prevent overlapping calls
  const currentFetchRef = useRef<Promise<void> | null>(null);

  // Optimized: Filter lesson IDs by date range and create stable memoization
  const lessonIds = useMemo(() => {
    if (!rawLessons || rawLessons.length === 0) {
      return [];
    }
    
    // Only get completion data for lessons in the current view (past 30 days to future 60 days)
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
    
    return rawLessons
      .filter(lesson => {
        if (!lesson?.id || !lesson?.start_time) return false;
        const lessonDate = new Date(lesson.start_time);
        return lessonDate >= startDate && lessonDate <= endDate;
      })
      .map(lesson => lesson.id);
  }, [rawLessons]);

  // Wrap lesson completion hook in error boundary
  const { completionData } = useLessonCompletion(lessonIds);

  // Memoize events to prevent unnecessary recalculations
  const events = useMemo(() => {
    const calendarEvents = [];

    // Check if admin demo filter is active
    const isAdminDemoFilterActive = filters?.selectedAdminDemos && filters.selectedAdminDemos.length > 0;

    // Only process regular lessons if admin demo filter is NOT active
    if (rawLessons && rawLessons.length > 0 && !isAdminDemoFilterActive) {
      const lessonEvents = rawLessons.map(lesson => {
        if (!lesson || !lesson.id) return null;
        
        // Get completion status for this lesson
        const completionInfo = completionData[lesson.id];
        const isCompleted = completionInfo?.isCompleted || false;

        // Get subject-specific class for proper coloring
        const subjectClass = getSubjectClass(lesson.subject, lesson.lesson_type);
        let className = `calendar-event ${subjectClass}`;
        
        if (lesson.is_recurring_instance) {
          className += ' recurring-instance';
        }
        if (isCompleted) {
          className += ' completed-event';
        }
        
        return {
          id: lesson.id,
          title: lesson.title || 'Untitled Lesson',
          start: convertUTCToUK(lesson.start_time).toISOString(),
          end: convertUTCToUK(lesson.end_time).toISOString(),
          className,
          extendedProps: {
            isRecurring: lesson.is_recurring,
            isRecurringInstance: lesson.is_recurring_instance,
            parentLessonId: lesson.parent_lesson_id,
            instanceDate: lesson.instance_date,
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
    }

    return calendarEvents;
  }, [rawLessons, userRole, completionData]);

  useEffect(() => {
    const fetchEvents = async () => {
      // Prevent overlapping fetch calls
      if (currentFetchRef.current) {
        return;
      }

      if (!isAuthenticated || !userRole || !userEmail) {
        setRawLessons([]);
        setIsLoading(false);
        return;
      }

      try {
        
        const fetchPromise = (async () => {
          let query;

          if (userRole === 'student') {
            
            // Enhanced student lookup with better error handling
            const { data: studentData, error: studentError } = await supabase
              .from('students')
              .select('id, user_id, first_name, last_name, email')
              .eq('email', userEmail)
              .maybeSingle();

            if (studentError) {
              console.error('Error fetching student data:', studentError);
              toast.error('Failed to load student data');
              setIsLoading(false);
              return;
            }

            if (!studentData) {
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            // Check if student record needs user_id update
            const currentUser = await supabase.auth.getUser();
            if (currentUser.data.user && !studentData.user_id) {
              // Update student record to link user_id
              const { error: updateError } = await supabase
                .from('students')
                .update({ user_id: currentUser.data.user.id })
                .eq('id', studentData.id);

              if (updateError) {
                console.error('Failed to update student user_id:', updateError);
              }
            }

            // Fetch both original lessons and instances for this student
            query = supabase
              .from('lessons')
              .select(`
                *,
                lesson_students!inner(
                  student_id
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
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            const studentIds = studentData.map(s => s.id);

            // Fetch both original lessons and instances for this parent's students
            query = supabase
              .from('lessons')
              .select(`
                *,
                lesson_students!inner(
                  student_id,
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
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            // Fetch both original lessons and instances for this tutor
            query = supabase
              .from('lessons')
              .select(`
                *,
                lesson_students(
                  student_id,
                  student:students(id, first_name, last_name)
                )
              `)
              .eq('tutor_id', tutorData.id);

          } else if (userRole === 'admin' || userRole === 'owner') {
            // Optimized: Only fetch lessons within reasonable date range for admin/owner
            const now = new Date();
            const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now
            
            query = supabase
              .from('lessons')
              .select(`
                id, title, description, start_time, end_time, subject, lesson_type, 
                status, is_recurring, is_recurring_instance, parent_lesson_id, 
                instance_date, recurrence_interval, recurrence_end_date, tutor_id,
                tutor:tutors!inner(id, first_name, last_name, email),
                lesson_students(
                  student_id,
                  student:students(id, first_name, last_name)
                )
              `)
              .gte('start_time', startDate.toISOString())
              .lte('start_time', endDate.toISOString());

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

          if (error) {
            console.error('Error fetching lessons:', error);
            throw error;
          }

          let filteredData = data || [];
          
          // CRITICAL: Filter out demo data in production mode
          filteredData = filteredData.filter(lesson => !lesson.is_demo_data);
          
          // Apply student filter
          if ((userRole === 'admin' || userRole === 'owner') && filters?.selectedStudents && filters.selectedStudents.length > 0) {
            filteredData = filteredData.filter(lesson => {
              if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
              return lesson.lesson_students.some(ls => 
                filters.selectedStudents.includes(ls.student_id.toString())
              );
            });
          }

          // Apply subject filter
          if (filters?.selectedSubjects && filters.selectedSubjects.length > 0) {
            filteredData = filteredData.filter(lesson => 
              filters.selectedSubjects.includes(lesson.subject)
            );
          }

          // Apply lesson type filter
          if (filters?.selectedLessonType && filters.selectedLessonType !== 'All Lessons') {
            if (filters.selectedLessonType === 'Trial Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type === 'trial');
            } else if (filters.selectedLessonType === 'Full Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type !== 'trial' || lesson.lesson_type == null);
            }
          }

          setRawLessons(filteredData);

        })();

        currentFetchRef.current = fetchPromise;
        await fetchPromise;

      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setIsLoading(false);
        currentFetchRef.current = null;
      }
    };

    fetchEvents();
  }, [userRole, userEmail, isAuthenticated, refreshKey, filters]);

  return {
    events,
    isLoading
  };
};
