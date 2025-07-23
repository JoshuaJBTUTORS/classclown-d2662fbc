
import { supabase } from '@/integrations/supabase/client';

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
