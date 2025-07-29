
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';
import { useLessonCompletion } from './useLessonCompletion';
import { getSubjectClass } from '@/utils/calendarColors';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  refreshKey?: number;
  filters?: {
    selectedStudents: string[];
    selectedTutors: string[];
    selectedSubjects: string[];
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
  const [rawDemoSessions, setRawDemoSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add ref to track current fetch to prevent overlapping calls
  const currentFetchRef = useRef<Promise<void> | null>(null);

  // Fixed: Create stable lessonIds memoization with null safety
  const lessonIds = useMemo(() => {
    if (!rawLessons || rawLessons.length === 0) {
      return [];
    }
    return rawLessons.map(lesson => lesson?.id).filter(id => id != null);
  }, [rawLessons]);

  // Wrap lesson completion hook in error boundary
  const { completionData } = useLessonCompletion(lessonIds);

  // Memoize events to prevent unnecessary recalculations
  const events = useMemo(() => {
    const calendarEvents = [];

    // Process all lessons (both original lessons and pre-generated instances)
    if (rawLessons && rawLessons.length > 0) {
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
          start: lesson.start_time,
          end: lesson.end_time,
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

    // Process demo sessions
    if (rawDemoSessions && rawDemoSessions.length > 0) {
      const demoEvents = rawDemoSessions.map(demoSession => {
        if (!demoSession || !demoSession.id) return null;
        
        const lesson = demoSession.lessons;
        const admin = demoSession.admin;
        
        return {
          id: `demo-${demoSession.id}`,
          title: `Demo: ${lesson?.title || 'Trial Lesson'}`,
          start: demoSession.start_time,
          end: demoSession.end_time,
          className: 'calendar-event demo-session bg-orange-100 border-orange-300 text-orange-800',
          extendedProps: {
            eventType: 'demo_session',
            demoSessionId: demoSession.id,
            lessonId: demoSession.lesson_id,
            adminId: demoSession.admin_id,
            status: demoSession.status,
            lesson: lesson,
            admin: admin ? {
              id: admin.id,
              first_name: admin.first_name,
              last_name: admin.last_name,
              email: admin.email
            } : null,
            students: lesson?.lesson_students?.map((ls: any) => ({
              id: ls.student_id,
              name: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Trial Student'
            })) || [],
            userRole: userRole
          }
        };
      }).filter(event => event !== null);

      calendarEvents.push(...demoEvents);
    }

    return calendarEvents;
  }, [rawLessons, rawDemoSessions, userRole, completionData]);

  useEffect(() => {
    const fetchEvents = async () => {
      // Prevent overlapping fetch calls
      if (currentFetchRef.current) {
        console.log('Fetch already in progress, skipping...');
        return;
      }

      if (!isAuthenticated || !userRole || !userEmail) {
        setRawLessons([]);
        setRawDemoSessions([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching lessons and demo sessions from Supabase for role:", userRole);
        
        const fetchPromise = (async () => {
          let query;

          if (userRole === 'student') {
            console.log('Fetching student data for email:', userEmail);
            
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
              console.log('No student record found for email:', userEmail);
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            console.log('Found student data:', studentData);

            // Check if student record needs user_id update
            const currentUser = await supabase.auth.getUser();
            if (currentUser.data.user && !studentData.user_id) {
              console.log('Student record missing user_id, updating...');
              
              // Update student record to link user_id
              const { error: updateError } = await supabase
                .from('students')
                .update({ user_id: currentUser.data.user.id })
                .eq('id', studentData.id);

              if (updateError) {
                console.error('Failed to update student user_id:', updateError);
              } else {
                console.log('Successfully updated student user_id');
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
              console.log('No tutor record found for email:', userEmail);
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
            // Fetch all lessons (original lessons and instances) for admin/owner
            query = supabase
              .from('lessons')
              .select(`
                *,
                tutor:tutors!inner(id, first_name, last_name, email),
                lesson_students(
                  student_id,
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
            console.log('Unknown user role:', userRole);
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          const { data, error } = await query;

          if (error) {
            console.error('Error fetching lessons:', error);
            throw error;
          }

          console.log(`Lessons fetched for ${userRole}:`, data);
          
          let filteredData = data || [];
          
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

          setRawLessons(filteredData);

          // Fetch demo sessions for admin and owner roles
          if (userRole === 'admin' || userRole === 'owner') {
            console.log("Fetching demo sessions for admin/owner");
            
            const { data: demoData, error: demoError } = await supabase
              .from('demo_sessions')
              .select(`
                *,
                lessons(
                  id,
                  title,
                  subject,
                  lesson_students(
                    student_id,
                    student:students(id, first_name, last_name)
                  )
                ),
                admin:profiles!demo_sessions_admin_id_fkey(
                  id,
                  first_name,
                  last_name
                )
              `);

            if (demoError) {
              console.error('Error fetching demo sessions:', demoError);
            } else {
              console.log('Demo sessions fetched:', demoData);
              setRawDemoSessions(demoData || []);
            }
          } else {
            setRawDemoSessions([]);
          }
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
