
import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes } from 'date-fns';

interface CreateTrialLessonData {
  bookingId: string;
  tutorId: string;
  studentId: number;
  preferredDate: string;
  preferredTime: string;
  subjectId?: string;
  approvedBy: string;
}

interface TrialLessonResult {
  lessonId: string;
  success: boolean;
  error?: string;
}

export const createTrialLesson = async (data: CreateTrialLessonData): Promise<TrialLessonResult> => {
  try {
    // Combine date and time
    const startDateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);
    const endDateTime = addMinutes(startDateTime, 60); // Default 1 hour duration

    // Create the trial lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: 'Trial Lesson',
        description: 'Trial lesson for new student',
        tutor_id: data.tutorId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_group: false,
        status: 'scheduled',
        lesson_type: 'trial',
        trial_booking_id: data.bookingId,
        subject: data.subjectId || null
      })
      .select()
      .single();

    if (lessonError) throw lessonError;

    // Link student to lesson
    const { error: linkError } = await supabase
      .from('lesson_students')
      .insert({
        lesson_id: lessonData.id,
        student_id: data.studentId
      });

    if (linkError) throw linkError;

    // Update trial booking with lesson and approval details
    const { error: updateError } = await supabase
      .from('trial_bookings')
      .update({
        lesson_id: lessonData.id,
        assigned_tutor_id: data.tutorId,
        approved_by: data.approvedBy,
        approved_at: new Date().toISOString(),
        status: 'approved'
      })
      .eq('id', data.bookingId);

    if (updateError) throw updateError;

    console.log('Trial lesson created:', lessonData);

    return {
      lessonId: lessonData.id,
      success: true
    };
  } catch (error) {
    console.error('Error creating trial lesson:', error);
    return {
      lessonId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
