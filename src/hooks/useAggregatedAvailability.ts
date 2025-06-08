
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isBefore, parseISO } from 'date-fns';

interface AggregatedTimeSlot {
  time: string;
  datetime: Date;
  available: boolean;
  tutorCount: number;
  availableTutorIds: string[];
}

interface AvailabilitySlot {
  day_of_week: string;
  start_time: string;
  end_time: string;
  tutor_id: string;
}

export const useAggregatedAvailability = (subjectId?: string, selectedDate?: string) => {
  const [slots, setSlots] = useState<AggregatedTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchAggregatedAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const date = new Date(selectedDate);
        const dayName = format(date, 'EEEE').toLowerCase();

        // First, get tutor IDs that teach the subject
        const { data: tutorSubjects, error: tutorSubjectsError } = await supabase
          .from('tutor_subjects')
          .select('tutor_id')
          .eq('subject_id', subjectId);

        if (tutorSubjectsError) throw tutorSubjectsError;

        if (!tutorSubjects || tutorSubjects.length === 0) {
          setSlots([]);
          return;
        }

        const tutorIds = tutorSubjects.map(ts => ts.tutor_id);

        // Get all tutors who teach the subject and their availability
        const { data: availableTutors, error: tutorsError } = await supabase
          .from('tutors')
          .select(`
            id,
            tutor_availability!inner(day_of_week, start_time, end_time)
          `)
          .eq('status', 'active')
          .eq('tutor_availability.day_of_week', dayName)
          .in('id', tutorIds);

        if (tutorsError) throw tutorsError;

        if (!availableTutors || availableTutors.length === 0) {
          setSlots([]);
          return;
        }

        // Get existing lessons for all tutors on the selected date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingLessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('tutor_id, start_time, end_time')
          .in('tutor_id', tutorIds)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())
          .in('status', ['scheduled', 'in_progress']);

        if (lessonsError) throw lessonsError;

        // Create a map to track time slots and which tutors are available
        const timeSlotMap = new Map<string, { tutorIds: string[], datetime: Date }>();

        // Process each tutor's availability
        availableTutors.forEach((tutor) => {
          tutor.tutor_availability.forEach((avail: AvailabilitySlot) => {
            const [startHour, startMinute] = avail.start_time.split(':').map(Number);
            const [endHour, endMinute] = avail.end_time.split(':').map(Number);
            
            const startDateTime = new Date(date);
            startDateTime.setHours(startHour, startMinute, 0, 0);
            
            const endDateTime = new Date(date);
            endDateTime.setHours(endHour, endMinute, 0, 0);
            
            let currentSlot = new Date(startDateTime);
            
            while (isBefore(currentSlot, endDateTime)) {
              const slotEnd = addMinutes(currentSlot, 30);
              const timeKey = format(currentSlot, 'HH:mm');
              
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
                if (!timeSlotMap.has(timeKey)) {
                  timeSlotMap.set(timeKey, { tutorIds: [], datetime: new Date(currentSlot) });
                }
                timeSlotMap.get(timeKey)!.tutorIds.push(tutor.id);
              }
              
              currentSlot = addMinutes(currentSlot, 30);
            }
          });
        });

        // Convert map to array of aggregated slots
        const aggregatedSlots: AggregatedTimeSlot[] = Array.from(timeSlotMap.entries())
          .map(([time, { tutorIds, datetime }]) => ({
            time,
            datetime,
            available: tutorIds.length > 0,
            tutorCount: tutorIds.length,
            availableTutorIds: tutorIds
          }))
          .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

        setSlots(aggregatedSlots);
      } catch (err) {
        console.error('Error fetching aggregated availability:', err);
        setError('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAggregatedAvailability();
  }, [subjectId, selectedDate]);

  return { slots, isLoading, error };
};
