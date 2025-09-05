import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, isBefore } from 'date-fns';
import { performFullAvailabilityCheck } from '@/services/availabilityCheckService';
import { createUKDateTime, convertUKToUTC } from '@/utils/timezone';

interface AggregatedTimeSlot {
  time: string; // Display time (15 minutes earlier)
  datetime: Date; // Display datetime (15 minutes earlier)
  lessonTime: string; // Actual lesson time
  lessonDatetime: Date; // Actual lesson datetime
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

export const useEnhancedAggregatedAvailability = (subjectId?: string, selectedDate?: string) => {
  const [slots, setSlots] = useState<AggregatedTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !selectedDate) {
      setSlots([]);
      return;
    }

    const fetchEnhancedAggregatedAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const date = new Date(selectedDate);
        const dayName = format(date, 'EEEE').toLowerCase();

        console.log('Fetching enhanced availability for:', { subjectId, selectedDate, dayName });

        // First, get tutor IDs that teach the subject
        const { data: tutorSubjects, error: tutorSubjectsError } = await supabase
          .from('tutor_subjects')
          .select('tutor_id')
          .eq('subject_id', subjectId);

        if (tutorSubjectsError) throw tutorSubjectsError;

        if (!tutorSubjects || tutorSubjects.length === 0) {
          console.log('No tutors found for subject:', subjectId);
          setSlots([]);
          return;
        }

        const tutorIds = tutorSubjects.map(ts => ts.tutor_id);
        console.log('Found tutors for subject:', tutorIds);

        // Get all tutors who teach the subject and their availability
        const { data: availableTutors, error: tutorsError } = await supabase
          .from('tutors')
          .select(`
            id,
            first_name,
            last_name,
            tutor_availability!inner(day_of_week, start_time, end_time)
          `)
          .eq('status', 'active')
          .ilike('tutor_availability.day_of_week', dayName)
          .in('id', tutorIds);

        if (tutorsError) throw tutorsError;

        console.log('Available tutors with availability:', availableTutors);

        if (!availableTutors || availableTutors.length === 0) {
          console.log('No tutors available on:', dayName);
          setSlots([]);
          return;
        }

        // Generate all possible time slots from tutor availability
        const allTimeSlots = new Set<string>();
        
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
              const timeKey = format(currentSlot, 'HH:mm');
              allTimeSlots.add(timeKey);
              currentSlot = addMinutes(currentSlot, 30);
            }
          });
        });

        console.log('All possible time slots:', Array.from(allTimeSlots));

        // Check availability for each time slot using enhanced availability check
        const slotAvailabilityPromises = Array.from(allTimeSlots).map(async (timeSlot) => {
          const slotDateTime = new Date(date);
          const [hour, minute] = timeSlot.split(':').map(Number);
          slotDateTime.setHours(hour, minute, 0, 0);

          // Create the lesson date/time for availability checking
          // Add 15 minutes to skip the demo session and check only the trial lesson
          const ukDateTime = createUKDateTime(new Date(selectedDate), timeSlot);
          const trialLessonStartTime = new Date(ukDateTime.getTime() + 15 * 60 * 1000);
          const utcStartTime = convertUKToUTC(trialLessonStartTime);
          const utcEndTime = new Date(utcStartTime.getTime() + 30 * 60 * 1000); // 30 minute trial lesson

          const availableTutorIds: string[] = [];

          // Check each tutor's availability for this time slot
          await Promise.all(
            tutorIds.map(async (tutorId) => {
              try {
                const availabilityResult = await performFullAvailabilityCheck({
                  tutorId,
                  startTime: utcStartTime.toISOString(),
                  endTime: utcEndTime.toISOString(),
                  studentIds: [] // No specific students for trial bookings
                });

                if (availabilityResult.isAvailable) {
                  availableTutorIds.push(tutorId);
                }
              } catch (err) {
                console.error(`Error checking availability for tutor ${tutorId} at ${timeSlot}:`, err);
                // Don't include this tutor if availability check fails
              }
            })
          );

          // Display time is 15 minutes earlier than actual lesson time
          const displayDatetime = addMinutes(slotDateTime, -15);
          const displayTime = format(displayDatetime, 'HH:mm');

          return {
            time: displayTime, // Display time (15 minutes earlier)
            datetime: displayDatetime, // Display datetime (15 minutes earlier)
            lessonTime: timeSlot, // Actual lesson time
            lessonDatetime: slotDateTime, // Actual lesson datetime
            available: availableTutorIds.length > 0,
            tutorCount: availableTutorIds.length,
            availableTutorIds
          };
        });

        const aggregatedSlots = await Promise.all(slotAvailabilityPromises);
        
        // Sort by display time
        const sortedSlots = aggregatedSlots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

        console.log('Final enhanced aggregated slots:', sortedSlots);
        setSlots(sortedSlots);
      } catch (err) {
        console.error('Error fetching enhanced aggregated availability:', err);
        setError('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedAggregatedAvailability();
  }, [subjectId, selectedDate]);

  return { slots, isLoading, error };
};