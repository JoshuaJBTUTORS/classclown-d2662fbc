
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    console.log("Completing subscription setup:", subscriptionId);

    // Create Supabase client using the service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is authenticated using anon key client
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the subscription to verify it exists and get its status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    console.log("Subscription status:", subscription.status);

    // Update the purchase record with the latest subscription status
    const { error: updateError } = await supabaseClient
      .from('course_purchases')
      .update({
        status: (subscription.status === 'active' || subscription.status === 'trialing') ? 'completed' : subscription.status,
        stripe_payment_intent_id: subscription.latest_invoice?.payment_intent || subscription.id
      })
      .eq('stripe_session_id', subscriptionId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update subscription status in database");
    }

    console.log("Subscription status updated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription setup completed successfully",
        subscription_status: subscription.status,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in complete-subscription function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
