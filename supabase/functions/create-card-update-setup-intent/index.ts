import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_LESSON_PROPOSAL') || '', {
  apiVersion: '2023-10-16',
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { customerId, token } = await req.json();

    if (!customerId || !token) {
      throw new Error('Missing customerId or token');
    }

    // Validate token
    const { data: linkData, error: linkError } = await supabaseClient
      .from('card_update_links')
      .select('*')
      .eq('token', token)
      .eq('customer_id', customerId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (linkError || !linkData) {
      console.error('Token validation failed:', linkError);
      throw new Error('Invalid or expired update link');
    }

    console.log('Creating setup intent for customer:', customerId);

    // Create Setup Intent for the existing customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        card_update_link_id: linkData.id,
        update_type: 'annual_card_check',
      },
    });

    console.log('Setup Intent created:', setupIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: setupIntent.client_secret,
        name: linkData.name,
        email: linkData.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-card-update-setup-intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
