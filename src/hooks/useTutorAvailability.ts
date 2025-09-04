import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

interface TutorAvailabilitySlot {
  id: string;
  tutor_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface AvailabilityData {
  [tutorId: string]: {
    [timeSlotKey: string]: boolean;
  };
}

interface UseTutorAvailabilityParams {
  tutorIds: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  viewType: 'teacherWeek' | 'teacherDay';
}

export const useTutorAvailability = ({ tutorIds, dateRange, viewType }: UseTutorAvailabilityParams) => {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorIds.length) {
      setAvailabilityData({});
      return;
    }

    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tutor availability
        const { data: availability, error: availabilityError } = await supabase
          .from('tutor_availability')
          .select('id, tutor_id, day_of_week, start_time, end_time')
          .in('tutor_id', tutorIds);

        if (availabilityError) throw availabilityError;

        // Fetch existing lessons in the date range to exclude occupied slots
        const { data: existingLessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('tutor_id, start_time, end_time')
          .in('tutor_id', tutorIds)
          .gte('start_time', dateRange.start.toISOString())
          .lte('start_time', dateRange.end.toISOString())
          .in('status', ['scheduled', 'in_progress']);

        if (lessonsError) throw lessonsError;

        // Generate availability data
        const newAvailabilityData: AvailabilityData = {};

        // Get all dates in the range
        const dates = eachDayOfInterval({
          start: dateRange.start,
          end: dateRange.end
        });

        tutorIds.forEach(tutorId => {
          newAvailabilityData[tutorId] = {};

          // Get tutor's availability rules
          const tutorAvailability = availability?.filter(slot => slot.tutor_id === tutorId) || [];
          
          // Get tutor's existing lessons
          const tutorLessons = existingLessons?.filter(lesson => lesson.tutor_id === tutorId) || [];

          dates.forEach(date => {
            const dayName = format(date, 'EEEE').toLowerCase();
            const dayAvailability = tutorAvailability.filter(slot => slot.day_of_week === dayName);

            if (viewType === 'teacherDay') {
              // Generate hourly slots for day view (8 AM to 8 PM)
              for (let hour = 8; hour <= 20; hour++) {
                const timeSlotKey = `${format(date, 'yyyy-MM-dd')}-${hour}`;
                const slotStart = new Date(date);
                slotStart.setHours(hour, 0, 0, 0);
                const slotEnd = new Date(date);
                slotEnd.setHours(hour + 1, 0, 0, 0);

                // Check if this time slot is within tutor's availability
                const isAvailable = dayAvailability.some(avail => {
                  const [availStartHour, availStartMinute] = avail.start_time.split(':').map(Number);
                  const [availEndHour, availEndMinute] = avail.end_time.split(':').map(Number);
                  
                  const availStart = new Date(date);
                  availStart.setHours(availStartHour, availStartMinute, 0, 0);
                  const availEnd = new Date(date);
                  availEnd.setHours(availEndHour, availEndMinute, 0, 0);

                  return slotStart >= availStart && slotEnd <= availEnd;
                });

                // Check if there's a conflicting lesson
                const hasConflict = tutorLessons.some(lesson => {
                  const lessonStart = parseISO(lesson.start_time);
                  const lessonEnd = parseISO(lesson.end_time);
                  
                  return (
                    (slotStart >= lessonStart && slotStart < lessonEnd) ||
                    (slotEnd > lessonStart && slotEnd <= lessonEnd) ||
                    (slotStart <= lessonStart && slotEnd >= lessonEnd)
                  );
                });

                newAvailabilityData[tutorId][timeSlotKey] = isAvailable && !hasConflict;
              }
            } else {
              // For week view, check if tutor is available on this day
              const timeSlotKey = format(date, 'yyyy-MM-dd');
              const hasAvailability = dayAvailability.length > 0;

              // Check if there are any lessons on this day
              const hasLessonsOnDay = tutorLessons.some(lesson => {
                const lessonStart = parseISO(lesson.start_time);
                return format(lessonStart, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              });

              // Day is available if tutor has availability rules and no lessons scheduled
              newAvailabilityData[tutorId][timeSlotKey] = hasAvailability && !hasLessonsOnDay;
            }
          });
        });

        setAvailabilityData(newAvailabilityData);
      } catch (err) {
        console.error('Error fetching tutor availability:', err);
        setError('Failed to load tutor availability');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [tutorIds, dateRange.start, dateRange.end, viewType]);

  return { availabilityData, isLoading, error };
};