import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';

export type SlotAvailability = 'available' | 'unavailable' | 'booked';

interface AvailabilityResult {
  [tutorId: string]: {
    [slotKey: string]: SlotAvailability;
  };
}

interface TutorAvailabilitySlot {
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface ExistingLesson {
  start_time: string;
  end_time: string;
  tutor_id: string;
}

interface TimeOffRequest {
  start_date: string;
  end_date: string;
  tutor_id: string;
}

export const useTutorSlotAvailability = (
  tutors: Array<{ id: string }>,
  timeSlots: Array<{ time: string; date: Date; key: string }>,
  viewType: 'teacherWeek' | 'teacherDay'
) => {
  const [availability, setAvailability] = useState<AvailabilityResult>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tutors.length || !timeSlots.length) {
      setAvailability({});
      return;
    }

    const fetchAvailability = async () => {
      setIsLoading(true);
      
      try {
        const tutorIds = tutors.map(t => t.id);
        
        // Get date range for queries
        const dates = timeSlots.map(slot => slot.date);
        const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Fetch tutor availability schedules
        const { data: tutorAvailability, error: availabilityError } = await supabase
          .from('tutor_availability')
          .select('tutor_id, day_of_week, start_time, end_time')
          .in('tutor_id', tutorIds);

        if (availabilityError) throw availabilityError;

        // Fetch existing lessons in the date range
        const { data: existingLessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('tutor_id, start_time, end_time')
          .in('tutor_id', tutorIds)
          .gte('start_time', startOfDay(startDate).toISOString())
          .lte('start_time', endOfDay(endDate).toISOString())
          .in('status', ['scheduled', 'in_progress']);

        if (lessonsError) throw lessonsError;

        // Fetch time off requests in the date range
        const { data: timeOffRequests, error: timeOffError } = await supabase
          .from('time_off_requests')
          .select('tutor_id, start_date, end_date')
          .in('tutor_id', tutorIds)
          .eq('status', 'approved')
          .lte('start_date', endOfDay(endDate).toISOString())
          .gte('end_date', startOfDay(startDate).toISOString());

        if (timeOffError) throw timeOffError;

        // Process availability for each tutor and slot
        const result: AvailabilityResult = {};

        tutors.forEach(tutor => {
          result[tutor.id] = {};
          
          // Get tutor's availability schedule
          const tutorSchedule = (tutorAvailability || []).filter(
            (avail: TutorAvailabilitySlot & { tutor_id: string }) => avail.tutor_id === tutor.id
          );

          // Get tutor's existing lessons
          const tutorLessons = (existingLessons || []).filter(
            (lesson: ExistingLesson) => lesson.tutor_id === tutor.id
          );

          // Get tutor's time off requests
          const tutorTimeOff = (timeOffRequests || []).filter(
            (request: TimeOffRequest & { tutor_id: string }) => request.tutor_id === tutor.id
          );

          timeSlots.forEach(slot => {
            const dayName = format(slot.date, 'EEEE').toLowerCase();
            
            // Check if tutor has availability for this day of week
            const daySchedule = tutorSchedule.filter(
              (sched: TutorAvailabilitySlot) => sched.day_of_week === dayName
            );

            if (daySchedule.length === 0) {
              result[tutor.id][slot.key] = 'unavailable';
              return;
            }

            // Check if slot time is within tutor's available hours
            let isWithinSchedule = false;
            
            if (viewType === 'teacherDay') {
              // For day view, check specific hour
              const slotHour = parseInt(slot.time.split(':')[0]);
              const slotMinute = parseInt(slot.time.split(':')[1] || '0');
              
              isWithinSchedule = daySchedule.some(sched => {
                const [startHour, startMinute] = sched.start_time.split(':').map(Number);
                const [endHour, endMinute] = sched.end_time.split(':').map(Number);
                
                const slotTimeMinutes = slotHour * 60 + slotMinute;
                const startTimeMinutes = startHour * 60 + startMinute;
                const endTimeMinutes = endHour * 60 + endMinute;
                
                return slotTimeMinutes >= startTimeMinutes && slotTimeMinutes < endTimeMinutes;
              });
            } else {
              // For week view, assume available if has any schedule for the day
              isWithinSchedule = true;
            }

            if (!isWithinSchedule) {
              result[tutor.id][slot.key] = 'unavailable';
              return;
            }

            // Check for time off conflicts
            const hasTimeOff = tutorTimeOff.some(request => {
              const requestStart = startOfDay(new Date(request.start_date));
              const requestEnd = endOfDay(new Date(request.end_date));
              return isWithinInterval(slot.date, { start: requestStart, end: requestEnd });
            });

            if (hasTimeOff) {
              result[tutor.id][slot.key] = 'unavailable';
              return;
            }

            // Check for existing lesson conflicts
            const hasLessonConflict = tutorLessons.some(lesson => {
              const lessonStart = parseISO(lesson.start_time);
              const lessonEnd = parseISO(lesson.end_time);
              
              if (viewType === 'teacherDay') {
                // For day view, check specific hour overlaps
                const slotHour = parseInt(slot.time.split(':')[0]);
                const slotDateTime = new Date(slot.date);
                slotDateTime.setHours(slotHour, 0, 0, 0);
                const slotEndDateTime = new Date(slotDateTime);
                slotEndDateTime.setHours(slotHour + 1, 0, 0, 0);
                
                return (
                  (slotDateTime >= lessonStart && slotDateTime < lessonEnd) ||
                  (slotEndDateTime > lessonStart && slotEndDateTime <= lessonEnd) ||
                  (slotDateTime <= lessonStart && slotEndDateTime >= lessonEnd)
                );
              } else {
                // For week view, check if any lesson exists on this day
                return (
                  lessonStart >= startOfDay(slot.date) && 
                  lessonStart < endOfDay(slot.date)
                );
              }
            });

            if (hasLessonConflict) {
              result[tutor.id][slot.key] = 'booked';
            } else {
              result[tutor.id][slot.key] = 'available';
            }
          });
        });

        setAvailability(result);
      } catch (error) {
        console.error('Error fetching tutor availability:', error);
        // Set all slots as unavailable on error
        const result: AvailabilityResult = {};
        tutors.forEach(tutor => {
          result[tutor.id] = {};
          timeSlots.forEach(slot => {
            result[tutor.id][slot.key] = 'unavailable';
          });
        });
        setAvailability(result);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [tutors, timeSlots, viewType]);

  return { availability, isLoading };
};