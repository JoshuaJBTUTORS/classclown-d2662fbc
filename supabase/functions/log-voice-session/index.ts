import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogSessionRequest {
  conversationId: string;
  durationSeconds: number;
  wasInterrupted?: boolean;
  sessionStart: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { conversationId, durationSeconds, wasInterrupted = false, sessionStart }: LogSessionRequest = await req.json();

    console.log('Logging voice session:', { userId: user.id, conversationId, durationSeconds });

    // Get current quota
    const now = new Date().toISOString();
    const { data: quota, error: quotaError } = await supabase
      .from('voice_session_quotas')
      .select('*')
      .eq('user_id', user.id)
      .lte('period_start', now)
      .gte('period_end', now)
      .single();

    if (quotaError || !quota) {
      throw new Error('No active quota found');
    }

    // Calculate minutes used (round up to nearest minute)
    const minutesUsed = Math.ceil(durationSeconds / 60);

    // Calculate AI cost estimate (£0.20 per minute based on new pricing)
    const costPerMinute = 0.20;
    const aiCostEstimate = (minutesUsed * costPerMinute).toFixed(4);

    // Insert session log
    const { data: sessionLog, error: logError } = await supabase
      .from('voice_session_logs')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        quota_id: quota.id,
        session_start: sessionStart,
        session_end: new Date().toISOString(),
        duration_seconds: durationSeconds,
        was_interrupted: wasInterrupted,
        deducted_from_quota: true,
        ai_cost_estimate_usd: aiCostEstimate
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating session log:', logError);
      throw logError;
    }

    // Decrement quota by ACTUAL MINUTES used - prioritize bonus minutes first
    let updatedBonusMinutes = quota.bonus_minutes;
    let updatedMinutesRemaining = quota.minutes_remaining;
    let updatedMinutesUsed = quota.minutes_used;

    if (quota.bonus_minutes >= minutesUsed) {
      // Deduct entirely from bonus minutes
      updatedBonusMinutes = quota.bonus_minutes - minutesUsed;
    } else if (quota.bonus_minutes > 0) {
      // Deduct partially from bonus, rest from regular quota
      const remainingToDeduct = minutesUsed - quota.bonus_minutes;
      updatedBonusMinutes = 0;
      updatedMinutesRemaining = Math.max(0, quota.minutes_remaining - remainingToDeduct);
      updatedMinutesUsed = quota.minutes_used + remainingToDeduct;
    } else {
      // Deduct from regular quota only
      updatedMinutesRemaining = Math.max(0, quota.minutes_remaining - minutesUsed);
      updatedMinutesUsed = quota.minutes_used + minutesUsed;
    }

    const { error: updateError } = await supabase
      .from('voice_session_quotas')
      .update({
        minutes_remaining: updatedMinutesRemaining,
        minutes_used: updatedMinutesUsed,
        bonus_minutes: updatedBonusMinutes
      })
      .eq('id', quota.id);

    if (updateError) {
      console.error('Error updating quota:', updateError);
      throw updateError;
    }

    const totalRemaining = updatedMinutesRemaining + updatedBonusMinutes;

    console.log('Session logged successfully:', {
      sessionLogId: sessionLog.id,
      minutesUsed,
      newRemaining: totalRemaining
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionLogId: sessionLog.id,
        minutesRemaining: totalRemaining,
        minutesUsed,
        aiCostEstimate: parseFloat(aiCostEstimate)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in log-voice-session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
