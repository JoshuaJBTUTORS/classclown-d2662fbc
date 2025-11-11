import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Syncing subscription status for user:', user.id);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get user's subscription from database
    const { data: dbSubscription } = await supabase
      .from('user_platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no subscription found, return success (user may have free sessions)
    if (!dbSubscription?.stripe_subscription_id) {
      console.log('No subscription to sync - user may be using free sessions');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No subscription to sync',
          hasSubscription: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      dbSubscription.stripe_subscription_id
    );

    // Update database with Stripe data
    const { error: updateError } = await supabase
      .from('user_platform_subscriptions')
      .update({
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        canceled_at: stripeSubscription.canceled_at 
          ? new Date(stripeSubscription.canceled_at * 1000).toISOString() 
          : null,
      })
      .eq('id', dbSubscription.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Subscription synced successfully');

    return new Response(
      JSON.stringify({
        success: true,
        status: stripeSubscription.status,
        currentPeriodEnd: stripeSubscription.current_period_end
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in sync-platform-subscription-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
