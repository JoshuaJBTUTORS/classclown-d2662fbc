
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
    console.log("Starting create-checkout-session function");
    
    let courseId, authToken;
    
    // Handle both JSON and form data
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/x-www-form-urlencoded")) {
      // Handle form submission
      const formData = await req.formData();
      courseId = formData.get("courseId");
      authToken = formData.get("authorization")?.toString().replace("Bearer ", "");
    } else {
      // Handle JSON request
      const { courseId: jsonCourseId } = await req.json();
      courseId = jsonCourseId;
      const authHeader = req.headers.get('Authorization');
      authToken = authHeader?.replace("Bearer ", "");
    }
    
    if (!courseId) {
      throw new Error("Course ID is required");
    }

    if (!authToken) {
      throw new Error("Authorization token is required");
    }

    console.log("Processing checkout session for course:", courseId);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authToken);
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

    if (!course.stripe_price_id) {
      console.error("Course missing Stripe Price ID:", course.title);
      throw new Error("Course pricing not configured");
    }

    // Check if user already has access
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
          error: "Course already purchased"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    console.log("Stripe initialized");

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Existing customer found:", customerId);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("New customer created:", customerId);
    }

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
    
    // Create Stripe Checkout Session
    console.log("Creating Stripe Checkout Session with Price ID:", course.stripe_price_id);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: course.stripe_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          course_id: courseId,
          user_id: user.id,
        },
      },
      success_url: `${origin}/course/${courseId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/checkout/${courseId}?canceled=true`,
      allow_promotion_codes: true,
    });

    console.log("Checkout session created:", session.id);

    // Follow Ruby pattern - redirect directly to Stripe
    return new Response(null, {
      status: 303,
      headers: {
        ...corsHeaders,
        'Location': session.url!,
      },
    });
  } catch (error) {
    console.error("Error in create-checkout-session function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
