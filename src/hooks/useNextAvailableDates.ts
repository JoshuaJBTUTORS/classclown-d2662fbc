
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isBefore, parseISO } from 'date-fns';

interface NextAvailableDate {
  date: string;
  dayName: string;
  formattedDate: string;
  tutorCount: number;
  availableSlots: number;
}

export const useNextAvailableDates = (subjectId?: string, excludeDate?: string) => {
  const [nextAvailableDates, setNextAvailableDates] = useState<NextAvailableDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!subjectId || !excludeDate) {
      setNextAvailableDates([]);
      return;
    }

    const findNextAvailableDates = async () => {
      setIsLoading(true);
      
      try {
        const today = new Date();
        const minDate = addDays(today, 1); // Tomorrow
        const maxDate = addDays(today, 7); // 7 days from today
        const excludeDateObj = new Date(excludeDate);
        
        const availableDates: NextAvailableDate[] = [];

        // Check each day from tomorrow to 7 days ahead
        for (let i = 1; i <= 7; i++) {
          const checkDate = addDays(today, i);
          const dateString = format(checkDate, 'yyyy-MM-dd');
          
          // Skip the excluded date
          if (dateString === excludeDate) continue;

          const dayName = format(checkDate, 'EEEE').toLowerCase();

          // Get tutor IDs that teach the subject
          const { data: tutorSubjects } = await supabase
            .from('tutor_subjects')
            .select('tutor_id')
            .eq('subject_id', subjectId);

          if (!tutorSubjects || tutorSubjects.length === 0) continue;

          const tutorIds = tutorSubjects.map(ts => ts.tutor_id);

          // Get tutors available on this day
          const { data: availableTutors } = await supabase
            .from('tutors')
            .select(`
              id,
              tutor_availability!inner(day_of_week, start_time, end_time)
            `)
            .eq('status', 'active')
            .ilike('tutor_availability.day_of_week', dayName)
            .in('id', tutorIds);

          if (!availableTutors || availableTutors.length === 0) continue;

          // Get existing lessons for this date
          const startOfDay = new Date(checkDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(checkDate);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: existingLessons } = await supabase
            .from('lessons')
            .select('tutor_id, start_time, end_time')
            .in('tutor_id', tutorIds)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .in('status', ['scheduled', 'in_progress']);

          // Count available slots
          let totalSlots = 0;
          const availableTutorIds = new Set();

          availableTutors.forEach((tutor) => {
            tutor.tutor_availability.forEach((avail: any) => {
              const [startHour, startMinute] = avail.start_time.split(':').map(Number);
              const [endHour, endMinute] = avail.end_time.split(':').map(Number);
              
              const startDateTime = new Date(checkDate);
              startDateTime.setHours(startHour, startMinute, 0, 0);
              
              const endDateTime = new Date(checkDate);
              endDateTime.setHours(endHour, endMinute, 0, 0);
              
              let currentSlot = new Date(startDateTime);
              
              while (isBefore(currentSlot, endDateTime)) {
                const slotEnd = addDays(currentSlot, 0);
                slotEnd.setMinutes(slotEnd.getMinutes() + 30);
                
                // Check if this tutor has a conflict at this time
                const hasConflict = existingLessons?.some(lesson => {
                  if (lesson.tutor_id !== tutor.id) return false;
                  
                  const lessonStart = parseISO(lesson.start_time);
                  const lessonEnd = parseISO(lesson.end_time);
                  
                  return (
                    (currentSlot >= lessonStart && currentSlot < lessonEnd) ||
                    (slotEnd > lessonStart && slotEnd <= lessonEnd) ||
                    (currentSlot <= lessonStart && slotEnd >= lessonEnd)
                  );
                });
                
                if (!hasConflict) {
                  totalSlots++;
                  availableTutorIds.add(tutor.id);
                }
                
                currentSlot = addDays(currentSlot, 0);
                currentSlot.setMinutes(currentSlot.getMinutes() + 30);
              }
            });
          });

          if (totalSlots > 0) {
            availableDates.push({
              date: dateString,
              dayName: format(checkDate, 'EEEE'),
              formattedDate: format(checkDate, 'MMM d'),
              tutorCount: availableTutorIds.size,
              availableSlots: totalSlots
            });
          }

          // Only get first 3 available dates
          if (availableDates.length >= 3) break;
        }

        setNextAvailableDates(availableDates);
      } catch (error) {
        console.error('Error finding next available dates:', error);
        setNextAvailableDates([]);
      } finally {
        setIsLoading(false);
      }
    };

    findNextAvailableDates();
  }, [subjectId, excludeDate]);

  return { nextAvailableDates, isLoading };
};
