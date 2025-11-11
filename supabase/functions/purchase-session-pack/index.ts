import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchasePackRequest {
  packSize: 5 | 10 | 20;
}

const PACK_PRICING = {
  5: { price: 1000, sessions: 5, stripePriceId: 'price_1SSDt7JYNQBAYpmiKgfZ8Ob5' },   // £10 - Small Pack
  10: { price: 1800, sessions: 10, stripePriceId: 'price_1SSDtmJYNQBAYpmiXbuIUdOM' }, // £18 - Medium Pack
  20: { price: 3200, sessions: 20, stripePriceId: 'price_1SSDuRJYNQBAYpmigl9lS3aG' }, // £32 - Large Pack
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

    const { packSize }: PurchasePackRequest = await req.json();

    if (!PACK_PRICING[packSize]) {
      throw new Error('Invalid pack size');
    }

    console.log('Purchasing session pack:', { userId: user.id, packSize });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_platform_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error('No customer found. Please subscribe first.');
    }

    const { price, sessions, stripePriceId } = PACK_PRICING[packSize];

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: 'gbp',
      customer: subscription.stripe_customer_id,
      description: `${sessions} Voice Session Pack`,
      metadata: {
        supabase_user_id: user.id,
        pack_size: packSize,
        sessions_granted: sessions,
        stripe_price_id: stripePriceId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: price,
        sessions: sessions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in purchase-session-pack:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
