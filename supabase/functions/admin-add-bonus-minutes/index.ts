import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin/owner
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner']);

    if (!userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, minutes } = await req.json();

    if (!email || !minutes || minutes <= 0) {
      return new Response(
        JSON.stringify({ error: 'Email and positive minutes value required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to find user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const foundUser = targetUser.users.find(u => u.email === email);
    
    if (!foundUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has a quota entry
    const { data: existingQuota, error: quotaCheckError } = await supabase
      .from('voice_session_quotas')
      .select('*')
      .eq('user_id', foundUser.id)
      .maybeSingle();

    if (quotaCheckError) {
      console.error('Error checking quota:', quotaCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check quota' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    if (existingQuota) {
      // Update existing quota
      const { data: updatedQuota, error: updateError } = await supabase
        .from('voice_session_quotas')
        .update({
          bonus_minutes: (existingQuota.bonus_minutes || 0) + minutes,
          minutes_remaining: (existingQuota.minutes_remaining || 0) + minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', foundUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating quota:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update quota' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = updatedQuota;
    } else {
      // Create new quota entry with bonus minutes
      const { data: newQuota, error: insertError } = await supabase
        .from('voice_session_quotas')
        .insert({
          user_id: foundUser.id,
          total_minutes_allowed: 0,
          minutes_remaining: minutes,
          bonus_minutes: minutes,
          minutes_used: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating quota:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create quota' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = newQuota;
    }

    console.log(`✅ Added ${minutes} bonus minutes to ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Added ${minutes} minutes to ${email}`,
        quota: result,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-add-bonus-minutes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
