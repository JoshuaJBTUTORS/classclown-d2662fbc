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
    switch (userType) {
      case 'tutors':
        const { data: tutors, error: tutorsError } = await supabase
          .from('tutors')
          .select('id, email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (tutorsError) throw tutorsError;
        
        // Get auth users to map to correct user IDs
        const { data: authData } = await supabase.auth.admin.listUsers();
        
        return tutors?.map(tutor => {
          const authUser = authData?.users.find((u: any) => u.email === tutor.email);
          return { 
            ...tutor, 
            id: authUser?.id || '', 
            role: 'tutor' 
          };
        }).filter(tutor => tutor.id) || [];

      case 'parents':
        const { data: parents, error: parentsError } = await supabase
          .from('parents')
          .select('id, email, first_name, last_name')
          .order('last_name', { ascending: true });
        
        if (parentsError) throw parentsError;
        
        // Get auth users to map to correct user IDs
        const { data: authDataParents } = await supabase.auth.admin.listUsers();
        
        return parents?.map(parent => {
          const authUser = authDataParents?.users.find((u: any) => u.email === parent.email);
          return { 
            ...parent, 
            id: authUser?.id || '', 
            role: 'parent' 
          };
        }).filter(parent => parent.id) || [];

      case 'students':
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (studentsError) throw studentsError;
        
        // Get auth users to map to correct user IDs
        const { data: authDataStudents } = await supabase.auth.admin.listUsers();
        
        return students?.map(student => {
          const authUser = authDataStudents?.users.find((u: any) => u.email === student.email);
          return { 
            ...student, 
            id: authUser?.id || '', 
            role: 'student' 
          };
        }).filter(student => student.id) || [];

      case 'admins':
        const { data: adminRoles, error: adminError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['admin', 'owner']);
        
        if (adminError) throw adminError;
        
        if (!adminRoles || adminRoles.length === 0) return [];

        // Get user emails from auth.users
        const { data: authDataAdmins, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Get profiles separately
        const userIds = adminRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;

        const adminUsers: User[] = [];
        
        for (const roleData of adminRoles) {
          const authUser = authDataAdmins.users.find((u: any) => u.id === roleData.user_id);
          const profile = profiles?.find((p: any) => p.id === roleData.user_id);
          
          if (authUser?.email) {
            adminUsers.push({
              id: roleData.user_id,
              email: authUser.email,
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              role: roleData.role
            });
          }
        }

        return adminUsers.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

      default:
        return [];
    }
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

export const resetUserPasswordByEmail = async (email: string, newPassword: string): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-change-password', {
      body: {
        email,
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