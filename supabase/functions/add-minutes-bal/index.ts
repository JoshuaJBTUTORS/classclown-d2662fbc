import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const userId = 'dcfcb199-18a8-4b14-b681-f394442bb60f'; // Bal Bal
    const minutesToAdd = 45;

    // Get current quota
    const now = new Date().toISOString();
    const { data: currentQuota, error: quotaError } = await supabase
      .from('voice_session_quotas')
      .select('*')
      .eq('user_id', userId)
      .lte('period_start', now)
      .gte('period_end', now)
      .maybeSingle();

    if (quotaError) {
      throw new Error(`Failed to fetch quota: ${quotaError.message}`);
    }

    if (currentQuota) {
      // Update existing quota
      const { data: updated, error: updateError } = await supabase
        .from('voice_session_quotas')
        .update({
          bonus_minutes: (currentQuota.bonus_minutes || 0) + minutesToAdd,
          minutes_remaining: (currentQuota.minutes_remaining || 0) + minutesToAdd,
          total_minutes_allowed: (currentQuota.total_minutes_allowed || 0) + minutesToAdd,
        })
        .eq('id', currentQuota.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update quota: ${updateError.message}`);
      }

      console.log(`Updated quota for Bal Bal:`, updated);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Added ${minutesToAdd} minutes to Bal Bal`,
          quota: updated,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new quota
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data: created, error: insertError } = await supabase
        .from('voice_session_quotas')
        .insert({
          user_id: userId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          total_minutes_allowed: minutesToAdd,
          minutes_remaining: minutesToAdd,
          bonus_minutes: minutesToAdd,
          minutes_used: 0,
          total_sessions_allowed: 0,
          sessions_remaining: 0,
          bonus_sessions: 0,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create quota: ${insertError.message}`);
      }

      console.log(`Created quota for Bal Bal:`, created);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Created new quota with ${minutesToAdd} minutes for Bal Bal`,
          quota: created,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error adding voice minutes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
