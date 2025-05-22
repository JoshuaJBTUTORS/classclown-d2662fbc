
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCalendarData = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Simplified fetch function
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    console.log("Calendar - fetchEvents called with:", { 
      start: start.toISOString(), 
      end: end.toISOString()
    });
    
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      console.log("Calendar - Fetching lessons from", startDate, "to", endDate);

      // Simple query to get lessons
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

      if (error) throw error;
      
      // Basic transformation to FullCalendar format
      const calendarEvents = (data || []).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        start: lesson.start_time,
        end: lesson.end_time,
      }));

      setEvents(calendarEvents);
      setIsLoading(false);
    } catch (error) {
      console.error('Calendar - Error fetching lessons:', error);
      toast.error('Failed to load lessons');
      setLoadingError('Failed to load lessons. Please refresh the page.');
      setIsLoading(false);
    }
  }, []);

  return {
    events,
    isLoading,
    loadingError,
    setLoadingError,
    setIsLoading,
    fetchEvents
  };
};
