
import { supabase } from '@/integrations/supabase/client';
import { addMinutes } from 'date-fns';

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
    console.log('Creating trial lesson with data:', data);
    
    // Combine date and time
    const startDateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);
    const endDateTime = addMinutes(startDateTime, 60); // Default 1 hour duration

    console.log('Lesson times:', { startDateTime, endDateTime });

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

    if (lessonError) {
      console.error('Lesson creation error:', lessonError);
      throw new Error(`Failed to create lesson: ${lessonError.message}`);
    }

    console.log('Lesson created successfully:', lessonData);

    // Link student to lesson
    const { error: linkError } = await supabase
      .from('lesson_students')
      .insert({
        lesson_id: lessonData.id,
        student_id: data.studentId
      });

    if (linkError) {
      console.error('Student linking error:', linkError);
      // Clean up lesson if linking fails
      await supabase.from('lessons').delete().eq('id', lessonData.id);
      throw new Error(`Failed to link student to lesson: ${linkError.message}`);
    }

    console.log('Student linked to lesson successfully');

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

    if (updateError) {
      console.error('Booking update error:', updateError);
      // Don't throw here as the lesson was created successfully
      console.warn('Lesson created but booking status update failed:', updateError.message);
    }

    console.log('Trial lesson creation completed successfully');

    return {
      lessonId: lessonData.id,
      success: true
    };
  } catch (error) {
    console.error('Error creating trial lesson:', error);
    return {
      lessonId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
