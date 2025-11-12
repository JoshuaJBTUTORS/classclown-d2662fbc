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

    // Calculate AI cost estimate (£0.61 per 5-minute session)
    const costPer5Min = 0.61;
    const costPerSecond = costPer5Min / 300;
    const aiCostEstimate = (durationSeconds * costPerSecond).toFixed(4);

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

    // Decrement quota - prioritize bonus sessions first
    let sessionsToDeduct = 1;
    let updatedBonusSessions = quota.bonus_sessions;
    let updatedSessionsRemaining = quota.sessions_remaining;
    let updatedSessionsUsed = quota.sessions_used;

    if (quota.bonus_sessions > 0) {
      updatedBonusSessions = quota.bonus_sessions - 1;
    } else {
      updatedSessionsRemaining = Math.max(0, quota.sessions_remaining - 1);
      updatedSessionsUsed = quota.sessions_used + 1;
    }

    const { error: updateError } = await supabase
      .from('voice_session_quotas')
      .update({
        sessions_remaining: updatedSessionsRemaining,
        sessions_used: updatedSessionsUsed,
        bonus_sessions: updatedBonusSessions
      })
      .eq('id', quota.id);

    if (updateError) {
      console.error('Error updating quota:', updateError);
      throw updateError;
    }

    console.log('Session logged successfully:', {
      sessionLogId: sessionLog.id,
      newRemaining: updatedSessionsRemaining + updatedBonusSessions
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionLogId: sessionLog.id,
        sessionsRemaining: updatedSessionsRemaining + updatedBonusSessions,
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
