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

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Initialize regular client to verify the calling user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the calling user is authenticated and has admin/owner role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user has admin or owner role
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError || !userRoles?.some(r => ['admin', 'owner'].includes(r.role))) {
      console.error('Role verification failed:', roleError);
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

    // Check if email already exists in parents table
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
      password: 'TempPass123!', // Temporary password - parent will need to reset
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