
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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

    // Fetch subject name from subject_id
    let subjectName = 'Unknown Subject';
    if (data.subjectId) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', data.subjectId)
        .single();
      
      subjectName = subjectData?.name || 'Unknown Subject';
    }

    // Get student name for title
    const { data: studentData } = await supabase
      .from('students')
      .select('first_name, last_name')
      .eq('id', data.studentId)
      .single();

    const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : 'Unknown Student';
    const title = `Trial ${subjectName} for ${studentName}`;

    console.log('Creating lesson with title:', title);

    // Create the trial lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: title,
        description: `Trial lesson for ${studentName}`,
        tutor_id: data.tutorId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_group: false,
        status: 'scheduled',
        lesson_type: 'trial',
        trial_booking_id: data.bookingId,
        subject: subjectName
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

    // Create LessonSpace room using same function as regular lessons
    let lessonSpaceId = null;
    try {
      console.log('Creating LessonSpace room for trial lesson');
      const { data: roomData, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lessonData.id,
          title: title,
          startTime: startDateTime.toISOString(),
          duration: 60
        }
      });

      if (roomError) {
        console.error('Room creation failed:', roomError);
        // Don't fail lesson creation if room creation fails
      } else {
        console.log('LessonSpace room created successfully:', roomData);
        // Extract space_id from room creation response
        lessonSpaceId = roomData?.lesson_space_space_id;
        console.log('Extracted lesson space ID:', lessonSpaceId);
      }
    } catch (roomError) {
      console.error('Room creation error:', roomError);
      // Don't fail lesson creation if room creation fails
    }

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

    // Fetch trial booking details for parent email
    const { data: bookingData } = await supabase
      .from('trial_bookings')
      .select('parent_name, child_name, email')
      .eq('id', data.bookingId)
      .single();

    // Send trial lesson approval email to parent (don't fail if email fails)
    if (bookingData && lessonSpaceId) {
      try {
        const studentLessonLink = `https://www.thelessonspace.com/space/${lessonSpaceId}`;
        const formattedDate = format(startDateTime, 'EEEE, MMMM do, yyyy');
        const formattedTime = format(startDateTime, 'h:mm a');

        console.log('Sending trial lesson approval email with link:', studentLessonLink);

        await supabase.functions.invoke('send-trial-lesson-approval', {
          body: {
            parentName: bookingData.parent_name,
            childName: bookingData.child_name,
            email: bookingData.email,
            subject: subjectName,
            lessonDate: formattedDate,
            lessonTime: formattedTime,
            studentLessonLink: studentLessonLink,
          }
        });
        console.log('Trial lesson approval email sent successfully');
      } catch (emailError) {
        console.error('Failed to send trial lesson approval email:', emailError);
        // Don't fail the lesson creation if email fails
      }
    } else {
      console.warn('Trial lesson approval email not sent - missing booking data or lesson space ID:', {
        hasBookingData: !!bookingData,
        lessonSpaceId: lessonSpaceId
      });
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
