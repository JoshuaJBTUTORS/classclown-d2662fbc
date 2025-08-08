
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
    console.log("Starting create-payment-intent function for platform subscription");
    
    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.email);

    // Check if user already has an active platform subscription
    const { data: existingSubscription } = await supabaseClient
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (existingSubscription) {
      return new Response(
        JSON.stringify({ 
          error: "Platform subscription already exists",
          message: "You already have access to all courses!"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Check for ANY previous trial usage to prevent trial abuse
    const { data: trialHistory } = await supabaseClient
      .from('platform_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('has_used_trial', true);

    console.log("Trial eligibility check for user:", user.email, "Trial history count:", trialHistory?.length || 0);

    if (trialHistory && trialHistory.length > 0) {
      console.log("TRIAL BLOCKED: User has already used a trial - denying new trial request");
      return new Response(
        JSON.stringify({ 
          error: "Trial already used", 
          message: "You have already used your free trial. Please choose a paid subscription.",
          requires_payment_method: false,
          trial_already_used: true 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    console.log("TRIAL APPROVED: User eligible for free trial");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    console.log("Stripe initialized");

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Existing customer found:", customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("New customer created:", customerId);
    }

    // Create Setup Intent for platform subscription with trial
    console.log("Creating Setup Intent for platform subscription with trial");
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        subscription_type: 'platform',
        user_id: user.id,
        platform_access: 'all_courses',
        trial_days: '3',
      },
    });

    console.log("Setup Intent created:", setupIntent.id, "Client Secret:", setupIntent.client_secret);

    return new Response(JSON.stringify({ 
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
      subscription_type: 'platform',
      amount: 2855, // £28.55 in pence
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment-intent function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
