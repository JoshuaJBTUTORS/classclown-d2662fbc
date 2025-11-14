import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

interface UserWithAccess {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  has_cleo_hub_access: boolean;
}

const HubAccessManagement = () => {
  const { isAdmin, isOwner, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Fetch all users with their access status
  const { data: users, isLoading, error: queryError } = useQuery({
    queryKey: ['hub-access-users'],
    queryFn: async () => {
      try {
        // Get profiles - use raw select to bypass TypeScript types
        const { data: rawData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        if (!rawData || rawData.length === 0) {
          return [];
        }

        // Cast to include the new field
        const profiles = rawData as Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          has_cleo_hub_access?: boolean;
        }>;

        // Get user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .eq('is_primary', true);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }

        // Build users with access info
        const usersWithAccess: UserWithAccess[] = await Promise.all(
          profiles.map(async (profile) => {
            // Get email from auth
            let email = 'No email';
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
              email = authUser?.user?.email || 'No email';
            } catch (err) {
              console.error('Error fetching user email:', err);
            }

            const userRole = roles?.find((r) => r.user_id === profile.id);
            
            return {
              id: profile.id,
              email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: userRole?.role || 'none',
              has_cleo_hub_access: profile.has_cleo_hub_access || false,
            };
          })
        );

        return usersWithAccess;
      } catch (err) {
        console.error('Error in hub-access query:', err);
        throw err;
      }
    },
    enabled: isAdmin || isOwner,
  });

  // Toggle hub access mutation - use direct update instead of RPC until types refresh
  const toggleAccessMutation = useMutation({
    mutationFn: async ({ userId, enable }: { userId: string; enable: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ has_cleo_hub_access: enable } as any)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hub-access-users'] });
      toast({
        title: 'Success',
        description: `Cleo hub access ${variables.enable ? 'enabled' : 'disabled'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update hub access',
        variant: 'destructive',
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isOwner) {
    return <Navigate to="/unauthorized" replace />;
  }

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const handleToggle = (userId: string, currentAccess: boolean) => {
    toggleAccessMutation.mutate({ userId, enable: !currentAccess });
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
      case 'learning_hub_only':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cleo Hub Access Management</h1>
              <p className="text-muted-foreground mt-2">
                Control which users have access to the new Cleo learning hub
              </p>
            </div>

            {/* Search and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Search Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Access Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Users:</span>
                      <span className="font-semibold">{users?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">With Access:</span>
                      <span className="font-semibold text-green-600">
                        {users?.filter((u) => u.has_cleo_hub_access).length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  {filteredUsers?.length || 0} user{filteredUsers?.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : queryError ? (
                  <div className="text-center py-12">
                    <p className="text-destructive">Error loading users: {(queryError as any)?.message}</p>
                    <p className="text-sm text-muted-foreground mt-2">Check console for details</p>
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-foreground truncate">
                                {user.first_name && user.last_name
                                  ? `${user.first_name} ${user.last_name}`
                                  : 'No name set'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="shrink-0">
                              {user.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <div className="flex items-center gap-2">
                            {user.has_cleo_hub_access ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                              {user.has_cleo_hub_access ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <Switch
                            checked={user.has_cleo_hub_access}
                            onCheckedChange={() => handleToggle(user.id, user.has_cleo_hub_access)}
                            disabled={toggleAccessMutation.isPending || user.role === 'learning_hub_only'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No users found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">ℹ️ How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • <strong>Learning Hub Only</strong> users always have access (toggle is disabled)
                </p>
                <p>
                  • Users with access enabled will be redirected to <strong>/learning-hub</strong>
                </p>
                <p>
                  • Users without access will be redirected to <strong>/calendar</strong>
                </p>
                <p>• Changes take effect immediately on next login or page refresh</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HubAccessManagement;
