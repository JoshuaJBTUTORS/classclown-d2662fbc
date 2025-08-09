
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-LEARNING-HUB-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { setupIntentId } = await req.json();
    if (!setupIntentId) {
      return new Response(
        JSON.stringify({ error: "Setup Intent ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the setup intent
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: "Setup intent not completed successfully" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Setup intent verified", { status: setupIntent.status });

    const customerId = setupIntent.customer as string;
    const paymentMethodId = setupIntent.payment_method as string;
    const trialEligible = setupIntent.metadata?.trial_eligible === 'true';

    // Create subscription with the payment method
    const subscriptionData: any = {
      customer: customerId,
      items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Learning Hub Access',
            description: 'Unlimited access to all courses'
          },
          unit_amount: 2500, // £25.00
          recurring: { interval: 'month' }
        }
      }],
      default_payment_method: paymentMethodId,
      metadata: {
        user_id: user.id,
        subscription_type: 'learning_hub'
      }
    };

    // Add trial if eligible
    if (trialEligible) {
      subscriptionData.trial_period_days = 7;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    logStep("Subscription created", { 
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end
    });

    // Update platform subscriptions table
    const subscriptionRecord = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      has_used_trial: trialEligible,
      trial_used_date: trialEligible ? new Date().toISOString() : null
    };

    const { error: upsertError } = await supabase
      .from('platform_subscriptions')
      .upsert(subscriptionRecord, { 
        onConflict: 'user_id' 
      });

    if (upsertError) {
      logStep("Database update error", { error: upsertError });
      throw upsertError;
    }

    logStep("Database updated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription created successfully",
        subscriptionId: subscription.id,
        status: subscription.status
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
