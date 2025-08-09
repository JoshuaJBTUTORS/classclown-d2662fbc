
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-LEARNING-HUB-ACCESS] ${step}${detailsStr}`);
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

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      // Update database to reflect no subscription
      await supabase
        .from('platform_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: null,
          status: 'inactive',
          subscription_tier: 'learning_hub',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          subscription: null,
          trialEligible: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const activeSubscription = subscriptions.data.find(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    let subscriptionData = null;
    let hasAccess = false;
    let isInGracePeriod = false;
    let gracePeriodEnd = null;

    if (activeSubscription) {
      hasAccess = ['active', 'trialing'].includes(activeSubscription.status);
      isInGracePeriod = activeSubscription.status === 'past_due';
      
      subscriptionData = {
        id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_start: new Date(activeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        trial_end: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000).toISOString() : null,
      };

      if (isInGracePeriod) {
        gracePeriodEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days from now
      }

      logStep("Active subscription found", { subscriptionId: activeSubscription.id, status: activeSubscription.status });
    } else {
      logStep("No active subscription found");
    }

    // Check if user has used trial before
    const { data: existingRecord } = await supabase
      .from('platform_subscriptions')
      .select('has_used_trial')
      .eq('user_id', user.id)
      .single();

    const hasUsedTrial = existingRecord?.has_used_trial || 
      subscriptions.data.some(sub => sub.trial_end !== null);

    // Update database
    await supabase
      .from('platform_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: activeSubscription?.id || null,
        status: activeSubscription ? activeSubscription.status : 'inactive',
        subscription_tier: 'learning_hub',
        current_period_start: subscriptionData?.current_period_start || null,
        current_period_end: subscriptionData?.current_period_end || null,
        trial_end: subscriptionData?.trial_end || null,
        has_used_trial: hasUsedTrial,
        grace_period_end: gracePeriodEnd,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    logStep("Database updated", { hasAccess, hasUsedTrial });

    return new Response(
      JSON.stringify({
        hasAccess,
        subscription: subscriptionData,
        trialEligible: !hasUsedTrial,
        isInGracePeriod,
        gracePeriodEnd
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
