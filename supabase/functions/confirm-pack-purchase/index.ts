import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmPurchaseRequest {
  paymentIntentId: string;
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

    const { paymentIntentId }: ConfirmPurchaseRequest = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    const packSize = parseInt(paymentIntent.metadata.pack_size);
    const sessionsGranted = parseInt(paymentIntent.metadata.sessions_granted);

    // Record purchase
    const { error: purchaseError } = await supabase
      .from('session_pack_purchases')
      .insert({
        user_id: user.id,
        pack_size: packSize,
        price_paid_pence: paymentIntent.amount,
        sessions_granted: sessionsGranted,
        stripe_payment_intent_id: paymentIntentId,
        purchased_at: new Date().toISOString()
      });

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      throw purchaseError;
    }

    // Add bonus sessions to current quota
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

    const { error: updateError } = await supabase
      .from('voice_session_quotas')
      .update({
        bonus_sessions: (quota.bonus_sessions || 0) + sessionsGranted
      })
      .eq('id', quota.id);

    if (updateError) {
      console.error('Error updating quota:', updateError);
      throw updateError;
    }

    console.log('Session pack purchase confirmed:', {
      userId: user.id,
      packSize,
      sessionsGranted
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionsGranted,
        newTotal: quota.sessions_remaining + quota.bonus_sessions + sessionsGranted
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in confirm-pack-purchase:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
