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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { setupIntentId, customerId, token } = await req.json();

    if (!setupIntentId || !customerId || !token) {
      throw new Error('Missing required fields');
    }

    // Validate token again
    const { data: linkData, error: linkError } = await supabaseClient
      .from('card_update_links')
      .select('*')
      .eq('token', token)
      .eq('customer_id', customerId)
      .eq('used', false)
      .single();

    if (linkError || !linkData) {
      throw new Error('Invalid update link');
    }

    // Retrieve the setup intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup intent not completed');
    }

    const paymentMethodId = setupIntent.payment_method as string;

    // Set as default payment method on customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Update lesson_proposal_payment_methods if exists
    const { data: existingPm } = await supabaseClient
      .from('lesson_proposal_payment_methods')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .limit(1);

    if (existingPm && existingPm.length > 0) {
      await supabaseClient
        .from('lesson_proposal_payment_methods')
        .update({
          stripe_payment_method_id: paymentMethodId,
          card_last_four: paymentMethod.card?.last4 || '',
          card_brand: paymentMethod.card?.brand || '',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
    }

    // Mark the link as used
    await supabaseClient
      .from('card_update_links')
      .update({ used: true })
      .eq('id', linkData.id);

    console.log('Card update completed for customer:', customerId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in complete-card-update:', error);
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
