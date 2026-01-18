import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { checkCalendarConflicts, findAlternativeTutors } from './availabilityCheckService';
import { createGoogleMeetForLesson } from '@/services/googleCalendarService';

export interface TimeOffConflict {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  students: Array<{ id: number; first_name: string; last_name: string }>;
  subject?: string;
  lesson_type?: string;
}

export interface ConflictResolution {
  lessonId: string;
  action: 'reassign' | 'reschedule' | 'cancel';
  newTutorId?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
}

export interface TimeOffConflictResult {
  hasConflicts: boolean;
  conflicts: TimeOffConflict[];
  canApprove: boolean;
}

export const checkTimeOffConflicts = async (
  tutorId: string,
  startDate: string,
  endDate: string
): Promise<TimeOffConflictResult> => {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Find all scheduled lessons for this tutor within the time off period
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        start_time,
        end_time,
        subject,
        lesson_type,
        lesson_students!inner(
          student:students!inner(
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('tutor_id', tutorId)
      .eq('status', 'scheduled')
      .gte('start_time', startDate)
      .lte('end_time', endDate);

    if (lessonsError) {
      console.error('Error fetching lessons for conflict check:', lessonsError);
      throw lessonsError;
    }

    const conflicts: TimeOffConflict[] = [];

    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        const lessonStart = parseISO(lesson.start_time);
        const lessonEnd = parseISO(lesson.end_time);

        // Check if lesson overlaps with time off period
        if (
          isWithinInterval(lessonStart, { start, end }) ||
          isWithinInterval(lessonEnd, { start, end }) ||
          (lessonStart <= start && lessonEnd >= end)
        ) {
          const students = lesson.lesson_students.map((ls: any) => ({
            id: ls.student.id,
            first_name: ls.student.first_name,
            last_name: ls.student.last_name
          }));

          conflicts.push({
            id: lesson.id,
            title: lesson.title,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            students,
            subject: lesson.subject,
            lesson_type: lesson.lesson_type
          });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      canApprove: conflicts.length === 0
    };
  } catch (error) {
    console.error('Error checking time off conflicts:', error);
    throw error;
  }
};

export const getAlternativeTutorsForLesson = async (
  lessonId: string,
  excludeTutorId: string
) => {
  try {
    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('start_time, end_time, subject')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      throw lessonError || new Error('Lesson not found');
    }

    // Find alternative tutors using existing service
    const alternatives = await findAlternativeTutors(
      excludeTutorId,
      lesson.start_time,
      lesson.end_time
    );

    return alternatives;
  } catch (error) {
    console.error('Error finding alternative tutors:', error);
    throw error;
  }
};

/**
 * Regenerate Google Meet link for a lesson when tutor changes
 */
const regenerateGoogleMeetLink = async (lessonId: string) => {
  try {
    console.log('Regenerating Google Meet link for reassigned lesson:', lessonId);
    
    // Clear existing Meet link so a new one is created with new tutor as attendee
    const { error: clearError } = await supabase
      .from('lessons')
      .update({
        google_event_id: null,
        video_conference_link: null
      })
      .eq('id', lessonId);
    
    if (clearError) {
      console.error('Error clearing old Meet link:', clearError);
    }
    
    // Create new Google Calendar event with Meet link (new tutor will be attendee)
    const result = await createGoogleMeetForLesson(lessonId);
    
    if (!result.success) {
      console.error('Failed to regenerate Google Meet:', result.error);
      return null;
    }
    
    console.log('✅ Google Meet link regenerated for reassigned lesson:', result.meetLink);
    return result;
  } catch (error) {
    console.error('Error in regenerateGoogleMeetLink:', error);
    return null;
  }
};

export const reassignLesson = async (
  lessonId: string,
  newTutorId: string,
  reason: string,
  adminUserId: string
): Promise<void> => {
  try {
    // Get original lesson details to check if tutor actually changed
    const { data: originalLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('tutor_id')
      .eq('id', lessonId)
      .single();

    if (fetchError || !originalLesson) {
      throw new Error('Failed to fetch original lesson details');
    }

    const tutorChanged = originalLesson.tutor_id !== newTutorId;

    // Update lesson with new tutor
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        tutor_id: newTutorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (updateError) {
      throw updateError;
    }

    // Regenerate Google Meet link if tutor changed (new tutor needs to be attendee)
    if (tutorChanged) {
      console.log('Tutor changed, regenerating Google Meet link for new tutor');
      const meetResult = await regenerateGoogleMeetLink(lessonId);
      if (!meetResult) {
        console.warn('Failed to regenerate Meet link for lesson after tutor change - video may not work properly');
        // Don't throw error here as the lesson reassignment itself was successful
      }
    }

    // Log the reassignment
    console.log(`Lesson ${lessonId} reassigned to tutor ${newTutorId} by admin ${adminUserId}. Reason: ${reason}`);
    
  } catch (error) {
    console.error('Error reassigning lesson:', error);
    throw error;
  }
};

export const cancelLesson = async (
  lessonId: string,
  reason: string,
  adminUserId: string
): Promise<void> => {
  try {
    // Update lesson status to cancelled
    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Lesson ${lessonId} cancelled by admin ${adminUserId}. Reason: ${reason}`);
    
    // TODO: Send notifications to affected parties
    
  } catch (error) {
    console.error('Error cancelling lesson:', error);
    throw error;
  }
};

export const resolveAllConflicts = async (
  resolutions: ConflictResolution[],
  adminUserId: string
): Promise<void> => {
  try {
    for (const resolution of resolutions) {
      switch (resolution.action) {
        case 'reassign':
          if (resolution.newTutorId) {
            await reassignLesson(
              resolution.lessonId,
              resolution.newTutorId,
              resolution.reason || 'Time off conflict resolution',
              adminUserId
            );
          }
          break;
        case 'cancel':
          await cancelLesson(
            resolution.lessonId,
            resolution.reason || 'Time off conflict resolution',
            adminUserId
          );
          break;
        // TODO: Implement reschedule functionality if needed
        case 'reschedule':
          console.log('Reschedule functionality not implemented yet');
          break;
      }
    }
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    throw error;
  }
};