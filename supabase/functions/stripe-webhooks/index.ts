
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature - you'll need to set STRIPE_WEBHOOK_SECRET
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;
    
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response("Webhook signature verification failed", { 
          status: 400, 
          headers: corsHeaders 
        });
      }
    } else {
      // For development - parse without verification
      event = JSON.parse(body);
      logStep("Webhook processed without signature verification (development mode)");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Processing webhook event", { type: event.type, id: event.id });

    switch (event.type) {
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
      
      default:
        logStep("Unhandled webhook event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logStep("Webhook error", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

async function handlePaymentFailed(supabase: any, invoice: any) {
  logStep("Handling payment failed", { invoiceId: invoice.id, customerId: invoice.customer });

  if (!invoice.subscription) {
    logStep("No subscription found for failed payment");
    return;
  }

  const subscriptionId = invoice.subscription;
  const gracePeriodStart = new Date();
  const gracePeriodEnd = new Date(gracePeriodStart.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

  // Find course purchases for this subscription
  const { data: purchases, error: fetchError } = await supabase
    .from('course_purchases')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId);

  if (fetchError) {
    logStep("Error fetching purchases", { error: fetchError });
    return;
  }

  for (const purchase of purchases || []) {
    if (purchase.status !== 'grace_period') {
      // Update to grace period status
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({
          previous_status: purchase.status,
          status: 'grace_period',
          grace_period_start: gracePeriodStart.toISOString(),
          grace_period_end: gracePeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.id);

      if (updateError) {
        logStep("Error updating purchase to grace period", { error: updateError, purchaseId: purchase.id });
      } else {
        logStep("Purchase updated to grace period", { purchaseId: purchase.id, gracePeriodEnd });
      }
    }
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: any) {
  logStep("Handling payment succeeded", { invoiceId: invoice.id, customerId: invoice.customer });

  if (!invoice.subscription) {
    logStep("No subscription found for successful payment");
    return;
  }

  const subscriptionId = invoice.subscription;

  // Find course purchases for this subscription
  const { data: purchases, error: fetchError } = await supabase
    .from('course_purchases')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId);

  if (fetchError) {
    logStep("Error fetching purchases", { error: fetchError });
    return;
  }

  for (const purchase of purchases || []) {
    if (purchase.status === 'grace_period' || purchase.status === 'past_due') {
      // Restore access
      const restoreStatus = purchase.previous_status === 'grace_period' ? 'completed' : (purchase.previous_status || 'completed');
      
      const { error: updateError } = await supabase
        .from('course_purchases')
        .update({
          status: restoreStatus,
          previous_status: null,
          grace_period_start: null,
          grace_period_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchase.id);

      if (updateError) {
        logStep("Error restoring purchase access", { error: updateError, purchaseId: purchase.id });
      } else {
        logStep("Purchase access restored", { purchaseId: purchase.id, newStatus: restoreStatus });
      }
    }
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  logStep("Handling subscription updated", { subscriptionId: subscription.id, status: subscription.status });

  const subscriptionId = subscription.id;
  let newStatus = 'pending';

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
  }

  // Find course purchases for this subscription
  const { data: purchases, error: fetchError } = await supabase
    .from('course_purchases')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId);

  if (fetchError) {
    logStep("Error fetching purchases", { error: fetchError });
    return;
  }

  for (const purchase of purchases || []) {
    // Don't override grace period status unless subscription is canceled
    if (purchase.status === 'grace_period' && subscription.status !== 'canceled') {
      continue;
    }

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Set trial end if applicable
    if (subscription.trial_end) {
      updateData.trial_end = new Date(subscription.trial_end * 1000).toISOString();
    }

    // Clear grace period if subscription is canceled or becomes active
    if (subscription.status === 'canceled' || subscription.status === 'active') {
      updateData.grace_period_start = null;
      updateData.grace_period_end = null;
      updateData.previous_status = null;
    }

    const { error: updateError } = await supabase
      .from('course_purchases')
      .update(updateData)
      .eq('id', purchase.id);

    if (updateError) {
      logStep("Error updating purchase status", { error: updateError, purchaseId: purchase.id });
    } else {
      logStep("Purchase status updated", { purchaseId: purchase.id, newStatus });
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  logStep("Handling subscription deleted", { subscriptionId: subscription.id });

  const subscriptionId = subscription.id;

  // Find course purchases for this subscription and immediately revoke access
  const { data: purchases, error: fetchError } = await supabase
    .from('course_purchases')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId);

  if (fetchError) {
    logStep("Error fetching purchases", { error: fetchError });
    return;
  }

  for (const purchase of purchases || []) {
    const { error: updateError } = await supabase
      .from('course_purchases')
      .update({
        status: 'expired',
        grace_period_start: null,
        grace_period_end: null,
        previous_status: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchase.id);

    if (updateError) {
      logStep("Error revoking purchase access", { error: updateError, purchaseId: purchase.id });
    } else {
      logStep("Purchase access revoked", { purchaseId: purchase.id });
    }
  }
}
