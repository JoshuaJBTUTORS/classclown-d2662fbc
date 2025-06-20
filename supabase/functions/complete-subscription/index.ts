
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
    console.log("Starting complete-subscription function");
    
    const { setupIntentId } = await req.json();
    
    if (!setupIntentId) {
      throw new Error("Setup Intent ID is required");
    }

    console.log("Processing subscription completion for setup intent:", setupIntentId);

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

    const { course_id, user_id, course_title, trial_days } = setupIntent.metadata;
    
    if (!course_id || !user_id) {
      throw new Error("Missing required metadata");
    }

    // Get course details to find the Stripe price ID
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('stripe_price_id, price')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found");
    }

    // Create subscription with trial period
    const subscription = await stripe.subscriptions.create({
      customer: setupIntent.customer as string,
      items: [{
        price: course.stripe_price_id,
      }],
      trial_period_days: parseInt(trial_days || '3'),
      default_payment_method: setupIntent.payment_method as string,
      metadata: {
        course_id,
        user_id,
        course_title,
      },
    });

    console.log("Subscription created:", subscription.id);

    // Record the purchase in the database
    const { error: purchaseError } = await supabaseClient
      .from('course_purchases')
      .insert({
        course_id,
        user_id,
        stripe_subscription_id: subscription.id,
        status: 'trialing',
        purchase_date: new Date().toISOString(),
        trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
      });

    if (purchaseError) {
      console.error("Error recording purchase:", purchaseError);
      throw new Error("Failed to record purchase");
    }

    console.log("Purchase recorded successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: "Subscription created successfully with trial period",
      subscription_id: subscription.id,
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
