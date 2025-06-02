
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isWithinInterval, isSameDay, getDay } from 'date-fns';

export interface AvailabilityCheckRequest {
  tutorId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  studentIds?: number[];
  excludeLessonId?: string; // For editing existing lessons
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  conflicts: AvailabilityConflict[];
  suggestions?: string[];
}

export interface AvailabilityConflict {
  type: 'tutor_availability' | 'lesson_conflict' | 'time_off' | 'student_conflict';
  message: string;
  details?: any;
}

// Helper function to get day of week (0 = Sunday, 1 = Monday, etc.)
const getDayName = (dayNumber: number): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayNumber];
};

// Helper function to check if time is within availability slot
const isTimeWithinSlot = (
  checkTime: Date,
  availabilityStart: string,
  availabilityEnd: string
): boolean => {
  const checkHours = checkTime.getHours();
  const checkMinutes = checkTime.getMinutes();
  const checkTotalMinutes = checkHours * 60 + checkMinutes;

  const [startHours, startMinutes] = availabilityStart.split(':').map(Number);
  const startTotalMinutes = startHours * 60 + startMinutes;

  const [endHours, endMinutes] = availabilityEnd.split(':').map(Number);
  const endTotalMinutes = endHours * 60 + endMinutes;

  return checkTotalMinutes >= startTotalMinutes && checkTotalMinutes < endTotalMinutes;
};

export const checkTutorAvailability = async (
  tutorId: string,
  startTime: string,
  endTime: string
): Promise<AvailabilityConflict[]> => {
  const conflicts: AvailabilityConflict[] = [];

  try {
    const startDate = parseISO(startTime);
    const endDate = parseISO(endTime);
    const dayOfWeek = getDayName(getDay(startDate));

    // Get tutor's weekly availability
    const { data: availability, error } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('day_of_week', dayOfWeek);

    if (error) throw error;

    if (!availability || availability.length === 0) {
      conflicts.push({
        type: 'tutor_availability',
        message: `Tutor is not available on ${dayOfWeek}s`,
        details: { dayOfWeek }
      });
      return conflicts;
    }

    // Check if the requested time falls within any availability slot
    const isWithinAvailability = availability.some(slot => {
      const startWithinSlot = isTimeWithinSlot(startDate, slot.start_time, slot.end_time);
      const endWithinSlot = isTimeWithinSlot(endDate, slot.start_time, slot.end_time);
      return startWithinSlot && endWithinSlot;
    });

    if (!isWithinAvailability) {
      const availableSlots = availability.map(slot => 
        `${slot.start_time} - ${slot.end_time}`
      ).join(', ');
      
      conflicts.push({
        type: 'tutor_availability',
        message: `Requested time is outside tutor's availability. Available slots on ${dayOfWeek}s: ${availableSlots}`,
        details: { dayOfWeek, availableSlots: availability }
      });
    }
  } catch (error) {
    console.error('Error checking tutor availability:', error);
    conflicts.push({
      type: 'tutor_availability',
      message: 'Error checking tutor availability',
      details: { error }
    });
  }

  return conflicts;
};

