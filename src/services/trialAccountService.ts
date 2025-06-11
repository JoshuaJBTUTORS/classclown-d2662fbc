
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
    console.log('Creating trial accounts for:', bookingData);
    
    // Create parent account (trial placeholder)
    const parentId = uuidv4();
    
    // Split names properly
    const parentNameParts = bookingData.parent_name.trim().split(' ');
    const parentFirstName = parentNameParts[0] || bookingData.parent_name;
    const parentLastName = parentNameParts.slice(1).join(' ') || '';
    
    const childNameParts = bookingData.child_name.trim().split(' ');
    const childFirstName = childNameParts[0] || bookingData.child_name;
    const childLastName = childNameParts.slice(1).join(' ') || '';
    
    console.log('Creating parent with ID:', parentId);
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .insert({
        id: parentId,
        user_id: parentId, // Use same ID since no auth user exists
        first_name: parentFirstName,
        last_name: parentLastName,
        email: bookingData.email,
        phone: bookingData.phone || null,
        account_type: 'trial'
      })
      .select()
      .single();

    if (parentError) {
      console.error('Parent creation error:', parentError);
      throw new Error(`Failed to create parent account: ${parentError.message}`);
    }

    console.log('Parent created successfully:', parentData);

    // Create student account (trial placeholder)
    console.log('Creating student with parent_id:', parentId);
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        first_name: childFirstName,
        last_name: childLastName,
        email: bookingData.email, // Use parent email for trial
        phone: bookingData.phone || null,
        parent_id: parentId,
        account_type: 'trial',
        trial_status: 'pending',
        status: 'active'
      })
      .select()
      .single();

    if (studentError) {
      console.error('Student creation error:', studentError);
      // Try to clean up parent if student creation fails
      await supabase.from('parents').delete().eq('id', parentId);
      throw new Error(`Failed to create student account: ${studentError.message}`);
    }

    console.log('Student created successfully:', studentData);
    console.log('Trial accounts created successfully:', { parentData, studentData });

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
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
