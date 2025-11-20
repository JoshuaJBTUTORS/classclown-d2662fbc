import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bonus minute packages at £0.30 per minute
const BONUS_MINUTE_PACKAGES = {
  10: { price_id: 'price_1SURJAJYNQBAYpmiH9LPVqHh', amount: 300, minutes: 10 },
  50: { price_id: 'price_1SURJkJYNQBAYpmiOk0YN8gT', amount: 1500, minutes: 50 },
  100: { price_id: 'price_1SURKFJYNQBAYpmilO8pPDcp', amount: 3000, minutes: 100 },
} as const;

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

    const { packageSize } = await req.json();
    console.log('Purchasing bonus minutes for user:', user.id, 'package:', packageSize);

    const packageInfo = BONUS_MINUTE_PACKAGES[packageSize as keyof typeof BONUS_MINUTE_PACKAGES];
    if (!packageInfo) {
      throw new Error('Invalid package size. Choose 10, 50, or 100 minutes.');
    }

    // Get user's email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Get or create Stripe customer
    const { data: existingSub } = await supabase
      .from('user_platform_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create Checkout Session for one-time payment
    const origin = req.headers.get('origin') || 'https://heycleo.io';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment
      line_items: [{
        price: packageInfo.price_id,
        quantity: 1,
      }],
      metadata: {
        supabase_user_id: user.id,
        bonus_minutes: packageInfo.minutes.toString(),
        purchase_type: 'bonus_minutes'
      },
      success_url: `${origin}/learning-hub/subscription?bonus_purchase=success`,
      cancel_url: `${origin}/learning-hub/subscription`,
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating bonus minute checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
