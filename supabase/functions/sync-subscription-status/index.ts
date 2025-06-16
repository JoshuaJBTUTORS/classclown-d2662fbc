
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client using the service role key for updates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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

    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      // No Stripe customer found, mark all purchases as expired
      await supabaseClient
        .from('course_purchases')
        .update({ status: 'expired' })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ message: "No billing account found, access revoked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    // Get user's course purchases
    const { data: purchases, error: purchasesError } = await supabaseClient
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id);

    if (purchasesError) {
      throw purchasesError;
    }

    // Update each purchase based on subscription status
    for (const purchase of purchases || []) {
      let newStatus = 'expired';
      
      // Find corresponding subscription
      const subscription = subscriptions.data.find(sub => 
        sub.id === purchase.stripe_session_id || 
        sub.metadata?.course_id === purchase.course_id
      );

      if (subscription) {
        switch (subscription.status) {
          case 'active':
          case 'trialing':
            newStatus = 'completed';
            break;
          case 'past_due':
            newStatus = 'past_due';
            break;
          case 'canceled':
          case 'incomplete_expired':
          case 'unpaid':
            newStatus = 'expired';
            break;
          default:
            newStatus = 'pending';
        }
      }

      // Update purchase status
      await supabaseClient
        .from('course_purchases')
        .update({ status: newStatus })
        .eq('id', purchase.id);
    }

    return new Response(
      JSON.stringify({ message: "Subscription status synced successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-subscription-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
