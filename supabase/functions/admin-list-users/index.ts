import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userType }: UserListRequest = await req.json();

    console.log(`Admin user list request for user type: ${userType}`);

    // Use REST API directly to avoid dependency conflicts
    const baseHeaders = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };

    let users: any[] = [];

    if (userType === 'admins') {
      // Get admin roles
      const rolesResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles?role=in.(admin,owner)&select=user_id,role`, {
        headers: { ...baseHeaders, 'apikey': anonKey, 'Authorization': authHeader }
      });

      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch admin roles');
      }

      const adminRoles = await rolesResponse.json();

      if (adminRoles.length === 0) {
        users = [];
      } else {
        // Get auth users
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          headers: baseHeaders
        });

        if (!authResponse.ok) {
          throw new Error('Failed to fetch auth users');
        }

        const authData = await authResponse.json();

        // Get profiles
        const userIds = adminRoles.map((r: any) => r.user_id);
        const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,first_name,last_name`, {
          headers: { ...baseHeaders, 'apikey': anonKey, 'Authorization': authHeader }
        });

        const profiles = profilesResponse.ok ? await profilesResponse.json() : [];

        users = adminRoles.map((roleData: any) => {
          const authUser = authData.users.find((u: any) => u.id === roleData.user_id);
          const profile = profiles.find((p: any) => p.id === roleData.user_id);
          
          if (authUser?.email) {
            return {
              id: roleData.user_id,
              email: authUser.email,
              first_name: profile?.first_name || '',
              last_name: profile?.last_name || '',
              role: roleData.role
            };
          }
          return null;
        }).filter(Boolean);
      }
    } else {
      // For tutors, parents, students - get table data first
      const tableName = userType === 'tutors' ? 'tutors' : 
                       userType === 'parents' ? 'parents' : 'students';
      
      let tableQuery = `${supabaseUrl}/rest/v1/${tableName}?select=email,first_name,last_name&order=last_name.asc`;
      
      if (userType === 'tutors' || userType === 'students') {
        tableQuery += '&or=(status.eq.active,status.is.null,status.eq.)';
      }

      const tableResponse = await fetch(tableQuery, {
        headers: { ...baseHeaders, 'apikey': anonKey, 'Authorization': authHeader }
      });

      if (!tableResponse.ok) {
        throw new Error(`Failed to fetch ${tableName}`);
      }

      const tableData = await tableResponse.json();

      // Get auth users
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        headers: baseHeaders
      });

      if (!authResponse.ok) {
        throw new Error('Failed to fetch auth users');
      }

      const authData = await authResponse.json();

      // Map table data to auth users
      const roleType = userType === 'tutors' ? 'tutor' : 
                      userType === 'parents' ? 'parent' : 'student';

      users = tableData.map((item: any) => {
        const authUser = authData.users.find((u: any) => u.email === item.email);
        return authUser ? {
          id: authUser.id,
          email: item.email,
          first_name: item.first_name,
          last_name: item.last_name,
          role: roleType
        } : null;
      }).filter(Boolean);
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