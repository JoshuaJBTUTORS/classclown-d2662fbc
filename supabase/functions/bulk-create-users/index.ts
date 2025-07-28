import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string;
  role: 'parent' | 'student';
  metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface BulkCreateUsersRequest {
  users: CreateUserRequest[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the request is from an authenticated admin/owner
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin/owner role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin/owner role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !userRoles?.some(r => ['admin', 'owner'].includes(r.role))) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { users }: BulkCreateUsersRequest = await req.json();
    
    if (!users || !Array.isArray(users)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: users array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating ${users.length} user accounts...`);

    const results = [];
    const errors = [];
    const defaultPassword = 'jbtutors123!';

    for (const userData of users) {
      try {
        // Create user with admin.createUser to avoid email confirmation
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: defaultPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: userData.metadata || {}
        });

        if (createError) {
          console.error(`Failed to create user ${userData.email}:`, createError);
          errors.push({
            email: userData.email,
            error: createError.message
          });
          continue;
        }

        if (!authUser.user) {
          console.error(`No user returned for ${userData.email}`);
          errors.push({
            email: userData.email,
            error: 'No user returned from creation'
          });
          continue;
        }

        // Assign role to the user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: userData.role,
            is_primary: true
          });

        if (roleError) {
          console.error(`Failed to assign role for ${userData.email}:`, roleError);
          // Don't fail the whole operation for role assignment errors
        }

        results.push({
          email: userData.email,
          user_id: authUser.user.id,
          role: userData.role
        });

        console.log(`Successfully created user: ${userData.email}`);
      } catch (error) {
        console.error(`Unexpected error creating user ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: error.message || 'Unexpected error'
        });
      }
    }

    console.log(`Bulk user creation completed. Success: ${results.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        created_users: results,
        errors: errors,
        total_created: results.length,
        total_errors: errors.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Bulk create users error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});