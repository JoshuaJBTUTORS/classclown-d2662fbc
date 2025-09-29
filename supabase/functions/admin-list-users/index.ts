import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserListRequest {
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize client with user token for role verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            authorization: authHeader
          }
        }
      }
    );

    // Verify user has admin/owner role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner']);

    if (roleError || !userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userType }: UserListRequest = await req.json();

    console.log(`Admin user list request by: ${user.email} for user type: ${userType}`);

    let users: any[] = [];

    switch (userType) {
      case 'tutors':
        // Get auth users first
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
        if (!authData) {
          users = [];
          break;
        }

        const { data: tutors, error: tutorsError } = await supabaseClient
          .from('tutors')
          .select('email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (tutorsError) throw tutorsError;
        
        users = tutors?.map(tutor => {
          const authUser = authData.users.find((u: any) => u.email === tutor.email);
          return authUser ? {
            id: authUser.id,
            email: tutor.email,
            first_name: tutor.first_name,
            last_name: tutor.last_name,
            role: 'tutor'
          } : null;
        }).filter(Boolean) || [];
        break;

      case 'parents':
        const { data: authDataParents } = await supabaseAdmin.auth.admin.listUsers();
        if (!authDataParents) {
          users = [];
          break;
        }

        const { data: parents, error: parentsError } = await supabaseClient
          .from('parents')
          .select('email, first_name, last_name')
          .order('last_name', { ascending: true });
        
        if (parentsError) throw parentsError;
        
        users = parents?.map(parent => {
          const authUser = authDataParents.users.find((u: any) => u.email === parent.email);
          return authUser ? {
            id: authUser.id,
            email: parent.email,
            first_name: parent.first_name,
            last_name: parent.last_name,
            role: 'parent'
          } : null;
        }).filter(Boolean) || [];
        break;

      case 'students':
        const { data: authDataStudents } = await supabaseAdmin.auth.admin.listUsers();
        if (!authDataStudents) {
          users = [];
          break;
        }

        const { data: students, error: studentsError } = await supabaseClient
          .from('students')
          .select('email, first_name, last_name')
          .or('status.eq.active,status.is.null,status.eq.')
          .order('last_name', { ascending: true });
        
        if (studentsError) throw studentsError;
        
        users = students?.map(student => {
          const authUser = authDataStudents.users.find((u: any) => u.email === student.email);
          return authUser ? {
            id: authUser.id,
            email: student.email,
            first_name: student.first_name,
            last_name: student.last_name,
            role: 'student'
          } : null;
        }).filter(Boolean) || [];
        break;

      case 'admins':
        const { data: adminRoles, error: adminError } = await supabaseClient
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['admin', 'owner']);
        
        if (adminError) throw adminError;
        
        if (!adminRoles || adminRoles.length === 0) {
          users = [];
          break;
        }

        // Get user emails from auth.users
        const { data: authDataAdmins, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // Get profiles separately
        const userIds = adminRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;

        const adminUsers: any[] = [];
        
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

        users = adminUsers.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
        break;

      default:
        users = [];
    }

    return new Response(
      JSON.stringify({ users }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error listing users:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to list users' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);