
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface TrialBookingData {
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
}

interface TrialAccountResult {
  parentId: string;
  studentId: number;
  success: boolean;
  error?: string;
}

export const createTrialAccounts = async (bookingData: TrialBookingData): Promise<TrialAccountResult> => {
  try {
    // Create parent account (trial placeholder)
    const parentId = uuidv4();
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .insert({
        id: parentId,
        user_id: parentId, // Use same ID since no auth user exists
        first_name: bookingData.parent_name.split(' ')[0] || bookingData.parent_name,
        last_name: bookingData.parent_name.split(' ').slice(1).join(' ') || '',
        email: bookingData.email,
        phone: bookingData.phone,
        account_type: 'trial'
      })
      .select()
      .single();

    if (parentError) throw parentError;

    // Create student account (trial placeholder)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        first_name: bookingData.child_name.split(' ')[0] || bookingData.child_name,
        last_name: bookingData.child_name.split(' ').slice(1).join(' ') || '',
        email: bookingData.email, // Use parent email for trial
        phone: bookingData.phone,
        parent_id: parentId,
        account_type: 'trial',
        trial_status: 'pending',
        status: 'trial'
      })
      .select()
      .single();

    if (studentError) throw studentError;

    console.log('Trial accounts created:', { parentData, studentData });

    return {
      parentId,
      studentId: studentData.id,
      success: true
    };
  } catch (error) {
    console.error('Error creating trial accounts:', error);
    return {
      parentId: '',
      studentId: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
