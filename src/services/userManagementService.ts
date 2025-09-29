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
        const { data: authData } = await supabase.auth.admin.listUsers();
        if (!authData) return [];

        const { data: tutors, error: tutorsError } = await supabase
          .from('tutors')
          .select('email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (tutorsError) throw tutorsError;
        
        return tutors?.map(tutor => {
          const authUser = authData.users.find((u: any) => u.email === tutor.email);
          return authUser ? {
            id: authUser.id,
            email: tutor.email,
            first_name: tutor.first_name,
            last_name: tutor.last_name,
            role: 'tutor'
          } : null;
        }).filter(Boolean) || [];

      case 'parents':
        const { data: authDataParents } = await supabase.auth.admin.listUsers();
        if (!authDataParents) return [];

        const { data: parents, error: parentsError } = await supabase
          .from('parents')
          .select('email, first_name, last_name')
          .order('last_name', { ascending: true });
        
        if (parentsError) throw parentsError;
        
        return parents?.map(parent => {
          const authUser = authDataParents.users.find((u: any) => u.email === parent.email);
          return authUser ? {
            id: authUser.id,
            email: parent.email,
            first_name: parent.first_name,
            last_name: parent.last_name,
            role: 'parent'
          } : null;
        }).filter(Boolean) || [];

      case 'students':
        const { data: authDataStudents } = await supabase.auth.admin.listUsers();
        if (!authDataStudents) return [];

        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (studentsError) throw studentsError;
        
        return students?.map(student => {
          const authUser = authDataStudents.users.find((u: any) => u.email === student.email);
          return authUser ? {
            id: authUser.id,
            email: student.email,
            first_name: student.first_name,
            last_name: student.last_name,
            role: 'student'
          } : null;
        }).filter(Boolean) || [];

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