
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { AppRole } from '@/contexts/AuthContext';

interface UseCalendarDataProps {
  userRole: AppRole | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  refreshKey?: number;
}

export const useCalendarData = ({ userRole, userEmail, isAuthenticated, refreshKey }: UseCalendarDataProps) => {
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

          // For students, get lessons with their individual lesson space URLs
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
            setEvents([]);
            setIsLoading(false);
            return;
          }

          // For tutors, get lessons with all student URLs to show both tutor and student access points
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
          // For admins, get all lessons with student information
          query = supabase
            .from('lessons')
            .select(`
              *,
              lesson_students(
                student_id,
                lesson_space_url,
                student:students(id, first_name, last_name)
              )
            `);
        } else {
          setEvents([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log("Lessons fetched:", data);
        
        // Process regular lessons
        const calendarEvents = (data || []).map(lesson => {
          // Determine the appropriate video conference link based on user role
          let videoConferenceLink = lesson.video_conference_link || lesson.lesson_space_room_url;
          let studentUrls = [];
          
          if (userRole === 'student' && lesson.lesson_students && lesson.lesson_students.length > 0) {
            // For students, use their individual lesson space URL
            const studentLessonData = lesson.lesson_students[0];
            if (studentLessonData.lesson_space_url) {
              videoConferenceLink = studentLessonData.lesson_space_url;
            }
          } else if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && lesson.lesson_students) {
            // For tutors and admins, collect all student URLs
            studentUrls = lesson.lesson_students
              .filter(ls => ls.lesson_space_url)
              .map(ls => ({
                url: ls.lesson_space_url,
                studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
              }));
          }
          
          const hasVideoConference = videoConferenceLink || studentUrls.length > 0;
          const className = hasVideoConference ? 'calendar-event video-conference-event' : 'calendar-event';
          
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
              videoConferenceLink: videoConferenceLink,
              videoConferenceProvider: lesson.video_conference_provider,
              lessonSpaceRoomId: lesson.lesson_space_room_id,
              lessonSpaceRoomUrl: lesson.lesson_space_room_url,
              studentUrls: studentUrls, // Add student URLs for tutors/admins
              userRole: userRole
            }
          };
        });

        // Process recurring lessons
        for (const lesson of data || []) {
          if (lesson.is_recurring && lesson.recurrence_interval) {
            const recurringEvents = generateRecurringEvents(lesson, userRole);
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
  }, [userRole, userEmail, isAuthenticated, refreshKey]);

  // Function to generate recurring events
  const generateRecurringEvents = (lesson, userRole) => {
    const events = [];
    const startDate = parseISO(lesson.start_time);
    const endDate = parseISO(lesson.end_time);
    const recurrenceEndDate = lesson.recurrence_end_date 
      ? parseISO(lesson.recurrence_end_date) 
      : addDays(startDate, 90);

    const durationMs = endDate.getTime() - startDate.getTime();
    
    // Determine the correct video conference link for this user role
    let videoConferenceLink = lesson.video_conference_link || lesson.lesson_space_room_url;
    let studentUrls = [];
    
    if (userRole === 'student' && lesson.lesson_students && lesson.lesson_students.length > 0) {
      const studentLessonData = lesson.lesson_students[0];
      if (studentLessonData.lesson_space_url) {
        videoConferenceLink = studentLessonData.lesson_space_url;
      }
    } else if ((userRole === 'tutor' || userRole === 'admin' || userRole === 'owner') && lesson.lesson_students) {
      studentUrls = lesson.lesson_students
        .filter(ls => ls.lesson_space_url)
        .map(ls => ({
          url: ls.lesson_space_url,
          studentName: ls.student ? `${ls.student.first_name} ${ls.student.last_name}` : 'Unknown Student'
        }));
    }
    
    const hasVideoConference = videoConferenceLink || studentUrls.length > 0;
    
    let currentDate = startDate;
    
    while (currentDate <= recurrenceEndDate) {
      if (format(currentDate, 'yyyy-MM-dd') !== format(startDate, 'yyyy-MM-dd')) {
        const instanceStartDate = new Date(currentDate);
        const instanceEndDate = new Date(instanceStartDate.getTime() + durationMs);
        const instanceId = `${lesson.id}-${format(currentDate, 'yyyy-MM-dd')}`;
        
        let className = 'recurring-instance';
        if (hasVideoConference) {
          className += ' video-conference-event';
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
            videoConferenceLink: videoConferenceLink,
            videoConferenceProvider: lesson.video_conference_provider,
            lessonSpaceRoomId: lesson.lesson_space_room_id,
            lessonSpaceRoomUrl: lesson.lesson_space_room_url,
            studentUrls: studentUrls,
            userRole: userRole
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
