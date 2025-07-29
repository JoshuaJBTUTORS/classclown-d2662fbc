import { supabase } from '@/integrations/supabase/client';

export const createAdminAccounts = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-admin-accounts');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating admin accounts:', error);
    throw error;
  }
};