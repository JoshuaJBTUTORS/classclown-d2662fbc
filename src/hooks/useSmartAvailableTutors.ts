import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { performFullAvailabilityCheck } from '@/services/availabilityCheckService';
import { createUKDateTime, convertUKToUTC } from '@/utils/timezone';

interface SmartTutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  rating?: number;
  specialities?: string[];
  availability_status: 'available' | 'busy' | 'time_off' | 'no_availability' | 'checking';
  conflicts?: string[];
  next_available_slot?: string;
}

export const useSmartAvailableTutors = (
  subjectId?: string, 
  preferredDate?: string, 
  preferredTime?: string
) => {
  const [tutors, setTutors] = useState<SmartTutor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId || !preferredDate || !preferredTime) {
      setTutors([]);
      return;
    }

    const fetchSmartAvailableTutors = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First, get all tutors who teach this subject and are active
        const { data: tutorData, error: tutorError } = await supabase
          .from('tutors')
          .select(`
            id,
            first_name,
            last_name,
            email,
            bio,
            rating,
            specialities,
            tutor_subjects!inner(subject_id)
          `)
          .eq('status', 'active')
          .eq('tutor_subjects.subject_id', subjectId);

        if (tutorError) throw tutorError;

        if (!tutorData || tutorData.length === 0) {
          setTutors([]);
          return;
        }

        // Create the lesson date/time for availability checking
        // Only check tutor availability for the trial lesson portion (30 mins)
        // The demo session (first 15 mins) is conducted by the Account Manager
        const lessonDate = new Date(preferredDate);
        const ukDateTime = createUKDateTime(lessonDate, preferredTime);
        // Add 15 minutes to skip the demo session and check only the trial lesson
        const trialLessonStartTime = new Date(ukDateTime.getTime() + 15 * 60 * 1000);
        const utcStartTime = convertUKToUTC(trialLessonStartTime);
        const utcEndTime = new Date(utcStartTime.getTime() + 30 * 60 * 1000); // 30 minute trial lesson

        // Check availability for each tutor
        const tutorsWithAvailability = await Promise.all(
          tutorData.map(async (tutor) => {
            const smartTutor: SmartTutor = {
              ...tutor,
              availability_status: 'checking'
            };

            try {
              // Use the availability check service
              const availabilityResult = await performFullAvailabilityCheck({
                tutorId: tutor.id,
                startTime: utcStartTime.toISOString(),
                endTime: utcEndTime.toISOString(),
                studentIds: [] // No specific students for trial bookings
              });

              if (availabilityResult.isAvailable) {
                smartTutor.availability_status = 'available';
              } else {
                // Determine the primary reason for unavailability
                const conflicts = availabilityResult.conflicts;
                if (conflicts.some(c => c.type === 'tutor_availability')) {
                  smartTutor.availability_status = 'no_availability';
                } else if (conflicts.some(c => c.type === 'time_off')) {
                  smartTutor.availability_status = 'time_off';
                } else if (conflicts.some(c => c.type === 'lesson_conflict')) {
                  smartTutor.availability_status = 'busy';
                } else {
                  smartTutor.availability_status = 'busy';
                }
                
                smartTutor.conflicts = conflicts.map(c => c.message);

                // If there are alternative tutors suggested, find next available slot
                if (availabilityResult.alternativeTutors.some(alt => alt.id === tutor.id)) {
                  const alternative = availabilityResult.alternativeTutors.find(alt => alt.id === tutor.id);
                  if (alternative && alternative.availableSlots.length > 0) {
                    smartTutor.next_available_slot = alternative.availableSlots[0];
                  }
                }
              }
            } catch (err) {
              console.error(`Error checking availability for tutor ${tutor.id}:`, err);
              smartTutor.availability_status = 'busy'; // Default to busy if check fails
              smartTutor.conflicts = ['Unable to verify availability'];
            }

            return smartTutor;
          })
        );

        // Sort by availability status: available first, then others
        const sortedTutors = tutorsWithAvailability.sort((a, b) => {
          const statusOrder = { available: 0, busy: 1, time_off: 2, no_availability: 3, checking: 4 };
          return statusOrder[a.availability_status] - statusOrder[b.availability_status];
        });

        setTutors(sortedTutors);
      } catch (err) {
        console.error('Error fetching smart available tutors:', err);
        setError('Failed to load available tutors');
        setTutors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmartAvailableTutors();
  }, [subjectId, preferredDate, preferredTime]);

  return { tutors, isLoading, error };
};