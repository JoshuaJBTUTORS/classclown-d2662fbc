
// This file is deprecated and should not be used.
// Import the Supabase client from @/integrations/supabase/client instead.

import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // We now use the auto-generated client which is always configured
};

// Re-export the client from the integrations folder
export const supabase = supabaseClient;
