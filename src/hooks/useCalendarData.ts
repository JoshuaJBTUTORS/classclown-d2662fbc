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

  // Memoize lesson IDs to prevent infinite re-renders
  const lessonIds = useMemo(() => {
    return rawLessons.map(lesson => lesson.id);
  }, [rawLessons.length, rawLessons.map(l => l.id).join(',')]);

  const { completionData } = useLessonCompletion(lessonIds);

  // Helper function to check if a lesson has valid video conference links
  const hasValidVideoConference = (lesson: any, userRole: AppRole | null) => {
    // Check for direct video conference link
    if (lesson.video_conference_link && lesson.video_conference_link.trim() !== '') {
      return true;
    }

    // Check for lesson space room URL
    if (lesson.lesson_space_room_url && lesson.lesson_space_room_url.trim() !== '') {
      return true;
    }

    // Check for lesson space room ID (can generate URL)
    if (lesson.lesson_space_room_id && lesson.lesson_space_room_id.trim() !== '') {
      return true;
    }

    // Check for student-specific lesson space URLs
    if (lesson.lesson_students && lesson.lesson_students.length > 0) {
      const hasStudentUrls = lesson.lesson_students.some(ls => 
        ls.lesson_space_url && ls.lesson_space_url.trim() !== ''
      );
      if (hasStudentUrls) {
        return true;
      }
    }

    return false;
  };

  // Memoize events to prevent unnecessary recalculations
  const events = useMemo(() => {
    if (rawLessons.length === 0) return [];

    const calendarEvents = rawLessons.map(lesson => {
      // Check if this lesson actually has video conference capabilities
      const hasVideoConference = hasValidVideoConference(lesson, userRole);
      
      // Only set video conference properties if there are actual working links
      let videoConferenceLink = null;
      let studentUrls = [];

      if (hasVideoConference) {
        if (userRole === 'student' && lesson.lesson_space_room_id) {
          videoConferenceLink = `https://www.thelessonspace.com/space/${lesson.lesson_space_room_id}`;
        } else if (userRole === 'student' && lesson.lesson_students && lesson.lesson_students.length > 0) {
          const studentLessonData = lesson.lesson_students[0];
          if (studentLessonData.lesson_space_url) {
            videoConferenceLink = studentLessonData.lesson_space_url;
          }
        } else if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && lesson.lesson_students) {
          studentUrls = lesson.lesson_students
            .filter(ls => ls.lesson_space_url && ls.lesson_space_url.trim() !== '')
            .map(ls => ({
              url: ls.lesson_space_url,
              studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
            }));
          
          if (lesson.video_conference_link || lesson.lesson_space_room_url) {
            videoConferenceLink = lesson.video_conference_link || lesson.lesson_space_room_url;
          }
        }
      }

      // Get completion status for this lesson
      const completionInfo = completionData[lesson.id];
      const isCompleted = completionInfo?.isCompleted || false;

      let className = 'calendar-event';
      if (hasVideoConference && videoConferenceLink) {
        className += ' video-conference-event';
      }
      if (isCompleted) {
        className += ' completed-event';
      }
      
      return {
        id: lesson.id,
        title: lesson.title,
        start: lesson.start_time,
        end: lesson.end_time,
        className,
        extendedProps: {
          isRecurring: lesson.is_recurring,
          recurrenceInterval: lesson.recurrence_interval,
          recurrenceEndDate: lesson.recurrence_end_date,
          description: lesson.description,
          subject: lesson.subject,
          // Only include video conference properties if there are actual links
          videoConferenceLink: hasVideoConference ? videoConferenceLink : null,
          videoConferenceProvider: hasVideoConference ? lesson.video_conference_provider : null,
          lessonSpaceRoomId: lesson.lesson_space_room_id,
          lessonSpaceRoomUrl: lesson.lesson_space_room_url,
          lessonSpaceSpaceId: lesson.lesson_space_room_id,
          studentUrls: hasVideoConference ? studentUrls : [],
          userRole: userRole,
          tutor: (userRole === 'admin' || userRole === 'owner') && lesson.tutor ? {
            id: lesson.tutor.id,
            first_name: lesson.tutor.first_name,
            last_name: lesson.tutor.last_name,
            email: lesson.tutor.email
          } : null,
          students: lesson.lesson_students?.map(ls => ({
            id: ls.student_id,
            name: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
          })) || [],
          isCompleted: isCompleted,
          completionDetails: completionInfo
        }
      };
    });

    // Add recurring events
    for (const lesson of rawLessons) {
      if (lesson.is_recurring && lesson.recurrence_interval) {
        const recurringEvents = generateRecurringEvents(lesson, userRole, completionData);
        calendarEvents.push(...recurringEvents);
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
              *,
              lesson_students!inner(
                student_id,
                lesson_space_url
              )
            `)
            .eq('lesson_students.student_id', studentData.id);

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
              *,
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
              *,
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

  const generateRecurringEvents = (lesson, userRole, completionData) => {
    const events = [];
    const startDate = parseISO(lesson.start_time);
    const endDate = parseISO(lesson.end_time);
    const recurrenceEndDate = lesson.recurrence_end_date 
      ? parseISO(lesson.recurrence_end_date) 
      : addDays(startDate, 90);

    const durationMs = endDate.getTime() - startDate.getTime();
    
    // Check if this lesson has valid video conference capabilities
    const hasVideoConference = hasValidVideoConference(lesson, userRole);
    
    let videoConferenceLink = null;
    let studentUrls = [];

    if (hasVideoConference) {
      if (userRole === 'student' && lesson.lesson_space_room_id) {
        videoConferenceLink = `https://www.thelessonspace.com/space/${lesson.lesson_space_room_id}`;
      } else if (userRole === 'student' && lesson.lesson_students && lesson.lesson_students.length > 0) {
        const studentLessonData = lesson.lesson_students[0];
        if (studentLessonData.lesson_space_url) {
          videoConferenceLink = studentLessonData.lesson_space_url;
        }
      } else if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && lesson.lesson_students) {
        studentUrls = lesson.lesson_students
          .filter(ls => ls.lesson_space_url && ls.lesson_space_url.trim() !== '')
          .map(ls => ({
            url: ls.lesson_space_url,
            studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
          }));
        
        if (lesson.video_conference_link || lesson.lesson_space_room_url) {
          videoConferenceLink = lesson.video_conference_link || lesson.lesson_space_room_url;
        }
      }
    }
    
    let currentDate = startDate;
    
    while (currentDate <= recurrenceEndDate) {
      if (format(currentDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        const instanceStartDate = new Date(currentDate);
        const instanceEndDate = new Date(instanceStartDate.getTime() + durationMs);
        const instanceId = `${lesson.id}-${format(currentDate, 'yyyy-MM-dd')}`;
        
        // Recurring instances are typically not completed (they inherit from main lesson)
        const completionInfo = completionData[lesson.id];
        const isCompleted = completionInfo?.isCompleted || false;
        
        let className = 'recurring-instance';
        if (hasVideoConference && videoConferenceLink) {
          className += ' video-conference-event';
        }
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
            // Only include video conference properties if there are actual links
            videoConferenceLink: hasVideoConference ? videoConferenceLink : null,
            videoConferenceProvider: hasVideoConference ? lesson.video_conference_provider : null,
            lessonSpaceRoomId: lesson.lesson_space_room_id,
            lessonSpaceRoomUrl: lesson.lesson_space_room_url,
            lessonSpaceSpaceId: lesson.lesson_space_room_id,
            studentUrls: hasVideoConference ? studentUrls : [],
            userRole: userRole,
            tutor: (userRole === 'admin' || userRole === 'owner') && lesson.tutor ? {
              id: lesson.tutor.id,
              first_name: lesson.tutor.first_name,
              last_name: lesson.tutor.last_name,
              email: lesson.tutor.email
            } : null,
            students: lesson.lesson_students?.map(ls => ({
              id: ls.student_id,
              name: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
            })) || [],
            isCompleted: isCompleted,
            completionDetails: completionInfo
          }
        });
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
    
    return events;
  };

  return {
    events,
    isLoading
  };
};
