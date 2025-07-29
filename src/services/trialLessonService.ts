
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { addMinutes, subMinutes } from 'date-fns';
import { createDemoSession } from './demoSessionService';

interface CreateTrialLessonData {
  bookingId: string;
  tutorId: string;
  adminId?: string;
  studentId?: number;
  studentName?: string;
  parentName?: string;
  parentEmail?: string;
  preferredDate: string;
  preferredTime: string;
  subject?: string;
  subjectId?: string;
  approvedBy?: string;
}

interface TrialLessonResult {
  lessonId: string;
  success: boolean;
  error?: string;
}

export const createTrialLesson = async (data: CreateTrialLessonData): Promise<TrialLessonResult> => {
  try {
    console.log('Creating trial lesson with data:', data);
    
    // Combine date and time - for demo session, this is the actual lesson time
    // The displayed time was already 15 minutes earlier, so this is correct
    const lessonStartDateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);
    const lessonEndDateTime = addMinutes(lessonStartDateTime, 60); // Default 1 hour duration
    
    // Demo session starts 15 minutes before the lesson
    const demoStartDateTime = subMinutes(lessonStartDateTime, 15);
    const demoEndDateTime = lessonStartDateTime; // Demo ends when lesson starts

    console.log('Demo times:', { demoStartDateTime, demoEndDateTime });
    console.log('Lesson times:', { lessonStartDateTime, lessonEndDateTime });

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
        start_time: lessonStartDateTime.toISOString(),
        end_time: lessonEndDateTime.toISOString(),
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

    // Create demo session if admin is provided
    if (data.adminId) {
      try {
        await createDemoSession({
          lessonId: lessonData.id,
          adminId: data.adminId,
          startTime: demoStartDateTime,
          endTime: demoEndDateTime
        });
        console.log('Demo session created successfully');
      } catch (demoError) {
        console.error('Demo session creation failed:', demoError);
        // Don't fail lesson creation if demo session creation fails
      }
    }

    // Create LessonSpace room using same function as regular lessons
    let lessonSpaceRoomId = null;
    try {
      console.log('Creating LessonSpace room for trial lesson');
      const { data: roomData, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lessonData.id,
          title: title,
          startTime: lessonStartDateTime.toISOString(),
          duration: 60
        }
      });

      if (roomError) {
        console.error('Room creation failed:', roomError);
        // Don't fail lesson creation if room creation fails
      } else {
        console.log('LessonSpace room created successfully:', roomData);
        // Extract room_id from room creation response
        lessonSpaceRoomId = roomData?.roomId;
        console.log('Extracted lesson space room ID:', lessonSpaceRoomId);
        console.log('Full room response:', JSON.stringify(roomData, null, 2));
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
        admin_id: data.adminId,
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
      .select('parent_name, child_name, email, phone')
      .eq('id', data.bookingId)
      .single();

    // Send trial lesson approval email to parent (don't fail if email fails)
    if (bookingData && lessonSpaceRoomId) {
      try {
        const studentLessonLink = `https://www.thelessonspace.com/space/${lessonSpaceRoomId}`;
        const formattedDate = format(lessonStartDateTime, 'EEEE, MMMM do, yyyy');
        const formattedTime = format(lessonStartDateTime, 'h:mm a');

        console.log('Sending trial lesson approval email with link:', studentLessonLink);

        await supabase.functions.invoke('send-trial-lesson-approval', {
          body: {
            parentName: bookingData.parent_name,
            childName: bookingData.child_name,
            email: bookingData.email,
            phone: bookingData.phone,
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
      console.warn('Trial lesson approval email not sent - missing booking data or lesson space room ID:', {
        hasBookingData: !!bookingData,
        lessonSpaceRoomId: lessonSpaceRoomId
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
