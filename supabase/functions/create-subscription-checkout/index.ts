import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { planName, billingInterval } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Define pricing configuration
    const planPrices: Record<string, { monthly: number; yearly: number; sessions: number }> = {
      'Starter': { monthly: 1800, yearly: 18360, sessions: 15 }, // £18/month
      'Standard': { monthly: 3700, yearly: 37740, sessions: 30 }, // £37/month
      'Plus': { monthly: 6100, yearly: 62220, sessions: 60 }, // £61/month
      'Premium': { monthly: 11000, yearly: 112200, sessions: 90 }, // £110/month
    };

    const planConfig = planPrices[planName];
    if (!planConfig) {
      throw new Error('Invalid plan name');
    }

    const price = billingInterval === 'yearly' ? planConfig.yearly : planConfig.monthly;

    // Get or create Stripe customer
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('user_platform_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Check if user has used trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_used_trial')
      .eq('id', user.id)
      .single();

    const hasUsedTrial = profile?.has_used_trial || false;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${planName} Plan`,
              description: `${planConfig.sessions} × 5-minute voice lessons per ${billingInterval === 'yearly' ? 'year' : 'month'}`,
            },
            unit_amount: price,
            recurring: {
              interval: billingInterval === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_name: planName,
          sessions_quota: planConfig.sessions.toString(),
          billing_interval: billingInterval,
        },
      },
      success_url: `${req.headers.get('origin')}/learning-hub/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      allow_promotion_codes: true,
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
