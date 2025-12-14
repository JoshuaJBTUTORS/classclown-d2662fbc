import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';
import { useLessonCompletion } from './useLessonCompletion';
import { useAttendanceStatus } from './useAttendanceStatus';
import { getSubjectClass } from '@/utils/calendarColors';
import { convertUTCToUK } from '@/utils/timezone';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  refreshKey?: number;
  startDate?: Date;
  endDate?: Date;
  viewType?: string;
  filters?: {
    selectedStudents: string[];
    selectedTutors: string[];
    selectedParents?: string[];
    selectedSubjects: string[];
    selectedLessonType: string;
  };
}

export const useCalendarData = ({ 
  userRole, 
  userEmail, 
  isAuthenticated, 
  refreshKey,
  startDate,
  endDate,
  viewType,
  filters 
}: UseCalendarDataProps) => {
  const [rawLessons, setRawLessons] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Add ref to track current fetch to prevent overlapping calls
  const currentFetchRef = useRef<Promise<void> | null>(null);

  // Fixed: Create stable lessonIds memoization with null safety
  const lessonIds = useMemo(() => {
    if (!rawLessons || rawLessons.length === 0) {
      return [];
    }
    const validIds = rawLessons.map(lesson => lesson?.id).filter(id => id != null);
    return validIds;
  }, [rawLessons]);

  // Wrap lesson completion hook in error boundary
  const { completionData } = useLessonCompletion(lessonIds);
  
  // Add attendance status hook
  const { attendanceStatusData } = useAttendanceStatus(lessonIds);

  // Memoize events to prevent unnecessary recalculations
  const events = useMemo(() => {
    const calendarEvents = [];

    if (rawLessons && rawLessons.length > 0) {
      const lessonEvents = rawLessons.map(lesson => {
        if (!lesson || !lesson.id) return null;
        
        // Get completion status for this lesson
        const completionInfo = completionData[lesson.id];
        const isCompleted = completionInfo?.isCompleted || false;
        
        // Get attendance status for this lesson
        const attendanceInfo = attendanceStatusData[lesson.id];
        const isCancelled = attendanceInfo?.isCancelled || false;
        const isAbsent = attendanceInfo?.isAbsent || false;

        // Get subject-specific class for proper coloring
        const subjectClass = getSubjectClass(lesson.subject, lesson.lesson_type);
        let className = `calendar-event ${subjectClass}`;
        
        // Add special styling for demo sessions
        if (lesson.lesson_type === 'demo') {
          className += ' demo-event';
        }
        
        if (lesson.is_recurring_instance) {
          className += ' recurring-instance';
        }
        if (isCompleted) {
          className += ' completed-event';
        }
        if (isCancelled) {
          className += ' cancelled-event';
        }
        if (isAbsent) {
          className += ' absent-event';
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
            lessonType: lesson.lesson_type,
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
            isCancelled: isCancelled,
            isAbsent: isAbsent,
            attendanceDetails: attendanceInfo,
            eventType: 'lesson'
          }
        };
      }).filter(event => event !== null);

      calendarEvents.push(...lessonEvents);
    }

    return calendarEvents;
  }, [rawLessons, userRole, completionData, attendanceStatusData]);

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
              console.error('❌ Error fetching student data:', studentError);
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
                console.error('❌ Failed to update student user_id:', updateError);
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

            // Add date range filter if provided
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

          } else if (userRole === 'parent') {
            // For parents, first get the parent record
            const { data: parentData, error: parentError } = await supabase
              .from('parents')
              .select('id')
              .eq('email', userEmail)
              .maybeSingle();

            if (parentError) {
              console.error('❌ Error fetching parent data:', parentError);
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
              console.error('❌ Error fetching parent\'s students:', studentError);
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

            // Add date range filter if provided
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

          } else if (userRole === 'tutor') {
            const { data: tutorData, error: tutorError } = await supabase
              .from('tutors')
              .select('id')
              .eq('email', userEmail)
              .maybeSingle();

            if (tutorError) {
              console.error('❌ Error fetching tutor data:', tutorError);
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
            // Exclude demo sessions from tutor view
            query = supabase
              .from('lessons')
              .select(`
                *,
                lesson_students(
                  student_id,
                  student:students(id, first_name, last_name)
                )
              `)
              .eq('tutor_id', tutorData.id)
              .neq('lesson_type', 'demo');

            // Add date range filter if provided
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

          } else if (userRole === 'admin' || userRole === 'owner') {
            // Fetch all lessons (original lessons and instances) for admin/owner
            query = supabase
              .from('lessons')
              .select(`
                *,
                tutor:tutors(id, first_name, last_name, email),
                lesson_students(
                  student_id,
                  student:students(id, first_name, last_name, parent_id)
                )
              `);

            // Add date range filter if provided (for admin/owner this is crucial for performance)
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

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
            console.error('❌ Database query error:', error);
            throw error;
          }

          let filteredData = data || [];
          
          // Filter out demo data if not requested
          filteredData = filteredData.filter(lesson => !lesson.is_demo_data);
          
          // Apply student filter for admin/owner
          if ((userRole === 'admin' || userRole === 'owner') && filters?.selectedStudents && filters.selectedStudents.length > 0) {
            filteredData = filteredData.filter(lesson => {
              if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
              return lesson.lesson_students.some(ls => 
                filters.selectedStudents.includes(ls.student_id.toString())
              );
            });
          }

          // Apply parent filter for admin/owner
          if ((userRole === 'admin' || userRole === 'owner') && filters?.selectedParents && filters.selectedParents.length > 0) {
            filteredData = filteredData.filter(lesson => {
              if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
              return lesson.lesson_students.some(ls => 
                ls.student?.parent_id && filters.selectedParents.includes(ls.student.parent_id)
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
            } else if (filters.selectedLessonType === 'Demo Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type === 'demo');
            } else if (filters.selectedLessonType === 'Full Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type !== 'trial' && lesson.lesson_type !== 'demo' || lesson.lesson_type == null);
            }
          }

          // Exam period filter for tutors only - Dec 15-22, 2025: show only 1-1 lessons
          if (userRole === 'tutor' && startDate && endDate) {
            const examStart = new Date('2025-12-14T00:00:00');
            const examEnd = new Date('2025-12-22T23:59:59');
            
            // Check if current view overlaps with exam period
            const isExamPeriod = startDate <= examEnd && endDate >= examStart;
            
            if (isExamPeriod) {
              filteredData = filteredData.filter(lesson => {
                const title = (lesson.title || '').toLowerCase();
                return title.includes('1-1') || 
                       title.includes('1:1') || 
                       title.includes('one-to-one') ||
                       title.includes('1 to 1');
              });
            }
          }

          setRawLessons(filteredData);

        })();

        currentFetchRef.current = fetchPromise;
        await fetchPromise;

      } catch (error) {
        console.error('💥 Critical error in fetchEvents:', error);
        toast.error('Failed to load lessons');
      } finally {
        setIsLoading(false);
        currentFetchRef.current = null;
      }
    };

    fetchEvents();
  }, [userRole, userEmail, isAuthenticated, refreshKey, startDate, endDate, viewType, filters]);

  return {
    events,
    isLoading
  };
};