export const checkCalendarConflicts = async (
  tutorId: string,
  startTime: string,
  endTime: string,
  excludeLessonId?: string
): Promise<AvailabilityConflict[]> => {
  const conflicts: AvailabilityConflict[] = [];

  try {
    let query = supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        status
      `)
      .eq('tutor_id', tutorId)
      .in('status', ['scheduled', 'in_progress'])
      .gte('end_time', startTime)
      .lte('start_time', endTime);

    if (excludeLessonId) {
      query = query.neq('id', excludeLessonId);
    }

    const { data: conflictingLessons, error } = await query;

    if (error) throw error;

    if (conflictingLessons && conflictingLessons.length > 0) {
      conflictingLessons.forEach(lesson => {
        conflicts.push({
          type: 'lesson_conflict',
          message: `Conflicts with existing lesson: "${lesson.title}" (${format(parseISO(lesson.start_time), 'h:mm a')} - ${format(parseISO(lesson.end_time), 'h:mm a')})`,
          details: { lesson }
        });
      });
    }
  } catch (error) {
    console.error('Error checking calendar conflicts:', error);
    conflicts.push({
      type: 'lesson_conflict',
      message: 'Error checking calendar conflicts',
      details: { error }
    });
  }

  return conflicts;
};

export const checkTimeOffConflicts = async (
  tutorId: string,
  startTime: string,
  endTime: string
): Promise<AvailabilityConflict[]> => {
  const conflicts: AvailabilityConflict[] = [];

  try {
    const { data: timeOffRequests, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('status', 'approved')
      .lte('start_date', endTime)
      .gte('end_date', startTime);

    if (error) throw error;

    if (timeOffRequests && timeOffRequests.length > 0) {
      timeOffRequests.forEach(timeOff => {
        conflicts.push({
          type: 'time_off',
          message: `Conflicts with approved time off: ${format(parseISO(timeOff.start_date), 'MMM d')} - ${format(parseISO(timeOff.end_date), 'MMM d, yyyy')} (${timeOff.reason})`,
          details: { timeOff }
        });
      });
    }
  } catch (error) {
    console.error('Error checking time off conflicts:', error);
    conflicts.push({
      type: 'time_off',
      message: 'Error checking time off conflicts',
      details: { error }
    });
  }

  return conflicts;
};

export const checkStudentConflicts = async (
  studentIds: number[],
  startTime: string,
  endTime: string,
  excludeLessonId?: string
): Promise<AvailabilityConflict[]> => {
  const conflicts: AvailabilityConflict[] = [];

  if (!studentIds || studentIds.length === 0) {
    return conflicts;
  }

  try {
    let query = supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        lesson_students!inner(
          student:students(id, first_name, last_name)
        )
      `)
      .in('status', ['scheduled', 'in_progress'])
      .gte('end_time', startTime)
      .lte('start_time', endTime);

    if (excludeLessonId) {
      query = query.neq('id', excludeLessonId);
    }

    const { data: conflictingLessons, error } = await query;

    if (error) throw error;

    if (conflictingLessons && conflictingLessons.length > 0) {
      conflictingLessons.forEach(lesson => {
        const conflictingStudents = lesson.lesson_students
          .filter((ls: any) => studentIds.includes(ls.student.id))
          .map((ls: any) => `${ls.student.first_name} ${ls.student.last_name}`);

        if (conflictingStudents.length > 0) {
          conflicts.push({
            type: 'student_conflict',
            message: `Student conflict: ${conflictingStudents.join(', ')} already has lesson "${lesson.title}" (${format(parseISO(lesson.start_time), 'h:mm a')} - ${format(parseISO(lesson.end_time), 'h:mm a')})`,
            details: { lesson, conflictingStudents }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error checking student conflicts:', error);
    conflicts.push({
      type: 'student_conflict',
      message: 'Error checking student conflicts',
      details: { error }
    });
  }

  return conflicts;
};

export const performFullAvailabilityCheck = async (
  request: AvailabilityCheckRequest
): Promise<AvailabilityCheckResult> => {
  const allConflicts: AvailabilityConflict[] = [];

  // Run all checks in parallel for better performance
  const [
    tutorAvailabilityConflicts,
    calendarConflicts,
    timeOffConflicts,
    studentConflicts
  ] = await Promise.all([
    checkTutorAvailability(request.tutorId, request.startTime, request.endTime),
    checkCalendarConflicts(request.tutorId, request.startTime, request.endTime, request.excludeLessonId),
    checkTimeOffConflicts(request.tutorId, request.startTime, request.endTime),
    request.studentIds ? checkStudentConflicts(request.studentIds, request.startTime, request.endTime, request.excludeLessonId) : []
  ]);

  allConflicts.push(
    ...tutorAvailabilityConflicts,
    ...calendarConflicts,
    ...timeOffConflicts,
    ...studentConflicts
  );

  return {
    isAvailable: allConflicts.length === 0,
    conflicts: allConflicts,
    suggestions: generateSuggestions(allConflicts)
  };
};

const generateSuggestions = (conflicts: AvailabilityConflict[]): string[] => {
  const suggestions: string[] = [];

  if (conflicts.some(c => c.type === 'tutor_availability')) {
    suggestions.push('Check the tutor\'s availability schedule and select a time within their available hours');
  }

  if (conflicts.some(c => c.type === 'lesson_conflict')) {
    suggestions.push('Choose a different time slot or consider rescheduling the conflicting lesson');
  }

  if (conflicts.some(c => c.type === 'time_off')) {
    suggestions.push('Select a date when the tutor is not on approved time off');
  }

  if (conflicts.some(c => c.type === 'student_conflict')) {
    suggestions.push('Choose a different time or remove conflicting students from this lesson');
  }

  if (suggestions.length === 0 && conflicts.length > 0) {
    suggestions.push('Please resolve the conflicts above before scheduling this lesson');
  }

  return suggestions;
};
