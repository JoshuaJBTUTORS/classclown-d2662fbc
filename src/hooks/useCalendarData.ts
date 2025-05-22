
import { useState, useCallback, useRef, useEffect } from 'react';
import { format, parseISO, isValid, startOfMonth, endOfMonth, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCalendarData = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  
  // Safety function for date formatting
  const safeFormatDate = (date: Date | string, formatString: string): string => {
    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        dateObj = parseISO(date);
      } else {
        dateObj = date;
      }
      
      if (!isValid(dateObj)) {
        console.error("Invalid date object:", date);
        return "Invalid date";
      }
      
      return format(dateObj, formatString);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Error formatting date";
    }
  };

  // Set up loading timeout
  useEffect(() => {
    if (isLoading) {
      console.log("Calendar - Setting up loading timeout");
      loadingTimeoutRef.current = window.setTimeout(() => {
        console.log("Calendar - Loading timeout triggered");
        setIsLoading(false);
        setLoadingError("Loading timed out. Please try refreshing the page.");
        toast.error("Calendar loading timed out. Please try refreshing the page.");
      }, 8000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [isLoading]);

  // Fetch lessons data
  const fetchLessons = useCallback(async (start: Date, end: Date, filteredStudentId: string | null = null, filteredParentId: string | null = null) => {
    console.log("Calendar - fetchLessons called with:", { 
      start: start.toISOString(), 
      end: end.toISOString(),
      filteredStudentId,
      filteredParentId
    });
    
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      if (!isValid(start) || !isValid(end)) {
        throw new Error("Invalid date range provided to fetchLessons");
      }
      
      const startDate = safeFormatDate(start, "yyyy-MM-dd");
      const endDate = safeFormatDate(end, "yyyy-MM-dd");
      
      console.log("Calendar - Fetching lessons from", startDate, "to", endDate);

      // Start building the query
      let query = supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, parent_first_name, parent_last_name)
          )
        `)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data for FullCalendar
      const events = (data || [])
        .map(lesson => {
          try {
            const students = lesson.lesson_students?.map((ls: any) => ls.student) || [];
            
            // Apply filters
            if (filteredStudentId) {
              const studentFound = students.some((student: any) => student?.id.toString() === filteredStudentId);
              if (!studentFound) return null;
            }

            if (filteredParentId) {
              const parentFound = students.some((student: any) => {
                if (!student?.parent_first_name || !student?.parent_last_name) return false;
                const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
                return parentId === filteredParentId;
              });
              if (!parentFound) return null;
            }
            
            const studentNames = students
              .map((student: any) => `${student?.first_name || ''} ${student?.last_name || ''}`)
              .filter(name => name.trim() !== '')
              .join(', ');
            
            const displayTitle = students.length > 0 
              ? `${lesson.title} - ${studentNames}`
              : lesson.title;
            
            let backgroundColor;
            let borderColor;
            
            switch (lesson.status) {
              case 'completed':
                backgroundColor = 'rgba(34, 197, 94, 0.2)';
                borderColor = 'rgb(34, 197, 94)';
                break;
              case 'cancelled':
                backgroundColor = 'rgba(239, 68, 68, 0.2)';
                borderColor = 'rgb(239, 68, 68)';
                break;
              default:
                backgroundColor = 'rgba(59, 130, 246, 0.2)';
                borderColor = 'rgb(59, 130, 246)';
            }
            
            return {
              id: lesson.id,
              title: displayTitle,
              start: lesson.start_time,
              end: lesson.end_time,
              backgroundColor,
              borderColor,
              textColor: 'black',
              extendedProps: {
                description: lesson.description,
                status: lesson.status,
                tutor: lesson.tutor,
                students,
                isRecurring: lesson.is_recurring
              }
            };
          } catch (eventError) {
            console.error("Error transforming lesson to event:", eventError, lesson);
            return null;
          }
        })
        .filter(event => event !== null);

      setLessons(events);
      
      // Clear the loading timeout if data loaded successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Calendar - Error fetching lessons:', error);
      toast.error('Failed to load lessons');
      setLoadingError('Failed to load lessons. Please refresh the page.');
      setIsLoading(false);
    }
  }, []);

  return {
    lessons,
    isLoading,
    loadingError,
    setLoadingError,
    setIsLoading,
    fetchLessons
  };
};
