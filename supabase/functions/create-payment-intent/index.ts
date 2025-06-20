
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
    console.log("Starting create-subscription-with-trial function");
    
    const { courseId } = await req.json();
    
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    console.log("Processing subscription with trial for course:", courseId);

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

    // Get course details including Stripe Price ID
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error("Course fetch error:", courseError);
      throw new Error("Course not found");
    }

    console.log("Course found:", course.title, "Price:", course.price, "Stripe Price ID:", course.stripe_price_id);

    // Check if course has a Stripe Price ID
    if (!course.stripe_price_id) {
      console.error("Course missing Stripe Price ID:", course.title);
      throw new Error("Course pricing not configured. Please contact support.");
    }

    // Check if user already has an active subscription for this course
    const { data: existingPurchase } = await supabaseClient
      .from('course_purchases')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'trialing'])
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ 
          subscription_id: existingPurchase.stripe_session_id,
          status: existingPurchase.status,
          trial_end: null,
          course_title: course.title,
          amount: course.price || 1299,
          requires_payment_method: false,
          message: "Course already purchased"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Create subscription with 3-day free trial using Stripe's native trial flow
    console.log("Creating Stripe subscription with 3-day trial using Price ID:", course.stripe_price_id);
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: course.stripe_price_id,
      }],
      trial_period_days: 3,
      metadata: {
        course_id: courseId,
        user_id: user.id,
      },
    });

    console.log("Subscription created with trial:", subscription.id, "Status:", subscription.status);

    // Create Supabase client using service role key to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create purchase record with trialing status
    const { error: insertError } = await supabaseService
      .from('course_purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        stripe_session_id: subscription.id,
        stripe_payment_intent_id: subscription.id,
        amount_paid: course.price || 1299,
        currency: 'gbp',
        status: subscription.status
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
      // Try to cancel the subscription if DB insert fails
      try {
        await stripe.subscriptions.cancel(subscription.id);
      } catch (cancelError) {
        console.error("Failed to cancel subscription after DB error:", cancelError);
      }
      throw new Error("Failed to record subscription in database");
    }

    console.log("Purchase record created successfully");

    return new Response(JSON.stringify({ 
      subscription_id: subscription.id,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      course_title: course.title,
      amount: course.price || 1299,
      requires_payment_method: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-subscription-with-trial function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
