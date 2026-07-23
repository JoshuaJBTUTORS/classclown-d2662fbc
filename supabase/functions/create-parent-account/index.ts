import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== BACKEND AUTH DEBUG ===');
  console.log('🔍 Incoming request headers:', {
    authorization: req.headers.get('Authorization') ? 'EXISTS' : 'MISSING',
    authLength: req.headers.get('Authorization')?.length || 0,
    contentType: req.headers.get('Content-Type'),
    userAgent: req.headers.get('User-Agent'),
    origin: req.headers.get('Origin')
  });

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasAnonKey: !!anonKey
    });

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl ?? '', serviceRoleKey ?? '');

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Authorization header details:', {
      exists: !!authHeader,
      startsWithBearer: authHeader?.startsWith('Bearer '),
      length: authHeader?.length || 0
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🏗️ Supabase admin client initialized, attempting to verify JWT token...');
    
    // Extract JWT token and verify using service role client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    console.log('👤 Auth.getUser() result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasAuthError: !!authError,
      authErrorMessage: authError?.message,
      authErrorName: authError?.name,
      authErrorStatus: authError?.status,
      fullAuthError: authError
    });

    if (authError || !user) {
      console.error('❌ Authentication failed:', {
        error: authError,
        hasUser: !!user,
        errorDetails: {
          message: authError?.message,
          name: authError?.name,
          status: authError?.status,
          code: authError?.code
        }
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'No user found') }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated successfully, checking roles...');
    
    // Check if user has admin or owner role using service role client
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('🔍 Role check result:', {
      hasRoleError: !!roleError,
      roleError: roleError?.message,
      userRoles: userRoles,
      hasAdminRole: userRoles?.some(r => r.role === 'admin'),
      hasOwnerRole: userRoles?.some(r => r.role === 'owner'),
      isAuthorized: userRoles?.some(r => ['admin', 'owner'].includes(r.role))
    });

    if (roleError || !userRoles?.some(r => ['admin', 'owner'].includes(r.role))) {
      console.error('❌ Role verification failed:', {
        roleError,
        userRoles,
        userId: user.id
      });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      billing_address, 
      emergency_contact_name, 
      emergency_contact_phone 
    } = await req.json();

    console.log('Creating parent account for email:', email);

    // STEP 0: Auth-only cleanup. If an auth user already exists for this email,
    // delete it directly and let ON DELETE CASCADE clean up profiles / parents / user_roles.
    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existingAuthUserIds: string[] = [];
      let page = 1;
      const perPage = 1000;

      while (page <= 100) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });
        if (listError) {
          console.error('Error listing auth users for orphan check:', listError);
          break;
        }
        const matches = (listData?.users || []).filter(
          (u: any) => (u.email || '').trim().toLowerCase() === normalizedEmail
        );
        existingAuthUserIds.push(...matches.map((m: any) => m.id));
        if (!listData?.users || listData.users.length < perPage) break;
        page++;
      }

      console.log('🧹 Pre-create auth cleanup:', {
        email: normalizedEmail,
        matchingAuthUsers: existingAuthUserIds.length,
        authUserIds: existingAuthUserIds,
      });

      for (const existingId of existingAuthUserIds) {
        const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(existingId);
        if (deleteAuthUserError) {
          console.error('Failed to delete existing auth user:', deleteAuthUserError);
          return new Response(
            JSON.stringify({
              error: 'Failed to clean up existing auth account: ' + deleteAuthUserError.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('✅ Existing auth user deleted (cascade handles the rest):', existingId);
      }
    } catch (cleanupError) {
      console.error('Unexpected error during auth cleanup:', cleanupError);
      return new Response(
        JSON.stringify({ error: 'Failed to clean up existing account before retry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Check if email already exists in parents table (safety net)
    const { data: existingParent, error: parentCheckError } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (parentCheckError) {
      console.error('Error checking parent email:', parentCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate parent email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (existingParent) {
      return new Response(
        JSON.stringify({ error: 'A parent account with this email already exists' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find matching trial students with this email
    const { data: trialStudents, error: trialError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name')
      .eq('email', email)
      .is('parent_id', null);

    if (trialError) {
      console.error('Error finding trial students:', trialError);
    }

    // Create the auth user with admin client
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'classbeyond123!', // Default password - parent can change later
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        role: 'parent'
      }
    });

    if (authCreateError || !authData.user) {
      console.error('Error creating auth user:', authCreateError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user account: ' + authCreateError?.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Create parent profile
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from('parents')
      .insert({
        user_id: authData.user.id,
        first_name,
        last_name,
        email,
        phone,
        billing_address,
        emergency_contact_name,
        emergency_contact_phone
      })
      .select()
      .single();

    if (parentError || !parentData) {
      console.error('Error creating parent profile:', parentError);
      // Clean up auth user if parent creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create parent profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Parent profile created:', parentData.id);

    // Link trial students to the new parent
    let linkedStudents = 0;
    if (trialStudents && trialStudents.length > 0) {
      const { error: linkError } = await supabaseAdmin
        .from('students')
        .update({ parent_id: parentData.id })
        .in('id', trialStudents.map(s => s.id));

      if (linkError) {
        console.error('Error linking trial students:', linkError);
      } else {
        linkedStudents = trialStudents.length;
        console.log(`Linked ${linkedStudents} trial students to parent`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        parent: parentData,
        linkedStudents: linkedStudents,
        message: linkedStudents > 0 
          ? `Parent account created successfully and ${linkedStudents} trial student(s) linked.`
          : 'Parent account created successfully.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-parent-account:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});