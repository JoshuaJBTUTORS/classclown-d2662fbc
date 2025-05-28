
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
    const { paymentIntentId, courseId } = await req.json();
    
    if (!paymentIntentId || !courseId) {
      throw new Error("Payment Intent ID and Course ID are required");
    }

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

    // Retrieve the payment intent to verify it was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error("Payment was not successful");
    }

    const customerId = paymentIntent.customer as string;
    
    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: "gbp",
          product_data: { 
            name: `Course Subscription`,
          },
          unit_amount: paymentIntent.amount,
          recurring: {
            interval: "month",
          },
        },
      }],
      trial_period_days: 7, // 7-day free trial
      metadata: {
        course_id: courseId,
        user_id: user.id,
      },
    });

    // Create purchase record
    const { error: insertError } = await supabaseClient
      .from('course_purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_session_id: subscription.id,
        amount_paid: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'completed'
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription created successfully",
        subscription_id: subscription.id 
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
