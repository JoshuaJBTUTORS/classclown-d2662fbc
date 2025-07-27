
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CreateTrialBookingData {
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
  preferred_date: string;
  preferred_time: string;
  subject_id: string;
  message?: string;
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
        preferred_time: data.preferred_time,
        subject_id: data.subject_id,
        message: data.message,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating trial booking:', error);
      throw new Error(`Failed to create trial booking: ${error.message}`);
    }

    console.log('Trial booking created successfully:', bookingData);

    // Fetch subject name for emails
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', data.subject_id)
      .single();

    const subjectName = subjectData?.name || 'Unknown Subject';
    const formattedDate = format(new Date(data.preferred_date), 'EEEE, MMMM do, yyyy');

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
          preferredTime: data.preferred_time,
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
          preferredTime: data.preferred_time,
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
