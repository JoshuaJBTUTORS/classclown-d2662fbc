
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
    console.log("Starting create-payment-intent function");
    
    const { courseId } = await req.json();
    
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    console.log("Processing payment intent for course:", courseId);

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
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "Course already purchased" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Create a Payment Intent for the subscription setup
    console.log("Creating Stripe Payment Intent");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: course.price || 899, // £8.99 per month
      currency: "gbp",
      customer: customerId,
      setup_future_usage: "off_session", // For future subscription payments
      metadata: {
        course_id: courseId,
        user_id: user.id,
        subscription_flow: "true",
      },
    });

    console.log("Payment Intent created successfully:", paymentIntent.id);

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      customer_id: customerId,
      course_title: course.title,
      amount: course.price || 899
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
