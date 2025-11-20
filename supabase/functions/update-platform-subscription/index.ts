import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { newPlanName } = await req.json();
    console.log('Updating subscription for user:', user.id, 'to plan:', newPlanName);

    // Get user's current subscription
    const { data: currentSub, error: subError } = await supabase
      .from('user_platform_subscriptions')
      .select('stripe_subscription_id, billing_interval')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !currentSub) {
      throw new Error('No active subscription found');
    }

    // Get new plan details
    const { data: newPlan, error: planError } = await supabase
      .from('platform_subscription_plans')
      .select('*')
      .eq('name', newPlanName)
      .single();

    if (planError || !newPlan) {
      throw new Error('Invalid plan selected');
    }

    // Determine new price ID based on current billing interval
    const newPriceId = currentSub.billing_interval === 'yearly'
      ? newPlan.stripe_annual_price_id
      : newPlan.stripe_monthly_price_id;

    console.log('Updating to price ID:', newPriceId);

    // Get current Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);

    // Update Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(
      currentSub.stripe_subscription_id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice', // Immediate proration
        metadata: {
          ...subscription.metadata,
          plan_name: newPlanName,
          voice_minutes: newPlan.voice_minutes_per_month.toString(),
        }
      }
    );

    console.log('Subscription updated successfully:', updatedSubscription.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Plan updated successfully',
        subscription: updatedSubscription 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
