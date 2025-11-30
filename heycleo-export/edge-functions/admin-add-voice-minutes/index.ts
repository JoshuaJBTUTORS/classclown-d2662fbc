import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddMinutesRequest {
  userEmail: string;
  minutesToAdd: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin/owner
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .single();

    if (!userRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, minutesToAdd }: AddMinutesRequest = await req.json();

    if (!userEmail || !minutesToAdd || minutesToAdd <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email
    const { data: targetUser, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Failed to find user: ${userError.message}`);
    }

    const foundUser = targetUser.users.find(u => u.email === userEmail);
    if (!foundUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current quota
    const now = new Date().toISOString();
    const { data: currentQuota, error: quotaError } = await supabase
      .from('voice_session_quotas')
      .select('*')
      .eq('user_id', foundUser.id)
      .lte('period_start', now)
      .gte('period_end', now)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch quota: ${quotaError.message}`);
    }

    if (currentQuota) {
      // Update existing quota - only update bonus_minutes and total_minutes_allowed
      // DO NOT update minutes_remaining to avoid double-counting (UI displays bonus + remaining)
      const { error: updateError } = await supabase
        .from('voice_session_quotas')
        .update({
          bonus_minutes: (currentQuota.bonus_minutes || 0) + minutesToAdd,
          total_minutes_allowed: (currentQuota.total_minutes_allowed || 0) + minutesToAdd,
        })
        .eq('id', currentQuota.id);

      if (updateError) {
        throw new Error(`Failed to update quota: ${updateError.message}`);
      }
    } else {
      // Create new quota
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: insertError } = await supabase
        .from('voice_session_quotas')
        .insert({
          user_id: foundUser.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          total_minutes_allowed: minutesToAdd,
          minutes_remaining: minutesToAdd,
          bonus_minutes: minutesToAdd,
          minutes_used: 0,
          total_sessions_allowed: 0,
          sessions_remaining: 0,
          bonus_sessions: 0,
        });

      if (insertError) {
        throw new Error(`Failed to create quota: ${insertError.message}`);
      }
    }

    console.log(`Added ${minutesToAdd} minutes to user ${userEmail} (${foundUser.id})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Added ${minutesToAdd} minutes to ${userEmail}`,
        userId: foundUser.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error adding voice minutes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
