
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

    // Get course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error("Course fetch error:", courseError);
      throw new Error("Course not found");
    }

    console.log("Course found:", course.title, "Price:", course.price);

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
          status: 'active',
          trial_end: null,
          course_title: course.title,
          amount: course.price || 899,
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

    // Create subscription with 7-day free trial
    console.log("Creating Stripe subscription with trial");
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: "gbp",
          product_data: { 
            name: `${course.title} Subscription`,
            description: `Monthly access to ${course.title} course`
          },
          unit_amount: course.price || 899, // £8.99 per month
          recurring: {
            interval: "month",
          },
        },
      }],
      trial_period_days: 7, // 7-day free trial
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        course_id: courseId,
        user_id: user.id,
      },
    });

    console.log("Subscription created with trial:", subscription.id);

    // Create Supabase client using service role key to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create purchase record immediately with trial status
    const { error: insertError } = await supabaseService
      .from('course_purchases')
      .insert({
        user_id: user.id,
        course_id: courseId,
        stripe_session_id: subscription.id,
        stripe_payment_intent_id: subscription.latest_invoice?.payment_intent?.id || subscription.id,
        amount_paid: course.price || 899,
        currency: 'gbp',
        status: subscription.status === 'trialing' ? 'completed' : 'pending'
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

    // Get client secret for payment setup if needed
    let clientSecret = null;
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as any;
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        clientSecret = invoice.payment_intent.client_secret;
      }
    }

    return new Response(JSON.stringify({ 
      subscription_id: subscription.id,
      client_secret: clientSecret,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      course_title: course.title,
      amount: course.price || 899,
      requires_payment_method: subscription.status === 'incomplete'
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
