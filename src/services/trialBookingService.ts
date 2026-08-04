
import { supabase } from '@/integrations/supabase/client';
import { format, subMinutes } from 'date-fns';

interface CreateTrialBookingData {
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  preferred_date: string;
  preferred_time: string; // Display time (demo session time)
  lesson_time?: string; // Actual lesson time
  subject_id: string;
  message?: string;
  booking_source?: string;
  is_unique_booking?: boolean;
  referral_code?: string;
}

interface TrialBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

export const createTrialBooking = async (data: CreateTrialBookingData): Promise<TrialBookingResult> => {
  try {
    console.log('Creating trial booking with data:', data);
    
    const { data: bookingData, error } = await supabase
      .from('trial_bookings')
      .insert({
        parent_name: data.parent_name,
        child_name: data.child_name,
        email: data.email,
        phone: data.phone,
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time, // Demo session time (displayed)
        lesson_time: data.lesson_time, // Actual lesson time
        subject_id: data.subject_id,
        message: data.message,
        booking_source: data.booking_source || 'general',
        is_unique_booking: data.is_unique_booking ?? true,
        referral_code: data.referral_code || null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating trial booking:', error);
      throw new Error(`Failed to create trial booking: ${error.message}`);
    }

    console.log('Trial booking created successfully:', bookingData);

    // Attribute the booking to a referrer when a referral code was used
    if (data.referral_code) {
      try {
        await supabase.functions.invoke('link-trial-referral', {
          body: {
            referralCode: data.referral_code,
            trialBookingId: bookingData.id,
            friendName: data.parent_name,
            friendEmail: data.email,
            friendPhone: data.phone || '',
            childName: data.child_name,
          },
        });
      } catch (referralError) {
        console.error('Failed to link trial referral:', referralError);
      }
    }



    // Fetch subject name for emails
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', data.subject_id)
      .single();

    const subjectName = subjectData?.name || 'Unknown Subject';
    const formattedDate = format(new Date(data.preferred_date), 'EEEE, MMMM do, yyyy');
    
    // Use preferred_time as the demo start time (time shown to clients)
    const formattedDemoTime = data.preferred_time;

    // HubSpot integration for direct bookings (not Musa)
    if (!data.booking_source || data.booking_source !== 'musa') {
      try {
        console.log('Calling HubSpot integration for trial booking...');
        const hubspotResult = await supabase.functions.invoke('hubspot-trial-integration', {
          body: {
            email: data.email,
            parentName: data.parent_name,
            childName: data.child_name,
            subject: subjectName,
            preferredDate: formattedDate,
            preferredTime: formattedDemoTime
          }
        });
        
        if (hubspotResult.error) {
          console.error('HubSpot integration failed:', hubspotResult.error);
        } else {
          console.log('HubSpot integration completed:', hubspotResult.data);
        }
      } catch (hubspotError) {
        console.error('HubSpot integration error:', hubspotError);
        // Don't fail the booking if HubSpot integration fails
      }
    }

    // Send confirmation email to parent (don't fail if email fails)
    try {
      await supabase.functions.invoke('send-trial-booking-confirmation', {
        body: {
          parentName: data.parent_name,
          childName: data.child_name,
          email: data.email,
          phone: data.phone,
          subject: subjectName,
          preferredDate: formattedDate,
          preferredTime: formattedDemoTime, // Send demo start time
          message: data.message,
        }
      });
      console.log('Trial booking confirmation email sent');
    } catch (emailError) {
      console.error('Failed to send trial booking confirmation email:', emailError);
      // Don't fail the booking creation if email fails
    }

    // Send sales notification email (don't fail if email fails)
    try {
      await supabase.functions.invoke('send-trial-sales-notification', {
        body: {
          parentName: data.parent_name,
          childName: data.child_name,
          email: data.email,
          phone: data.phone,
          subject: subjectName,
          preferredDate: formattedDate,
          preferredTime: formattedDemoTime, // Send demo start time
          message: data.message,
          bookingId: bookingData.id,
        }
      });
      console.log('Trial sales notification email sent');
    } catch (emailError) {
      console.error('Failed to send trial sales notification email:', emailError);
      // Don't fail the booking creation if email fails
    }

    return {
      success: true,
      bookingId: bookingData.id
    };
  } catch (error) {
    console.error('Error creating trial booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// =====================
// Review Room bookings
// =====================

export interface ReviewRoomSession {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  subject: string;    // Display name
  subjectId: string;
}

export interface ReviewRoomContact {
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  exam_board_level?: string;
}

interface CreateReviewRoomBookingsArgs {
  sessions: ReviewRoomSession[];
  contact: ReviewRoomContact;
}

interface ReviewRoomResult {
  success: boolean;
  bookingIds?: string[];
  error?: string;
}

export const createReviewRoomBookings = async (
  args: CreateReviewRoomBookingsArgs
): Promise<ReviewRoomResult> => {
  const { sessions, contact } = args;

  if (!sessions || sessions.length === 0) {
    return { success: false, error: 'No sessions selected' };
  }

  try {
    const examBoardNote = contact.exam_board_level?.trim()
      ? `Exam board / tier: ${contact.exam_board_level.trim()}`
      : undefined;

    // Insert one row per session
    const rows = sessions.map((s) => ({
      parent_name: contact.parent_name,
      child_name: contact.child_name,
      email: contact.email,
      phone: contact.phone,
      preferred_date: s.date,
      preferred_time: s.time,
      subject_id: s.subjectId,
      booking_source: 'review_room',
      is_unique_booking: true,
      status: 'pending',
      message: examBoardNote,
    }));

    const { data: inserted, error } = await supabase
      .from('trial_bookings')
      .insert(rows)
      .select('id, preferred_date, preferred_time, subject_id');

    if (error) {
      console.error('Error inserting review room bookings:', error);
      throw new Error(error.message);
    }

    const bookingIds = (inserted || []).map((r) => r.id);

    // Build a sessions summary for the combined parent confirmation
    const sortedSessions = [...sessions].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
    const sessionsForEmail = sortedSessions.map((s) => ({
      date: format(new Date(s.date), 'EEEE, MMMM do, yyyy'),
      time: s.time,
      subject: s.subject,
    }));

    // Send ONE combined confirmation to parent
    try {
      await supabase.functions.invoke('send-trial-booking-confirmation', {
        body: {
          parentName: contact.parent_name,
          childName: contact.child_name,
          email: contact.email,
          phone: contact.phone,
          subject: 'Review Room',
          preferredDate: sessionsForEmail[0]?.date || '',
          preferredTime: sessionsForEmail[0]?.time || '',
          bookingType: 'review_room',
          sessions: sessionsForEmail,
          examBoardLevel: contact.exam_board_level?.trim() || undefined,
        },
      });
    } catch (emailError) {
      console.error('Failed to send review room confirmation email:', emailError);
    }

    // Send ONE sales notification per session
    for (let i = 0; i < sortedSessions.length; i++) {
      const s = sortedSessions[i];
      const bookingId = bookingIds[i] ?? bookingIds[0] ?? 'unknown';
      try {
        await supabase.functions.invoke('send-trial-sales-notification', {
          body: {
            parentName: contact.parent_name,
            childName: contact.child_name,
            email: contact.email,
            phone: contact.phone,
            subject: s.subject,
            preferredDate: format(new Date(s.date), 'EEEE, MMMM do, yyyy'),
            preferredTime: s.time,
            bookingId,
            bookingType: 'review_room',
            examBoardLevel: contact.exam_board_level?.trim() || undefined,
            message: examBoardNote,
          },
        });
      } catch (emailError) {
        console.error('Failed to send review room sales notification:', emailError);
      }
    }

    return { success: true, bookingIds };
  } catch (err) {
    console.error('createReviewRoomBookings failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};
