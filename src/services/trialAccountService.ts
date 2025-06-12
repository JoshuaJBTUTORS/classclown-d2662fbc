
import { supabase } from '@/integrations/supabase/client';

interface TrialBookingData {
  parent_name: string;
  child_name: string;
  email: string;
  phone?: string;
}

interface TrialAccountResult {
  studentId: number;
  success: boolean;
  error?: string;
}

export const createTrialStudent = async (bookingData: TrialBookingData): Promise<TrialAccountResult> => {
  try {
    console.log('Creating trial student for:', bookingData);
    
    // Split child name properly
    const childNameParts = bookingData.child_name.trim().split(' ');
    const childFirstName = childNameParts[0] || bookingData.child_name;
    const childLastName = childNameParts.slice(1).join(' ') || '';
    
    console.log('Creating standalone trial student');
    
    // Create standalone trial student (similar to AddStudentForm.tsx)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        first_name: childFirstName,
        last_name: childLastName,
        email: bookingData.email, // Use contact email
        phone: bookingData.phone || null,
        parent_id: null, // Standalone student - no parent
        account_type: 'trial',
        trial_status: 'pending',
        status: 'active'
      })
      .select()
      .single();

    if (studentError) {
      console.error('Trial student creation error:', studentError);
      throw new Error(`Failed to create trial student: ${studentError.message}`);
    }

    console.log('Trial student created successfully:', studentData);

    return {
      studentId: studentData.id,
      success: true
    };
  } catch (error) {
    console.error('Error creating trial student:', error);
    return {
      studentId: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
