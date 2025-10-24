import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

interface CompleteSetupRequest {
  setupIntentId: string;
  proposalId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { setupIntentId, proposalId }: CompleteSetupRequest = await req.json();

    console.log('Completing proposal setup:', proposalId, setupIntentId);

    // Retrieve Setup Intent from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== 'succeeded') {
      throw new Error('Setup Intent not succeeded');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(
      setupIntent.payment_method as string
    );

    console.log('Payment method retrieved:', paymentMethod.id);

    // Save payment method to database
    const { error: paymentError } = await supabaseClient
      .from('lesson_proposal_payment_methods')
      .insert({
        proposal_id: proposalId,
        stripe_setup_intent_id: setupIntentId,
        stripe_payment_method_id: paymentMethod.id,
        stripe_customer_id: setupIntent.customer as string,
        card_last4: paymentMethod.card?.last4,
        card_brand: paymentMethod.card?.brand,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        billing_name: paymentMethod.billing_details.name,
        billing_email: paymentMethod.billing_details.email,
      });

    if (paymentError) {
      console.error('Error saving payment method:', paymentError);
      throw paymentError;
    }

    // Update proposal status to completed
    const { error: updateError } = await supabaseClient
      .from('lesson_proposals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    if (updateError) {
      console.error('Error updating proposal:', updateError);
      throw updateError;
    }

    console.log('Proposal completed successfully:', proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proposal completed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in complete-proposal-setup:', error);
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
