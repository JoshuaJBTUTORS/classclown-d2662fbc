import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  planId: string;
  billingInterval: 'monthly' | 'annual';
  setupIntentId?: string;
  paymentMethodId?: string;
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

    const { planId, billingInterval, setupIntentId, paymentMethodId }: CreateSubscriptionRequest = await req.json();

    console.log('Creating platform subscription:', { userId: user.id, planId, billingInterval });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('platform_subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    // Check if user has completed trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_completed_trial')
      .eq('id', user.id)
      .single();

    const hasCompletedTrial = profile?.has_completed_trial || false;

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a customer ID
    const { data: existingSubscription } = await supabase
      .from('user_platform_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      stripeCustomerId = customer.id;
    }

    // Get payment method from setup intent if provided
    let paymentMethod = paymentMethodId;
    if (setupIntentId && !paymentMethod) {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      paymentMethod = setupIntent.payment_method as string;
    }

    if (!paymentMethod) {
      throw new Error('No payment method provided');
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    // Get the appropriate price ID
    const stripePriceId = billingInterval === 'annual' 
      ? plan.stripe_annual_price_id 
      : plan.stripe_monthly_price_id;

    if (!stripePriceId) {
      throw new Error('Stripe price ID not configured for this plan');
    }

    // Create subscription with trial if user hasn't completed trial
    const subscriptionParams: any = {
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
      payment_settings: {
        payment_method_types: ['card'],
      },
    };

    // Add trial only if user hasn't completed one
    if (!hasCompletedTrial) {
      subscriptionParams.trial_period_days = 7; // 7-day trial
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    console.log('Stripe subscription created:', subscription.id);

    // Insert subscription record
    const { data: dbSubscription, error: dbError } = await supabase
      .from('user_platform_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        billing_interval: billingInterval,
        status: subscription.status,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating subscription record:', dbError);
      throw dbError;
    }

    // Create initial quota with minutes
    const minutesToGrant = plan.voice_minutes_per_month;

    const { error: quotaError } = await supabase
      .from('voice_session_quotas')
      .insert({
        user_id: user.id,
        period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        total_minutes_allowed: minutesToGrant,
        minutes_used: 0,
        minutes_remaining: minutesToGrant,
        bonus_minutes: 0
      });

    if (quotaError) {
      console.error('Error creating quota:', quotaError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-platform-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
