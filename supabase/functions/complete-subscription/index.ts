
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("Starting complete-subscription function for platform subscription");
    
    const { setupIntentId } = await req.json();
    
    if (!setupIntentId) {
      throw new Error("Setup Intent ID is required");
    }

    console.log("Processing platform subscription completion for setup intent:", setupIntentId);

    // Create Supabase client using service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the Setup Intent to get metadata
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    console.log("Setup Intent retrieved:", setupIntent.id, "Status:", setupIntent.status);

    if (setupIntent.status !== 'succeeded') {
      throw new Error("Setup Intent not succeeded");
    }

    const { user_id, trial_days, subscription_type } = setupIntent.metadata;
    
    if (!user_id || subscription_type !== 'platform') {
      throw new Error("Missing required metadata for platform subscription");
    }

    console.log("Metadata extracted:", { user_id, trial_days, subscription_type });

    // Create subscription with trial period using fixed platform price ID
    const subscription = await stripe.subscriptions.create({
      customer: setupIntent.customer as string,
      items: [{
        price: 'price_1Rtxy3Jvbqr5stJMhWqXgeC2', // Fixed platform price ID
      }],
      trial_period_days: parseInt(trial_days || '3'),
      default_payment_method: setupIntent.payment_method as string,
      metadata: {
        subscription_type: 'platform',
        user_id,
        platform_access: 'all_courses',
      },
    });

    console.log("Platform subscription created:", subscription.id, "Status:", subscription.status);

    // Determine the subscription status for our database
    let dbStatus = 'trialing';
    if (subscription.status === 'active' && !subscription.trial_end) {
      dbStatus = 'active';
    } else if (subscription.status === 'trialing' || (subscription.status === 'active' && subscription.trial_end)) {
      dbStatus = 'trialing';
    }

    const trialEndDate = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    const currentPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null;
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Record the platform subscription in the database
    const { error: subscriptionError } = await supabaseClient
      .from('platform_subscriptions')
      .insert({
        user_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: setupIntent.customer as string,
        status: dbStatus,
        trial_end: trialEndDate,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        has_used_trial: true, // Mark that user has used their trial
        trial_used_date: new Date().toISOString(),
      });

    if (subscriptionError) {
      console.error("Error recording platform subscription:", subscriptionError);
      throw new Error(`Failed to record platform subscription: ${subscriptionError.message}`);
    }

    console.log("Platform subscription recorded successfully with subscription ID:", subscription.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Platform subscription created successfully with trial period",
      subscription_id: subscription.id,
      subscription_type: 'platform',
      status: dbStatus,
      trial_end: trialEndDate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in complete-subscription function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
