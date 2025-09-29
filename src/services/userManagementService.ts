import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export const fetchUsersByType = async (userType: string): Promise<User[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-list-users', {
      body: { userType }
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch users');
    }

    if (!data?.users) {
      return [];
    }

    return data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-change-password', {
      body: {
        userId,
        newPassword
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to reset password');
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Password reset failed');
    }
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};