
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { addMinutes, subMinutes } from 'date-fns';


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
    
    // Get trial booking details to access both demo and lesson times
    const { data: trialBooking, error: bookingError } = await supabase
      .from('trial_bookings')
      .select('*')
      .eq('id', data.bookingId)
      .single();

    if (bookingError || !trialBooking) {
      throw new Error('Failed to fetch trial booking details');
    }

    // Create student record if studentId is not provided
    let studentId = data.studentId;
    if (!studentId) {
      console.log('Creating student record from trial booking data');
      
      // Split child name into first and last name
      const childNameParts = trialBooking.child_name.trim().split(' ');
      const childFirstName = childNameParts[0] || trialBooking.child_name;
      const childLastName = childNameParts.slice(1).join(' ') || '';
      
      // Create standalone trial student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: childFirstName,
          last_name: childLastName,
          email: trialBooking.email,
          phone: trialBooking.phone || null,
          parent_id: null, // Standalone student - no parent
          account_type: 'trial',
          trial_status: 'pending',
          status: 'trial'
        })
        .select()
        .single();

      if (studentError) {
        console.error('Student creation error:', studentError);
        throw new Error(`Failed to create student: ${studentError.message}`);
      }

      studentId = studentData.id;
      console.log('Student created successfully:', studentData);
    }

    // Use preferred_time as the demo start time (displayed to clients)
    const demoStartDateTime = new Date(`${trialBooking.preferred_date}T${trialBooking.preferred_time}`);
    const demoEndDateTime = addMinutes(demoStartDateTime, 15); // 15-minute demo
    
    // Lesson starts 15 minutes after demo start (i.e., when demo ends)
    const lessonStartDateTime = demoEndDateTime;
    const lessonEndDateTime = addMinutes(lessonStartDateTime, 30); // 30-minute lesson

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
      .eq('id', studentId)
      .single();

    const studentName = studentData ? `${studentData.first_name} ${studentData.last_name}` : trialBooking.child_name;
    const title = `Trial ${subjectName} for ${studentName}`;

    console.log('Creating lesson with title:', title);

    // Create the trial lesson
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: title,
        description: `Trial lesson for ${studentName}`,
        tutor_id: data.tutorId,
        start_time: demoStartDateTime.toISOString(),
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
        student_id: studentId
      });

    if (linkError) {
      console.error('Student linking error:', linkError);
      // Clean up lesson if linking fails
      await supabase.from('lessons').delete().eq('id', lessonData.id);
      throw new Error(`Failed to link student to lesson: ${linkError.message}`);
    }

    console.log('Student linked to lesson successfully');


    // Create LessonSpace room using same function as regular lessons
    let lessonSpaceRoomId = null;
    try {
      console.log('Creating LessonSpace room for trial lesson');
      const { data: roomData, error: roomError } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lessonData.id,
          title: title,
          startTime: demoStartDateTime.toISOString(),
          duration: 45
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

    // Send trial lesson approval email to parent (don't fail if email fails)
    if (trialBooking && lessonSpaceRoomId) {
      try {
        const studentLessonLink = `https://www.thelessonspace.com/space/${lessonSpaceRoomId}`;
        const formattedDate = format(demoStartDateTime, 'EEEE, MMMM do, yyyy');
        const formattedTime = format(demoStartDateTime, 'h:mm a');

        console.log('Sending trial lesson approval email with link:', studentLessonLink);

        await supabase.functions.invoke('send-trial-lesson-approval', {
          body: {
            parentName: trialBooking.parent_name,
            childName: trialBooking.child_name,
            email: trialBooking.email,
            phone: trialBooking.phone,
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
        hasBookingData: !!trialBooking,
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
