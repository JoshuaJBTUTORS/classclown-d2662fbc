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

    const { setupIntentId, customerId } = await req.json();

    if (!setupIntentId || !customerId) {
      throw new Error('Missing required fields');
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

    // Get customer details for billing info
    const customer = await stripe.customers.retrieve(customerId);

    // Save to card_update_submissions
    await supabaseClient
      .from('card_update_submissions')
      .insert({
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethodId,
        stripe_setup_intent_id: setupIntentId,
        card_last4: paymentMethod.card?.last4 || '',
        card_brand: paymentMethod.card?.brand || '',
        card_exp_month: paymentMethod.card?.exp_month || null,
        card_exp_year: paymentMethod.card?.exp_year || null,
        billing_name: (customer as any).name || '',
        billing_email: (customer as any).email || '',
      });

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
