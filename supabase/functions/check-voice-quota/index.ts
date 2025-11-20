import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuotaResponse {
  canStart: boolean;
  minutesRemaining: number;
  quotaId: string | null;
  message: string;
  periodEnd?: string;
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

    console.log('Checking voice quota for user:', user.id);

    // Get current period quota first
    const now = new Date().toISOString();
    const { data: quota, error: quotaError } = await supabase
      .from('voice_session_quotas')
      .select('*')
      .eq('user_id', user.id)
      .lte('period_start', now)
      .gte('period_end', now)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      console.error('Error fetching quota:', quotaError);
      throw quotaError;
    }

    // Get user's active subscription
    const { data: subscription } = await supabase
      .from('user_platform_subscriptions')
      .select('*, plan:platform_subscription_plans(*)')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check if user has free minutes (quota exists but no subscription)
    if (quota && !subscription) {
      const totalRemaining = (quota.minutes_remaining || 0) + (quota.bonus_minutes || 0);
      
      if (totalRemaining > 0) {
        console.log('User has free minutes:', totalRemaining);
        const response: QuotaResponse = {
          canStart: true,
          minutesRemaining: totalRemaining,
          quotaId: quota.id,
          message: `You have ${totalRemaining} free minute${totalRemaining !== 1 ? 's' : ''} remaining`,
          periodEnd: quota.period_end
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        console.log('Free minutes exhausted, no subscription');
        const response: QuotaResponse = {
          canStart: false,
          minutesRemaining: 0,
          quotaId: null,
          message: 'Free minutes used. Subscribe to continue learning!'
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        });
      }
    }

    // No subscription and no quota - user needs to subscribe
    if (!subscription && !quota) {
      const response: QuotaResponse = {
        canStart: false,
        minutesRemaining: 0,
        quotaId: null,
        message: 'No active subscription found. Please subscribe to continue.'
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // If no quota exists for current period but subscription exists, create one
    if (!quota) {
      console.log('Creating new quota period for user:', user.id);
      
      const periodStart = new Date(subscription.current_period_start);
      const periodEnd = new Date(subscription.current_period_end);

      const { data: newQuota, error: createError } = await supabase
        .from('voice_session_quotas')
        .insert({
          user_id: user.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          total_minutes_allowed: subscription.plan.voice_minutes_per_month,
          minutes_used: 0,
          minutes_remaining: subscription.plan.voice_minutes_per_month,
          bonus_minutes: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating quota:', createError);
        throw createError;
      }

      const response: QuotaResponse = {
        canStart: true,
        minutesRemaining: newQuota.minutes_remaining + newQuota.bonus_minutes,
        quotaId: newQuota.id,
        message: `You have ${newQuota.minutes_remaining + newQuota.bonus_minutes} minutes remaining this period`,
        periodEnd: periodEnd.toISOString()
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has minutes remaining
    const totalRemaining = (quota.minutes_remaining || 0) + (quota.bonus_minutes || 0);
    const canStart = totalRemaining > 0;

    const response: QuotaResponse = {
      canStart,
      minutesRemaining: totalRemaining,
      quotaId: quota.id,
      message: canStart
        ? `You have ${totalRemaining} minute${totalRemaining !== 1 ? 's' : ''} remaining this period`
        : 'No minutes remaining. Purchase more minutes or upgrade your plan.',
      periodEnd: quota.period_end
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: canStart ? 200 : 403
    });

  } catch (error) {
    console.error('Error in check-voice-quota:', error);
    return new Response(
      JSON.stringify({ 
        canStart: false, 
        minutesRemaining: 0, 
        quotaId: null,
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
