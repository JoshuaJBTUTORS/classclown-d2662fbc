
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const studentDataService = {
  /**
   * Ensures student record has proper user_id linkage
   * This helps prevent calendar access issues
   */
  async ensureStudentUserIdLink(studentEmail: string): Promise<boolean> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        console.log('No authenticated user found');
        return false;
      }

      // Check if student record exists and has user_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, user_id, first_name, last_name, email')
        .eq('email', studentEmail)
        .maybeSingle();

      if (studentError) {
        console.error('Error checking student record:', studentError);
        return false;
      }

      if (!studentData) {
        console.log('Student record not found for:', studentEmail);
        return false;
      }

      // Update user_id if missing
      if (!studentData.user_id) {
        console.log('Updating student user_id for:', studentEmail);
        
        const { error: updateError } = await supabase
          .from('students')
          .update({ user_id: currentUser.data.user.id })
          .eq('id', studentData.id);

        if (updateError) {
          console.error('Failed to update student user_id:', updateError);
          return false;
        }

        console.log('Successfully updated student user_id');
        return true;
      }

      console.log('Student record already has user_id');
      return true;

    } catch (error) {
      console.error('Error ensuring student user_id link:', error);
      return false;
    }
  },

  /**
   * Validates student-parent relationship
   */
  async validateStudentParentRelationship(studentId: number, parentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('parent_id')
        .eq('id', studentId)
        .eq('parent_id', parentId)
        .maybeSingle();

      if (error) {
        console.error('Error validating student-parent relationship:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error validating student-parent relationship:', error);
      return false;
    }
  },

  /**
   * Gets student data with enhanced error handling
   */
  async getStudentByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student by email:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getStudentByEmail:', error);
      throw error;
    }
  }
};
