import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

const AdminList: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      // First get user roles
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'owner']);

      if (rolesError) throw rolesError;

      if (!userRolesData || userRolesData.length === 0) {
        setAdmins([]);
        return;
      }

      // Get profiles for these users
      const userIds = userRolesData.map(item => item.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Get user emails from auth - this requires service role
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      const adminList = userRolesData.map(roleItem => {
        const profile = profilesData?.find(p => p.id === roleItem.user_id);
        const authUser = authUsers?.users?.find((u: any) => u.id === roleItem.user_id);
        
        return {
          id: roleItem.user_id,
          email: authUser?.email || 'Unknown',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          role: roleItem.role
        };
      });

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'owner') return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Administrative Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Administrative Staff</CardTitle>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No administrative staff found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {admin.first_name?.charAt(0) || admin.email?.charAt(0) || 'A'}
                      {admin.last_name?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {admin.first_name && admin.last_name 
                        ? `${admin.first_name} ${admin.last_name}`
                        : admin.email
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {admin.email}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={getRoleBadgeVariant(admin.role)}
                  className="flex items-center gap-1"
                >
                  {getRoleIcon(admin.role)}
                  {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminList;