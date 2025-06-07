
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isBefore, isAfter, isSameDay, parseISO } from 'date-fns';

interface TimeSlot {
  time: string;
  datetime: Date;
  available: boolean;
}

interface AvailabilitySlot {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export const useAvailableSlots = (tutorId?: string, selectedDate?: string) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorId || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchAvailableSlots = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const date = new Date(selectedDate);
        const dayName = format(date, 'EEEE').toLowerCase();

        // Get tutor's availability for the selected day
        const { data: availability, error: availabilityError } = await supabase
          .from('tutor_availability')
          .select('day_of_week, start_time, end_time')
          .eq('tutor_id', tutorId)
          .eq('day_of_week', dayName);

        if (availabilityError) throw availabilityError;

        if (!availability || availability.length === 0) {
          setSlots([]);
          return;
        }

        // Get existing lessons for the tutor on the selected date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingLessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('start_time, end_time')
          .eq('tutor_id', tutorId)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .in('status', ['scheduled', 'in_progress']);

        if (lessonsError) throw lessonsError;

        // Generate 30-minute slots for each availability period
        const allSlots: TimeSlot[] = [];
        
        availability.forEach((avail: AvailabilitySlot) => {
          const [startHour, startMinute] = avail.start_time.split(':').map(Number);
          const [endHour, endMinute] = avail.end_time.split(':').map(Number);
          
          const startDateTime = new Date(date);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(endHour, endMinute, 0, 0);
          
          let currentSlot = new Date(startDateTime);
          
          while (isBefore(currentSlot, endDateTime)) {
            const slotEnd = addMinutes(currentSlot, 30);
            
            // Check if this slot conflicts with existing lessons
            const isConflict = existingLessons?.some(lesson => {
              const lessonStart = parseISO(lesson.start_time);
              const lessonEnd = parseISO(lesson.end_time);
              
              return (
                (currentSlot >= lessonStart && currentSlot < lessonEnd) ||
                (slotEnd > lessonStart && slotEnd <= lessonEnd) ||
                (currentSlot <= lessonStart && slotEnd >= lessonEnd)
              );
            });
            
            allSlots.push({
              time: format(currentSlot, 'HH:mm'),
              datetime: new Date(currentSlot),
              available: !isConflict
            });
            
            currentSlot = addMinutes(currentSlot, 30);
          }
        });

        setSlots(allSlots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime()));
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [tutorId, selectedDate]);

  return { slots, isLoading, error };
};
