import { supabase } from '@/integrations/supabase/client';

interface UniquenessResult {
  isUnique: boolean;
  existingRecords: {
    students: any[];
    parents: any[];
  };
}

interface ParentUniquenessResult {
  isUnique: boolean;
  existingParents: any[];
  matchingTrialStudents?: any[];
}

export const checkEmailPhoneUniqueness = async (email: string, phone?: string): Promise<UniquenessResult> => {
  try {
    const result: UniquenessResult = {
      isUnique: true,
      existingRecords: {
        students: [],
        parents: []
      }
    };

    // Check students table
    const studentQueries = [];
    
    // Check by email
    if (email) {
      studentQueries.push(
        supabase
          .from('students')
          .select('id, first_name, last_name, email, phone')
          .eq('email', email.toLowerCase())
      );
    }

    // Check by phone if provided
    if (phone) {
      studentQueries.push(
        supabase
          .from('students')
          .select('id, first_name, last_name, email, phone')
          .eq('phone', phone)
      );
    }

    // Execute student queries
    const studentResults = await Promise.all(studentQueries);
    const studentMatches = studentResults.flatMap(result => result.data || []);
    result.existingRecords.students = studentMatches;

    // Check parents table
    const parentQueries = [];
    
    // Check by email
    if (email) {
      parentQueries.push(
        supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .eq('email', email.toLowerCase())
      );
    }

    // Check by phone if provided
    if (phone) {
      parentQueries.push(
        supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .eq('phone', phone)
      );
    }

    // Execute parent queries
    const parentResults = await Promise.all(parentQueries);
    const parentMatches = parentResults.flatMap(result => result.data || []);
    result.existingRecords.parents = parentMatches;

    // Determine if unique (no matches found)
    result.isUnique = studentMatches.length === 0 && parentMatches.length === 0;

    return result;
  } catch (error) {
    console.error('Error checking uniqueness:', error);
    return {
      isUnique: true, // Default to unique on error to allow booking
      existingRecords: {
        students: [],
        parents: []
      }
    };
  }
};

// Check uniqueness for parent-only account creation (allows same email as trial students)
export const checkParentEmailUniqueness = async (email: string, phone?: string): Promise<ParentUniquenessResult> => {
  try {
    const result: ParentUniquenessResult = {
      isUnique: true,
      existingParents: [],
      matchingTrialStudents: []
    };

    // Check parents table only
    const parentQueries = [];
    
    // Check by email
    if (email) {
      parentQueries.push(
        supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .eq('email', email.toLowerCase())
      );
    }

    // Check by phone if provided
    if (phone) {
      parentQueries.push(
        supabase
          .from('parents')
          .select('id, first_name, last_name, email, phone')
          .eq('phone', phone)
      );
    }

    // Execute parent queries
    const parentResults = await Promise.all(parentQueries);
    const parentMatches = parentResults.flatMap(result => result.data || []);
    result.existingParents = parentMatches;

    // Check for matching trial students (for potential linking)
    if (email) {
      const { data: trialStudents } = await supabase
        .from('students')
        .select('id, first_name, last_name, email, account_type, status')
        .eq('email', email.toLowerCase())
        .in('status', ['trial', 'active']);
      
      result.matchingTrialStudents = trialStudents || [];
    }

    // Only consider parent conflicts, not student conflicts
    result.isUnique = parentMatches.length === 0;

    return result;
  } catch (error) {
    console.error('Error checking parent uniqueness:', error);  
    return {
      isUnique: true, // Default to unique on error to allow creation
      existingParents: [],
      matchingTrialStudents: []
    };
  }
};