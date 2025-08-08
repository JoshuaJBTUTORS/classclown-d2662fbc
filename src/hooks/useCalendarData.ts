
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
  startDate?: Date;
  endDate?: Date;
  viewType?: string;
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
    console.log(`📊 Lesson ID Processing: ${validIds.length} valid lesson IDs extracted from ${rawLessons.length} raw lessons`);
    return validIds;
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
        console.log('🔄 Fetch already in progress, skipping...');
        return;
      }

      if (!isAuthenticated || !userRole || !userEmail) {
        console.log('❌ Missing authentication data:', { isAuthenticated, userRole, userEmail });
        setRawLessons([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log("🔍 Starting lesson fetch process for role:", userRole);
        console.log(`📅 Date range: ${startDate?.toISOString()} to ${endDate?.toISOString()} (${viewType} view)`);
        
        const fetchPromise = (async () => {
          let query;

          if (userRole === 'student') {
            console.log('👨‍🎓 Processing student data for email:', userEmail);
            
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
              console.log('❌ No student record found for email:', userEmail);
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            console.log('✅ Found student data:', studentData);

            // Check if student record needs user_id update
            const currentUser = await supabase.auth.getUser();
            if (currentUser.data.user && !studentData.user_id) {
              console.log('🔄 Student record missing user_id, updating...');
              
              // Update student record to link user_id
              const { error: updateError } = await supabase
                .from('students')
                .update({ user_id: currentUser.data.user.id })
                .eq('id', studentData.id);

              if (updateError) {
                console.error('❌ Failed to update student user_id:', updateError);
              } else {
                console.log('✅ Successfully updated student user_id');
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
            console.log('👨‍👩‍👧‍👦 Processing parent data for email:', userEmail);
            
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
              console.log('❌ No parent record found for email:', userEmail);
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
              console.log('❌ No students found for parent:', parentData.id);
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            const studentIds = studentData.map(s => s.id);
            console.log('✅ Found students for parent:', studentIds);

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
            console.log('👨‍🏫 Processing tutor data for email:', userEmail);
            
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
              console.log('❌ No tutor record found for email:', userEmail);
              setRawLessons([]);
              setIsLoading(false);
              return;
            }

            console.log('✅ Found tutor data:', tutorData);

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

            // Add date range filter if provided
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

          } else if (userRole === 'admin' || userRole === 'owner') {
            console.log('👑 Processing admin/owner data - fetching lessons for date range');
            
            // Fetch all lessons (original lessons and instances) for admin/owner
            query = supabase
              .from('lessons')
              .select(`
                *,
                tutor:tutors(id, first_name, last_name, email),
                lesson_students(
                  student_id,
                  student:students(id, first_name, last_name)
                )
              `);

            // Add date range filter if provided (for admin/owner this is crucial for performance)
            if (startDate && endDate) {
              query = query
                .gte('start_time', startDate.toISOString())
                .lte('start_time', endDate.toISOString());
            }

            if (filters?.selectedTutors && filters.selectedTutors.length > 0) {
              console.log('🔍 Applying tutor filter:', filters.selectedTutors);
              query = query.in('tutor_id', filters.selectedTutors);
            }

            if (filters?.selectedStudents && filters.selectedStudents.length > 0) {
              console.log('🔍 Applying student filter:', filters.selectedStudents);
              query = query.in('lesson_students.student_id', filters.selectedStudents.map(id => parseInt(id)));
            }

          } else {
            console.log('❓ Unknown user role:', userRole);
            setRawLessons([]);
            setIsLoading(false);
            return;
          }

          console.log('🚀 Executing database query...');
          const { data, error } = await query;

          if (error) {
            console.error('❌ Database query error:', error);
            throw error;
          }

          console.log(`✅ Database query completed. Raw results: ${data?.length || 0} lessons`);
          
          let filteredData = data || [];
          
          // Log before demo data filtering
          const beforeDemoFilter = filteredData.length;
          filteredData = filteredData.filter(lesson => !lesson.is_demo_data);
          const afterDemoFilter = filteredData.length;
          console.log(`🧹 Demo data filter: ${beforeDemoFilter} → ${afterDemoFilter} (removed ${beforeDemoFilter - afterDemoFilter} demo lessons)`);
          
          // Apply student filter for admin/owner
          if ((userRole === 'admin' || userRole === 'owner') && filters?.selectedStudents && filters.selectedStudents.length > 0) {
            const beforeStudentFilter = filteredData.length;
            filteredData = filteredData.filter(lesson => {
              if (!lesson.lesson_students || lesson.lesson_students.length === 0) return false;
              return lesson.lesson_students.some(ls => 
                filters.selectedStudents.includes(ls.student_id.toString())
              );
            });
            const afterStudentFilter = filteredData.length;
            console.log(`👥 Student filter: ${beforeStudentFilter} → ${afterStudentFilter} (removed ${beforeStudentFilter - afterStudentFilter} lessons)`);
          }

          // Apply subject filter
          if (filters?.selectedSubjects && filters.selectedSubjects.length > 0) {
            const beforeSubjectFilter = filteredData.length;
            filteredData = filteredData.filter(lesson => 
              filters.selectedSubjects.includes(lesson.subject)
            );
            const afterSubjectFilter = filteredData.length;
            console.log(`📚 Subject filter: ${beforeSubjectFilter} → ${afterSubjectFilter} (removed ${beforeSubjectFilter - afterSubjectFilter} lessons)`);
          }

          // Apply lesson type filter
          if (filters?.selectedLessonType && filters.selectedLessonType !== 'All Lessons') {
            const beforeTypeFilter = filteredData.length;
            if (filters.selectedLessonType === 'Trial Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type === 'trial');
            } else if (filters.selectedLessonType === 'Full Lessons') {
              filteredData = filteredData.filter(lesson => lesson.lesson_type !== 'trial' || lesson.lesson_type == null);
            }
            const afterTypeFilter = filteredData.length;
            console.log(`🎯 Lesson type filter (${filters.selectedLessonType}): ${beforeTypeFilter} → ${afterTypeFilter} (removed ${beforeTypeFilter - afterTypeFilter} lessons)`);
          }

          console.log(`🎯 FINAL RESULT: ${filteredData.length} lessons will be processed for completion data`);
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
