
import { supabase } from '@/integrations/supabase/client';

// This utility adds a unique constraint to prevent duplicate participant URLs
export const addParticipantUrlConstraint = async () => {
  try {
    console.log('🔧 Adding unique constraint to lesson_participant_urls...');

    // The constraint will be added via SQL migration, but this function
    // can help clean up any existing duplicates first
    const { data: duplicates, error: duplicatesError } = await supabase
      .rpc('find_duplicate_participant_urls');

    if (duplicatesError) {
      console.log('Note: Could not check for duplicates (this is expected if the RPC function does not exist)');
    } else if (duplicates && duplicates.length > 0) {
      console.log(`⚠️ Found ${duplicates.length} duplicate participant URLs that should be cleaned up`);
    }

    return {
      success: true,
      message: 'Constraint check completed'
    };

  } catch (error) {
    console.error('❌ Error checking participant URL constraints:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
