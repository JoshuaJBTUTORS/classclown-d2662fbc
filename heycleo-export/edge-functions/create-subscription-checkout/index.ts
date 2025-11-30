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

    // Fetch plan details from database
    const { data: planData, error: planError } = await supabase
      .from('platform_subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single();

    if (planError || !planData) {
      console.error('Plan fetch error:', planError);
      throw new Error('Invalid plan name');
    }

    // Get the correct Stripe Price ID based on billing interval
    const stripePriceId = billingInterval === 'yearly' 
      ? planData.stripe_annual_price_id 
      : planData.stripe_monthly_price_id;

    if (!stripePriceId) {
      throw new Error(`No Stripe Price ID configured for ${planName} ${billingInterval} plan`);
    }

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

    // Create Checkout Session using Stripe Price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_name: planName,
          voice_minutes: planData.voice_minutes_per_month.toString(),
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
