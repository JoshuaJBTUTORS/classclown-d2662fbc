import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
      undefined,
      cryptoProvider
    );

    console.log('Received webhook event:', event.type);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseAdmin, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseAdmin, invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Handle session pack purchases
        if (paymentIntent.metadata.pack_size) {
          await handlePackPurchase(supabaseAdmin, paymentIntent);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(supabase: any, stripe: Stripe, session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout.session.completed:', session.id);

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    const userId = subscription.metadata.supabase_user_id;
    const planName = subscription.metadata.plan_name;
    const sessionsQuota = parseInt(subscription.metadata.sessions_quota || '30');

    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

    // Create or update subscription record
    const { error: subError } = await supabase
      .from('user_platform_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_name: planName,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      });

    if (subError) {
      console.error('Error creating subscription:', subError);
      return;
    }

    // Create initial quota record
    const periodStart = new Date(subscription.current_period_start * 1000);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    const { error: quotaError } = await supabase
      .from('voice_session_quotas')
      .insert({
        user_id: userId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        sessions_allowed: sessionsQuota,
        sessions_used: 0,
        sessions_remaining: sessionsQuota,
      });

    if (quotaError) {
      console.error('Error creating quota:', quotaError);
    }

    // Mark trial as used if applicable
    if (subscription.trial_end) {
      await supabase
        .from('profiles')
        .update({ has_used_trial: true })
        .eq('id', userId);
    }

    console.log('Checkout processing completed for user:', userId);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id);

  const userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  // Update subscription status
  const { error: updateError } = await supabase
    .from('user_platform_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (updateError) {
    console.error('Error updating subscription:', updateError);
    return;
  }

  // On renewal, create new quota period
  if (subscription.status === 'active') {
    const { data: dbSub } = await supabase
      .from('user_platform_subscriptions')
      .select('*, plan:platform_subscription_plans(*)')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (dbSub) {
      // Check if quota for this period already exists
      const { data: existingQuota } = await supabase
        .from('voice_session_quotas')
        .select('id')
        .eq('user_id', userId)
        .eq('period_start', new Date(subscription.current_period_start * 1000).toISOString())
        .single();

      if (!existingQuota) {
        await supabase
          .from('voice_session_quotas')
          .insert({
            user_id: userId,
            period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            total_minutes_allowed: dbSub.plan.voice_minutes_per_month,
            minutes_used: 0,
            minutes_remaining: dbSub.plan.voice_minutes_per_month,
            bonus_minutes: 0,
            // Legacy session fields for backwards compatibility
            total_sessions_allowed: 0,
            sessions_used: 0,
            sessions_remaining: 0,
            bonus_sessions: 0
          });

        console.log('Created new quota period for user:', userId);
      }
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', subscription.id);

  await supabase
    .from('user_platform_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log('Handling payment succeeded:', invoice.id);

  if (!invoice.subscription) return;

  const subscription = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;

  // Mark trial as completed
  const { data: dbSub } = await supabase
    .from('user_platform_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription)
    .single();

  if (dbSub) {
    await supabase
      .from('profiles')
      .update({
        has_completed_trial: true,
        trial_completed_at: new Date().toISOString()
      })
      .eq('id', dbSub.user_id);
  }
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('Handling payment failed:', invoice.id);

  if (!invoice.subscription) return;

  const subscription = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription.id;

  await supabase
    .from('user_platform_subscriptions')
    .update({
      status: 'past_due'
    })
    .eq('stripe_subscription_id', subscription);
}

async function handlePackPurchase(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log('Handling pack purchase:', paymentIntent.id);

  const userId = paymentIntent.metadata.supabase_user_id;
  const packSize = parseInt(paymentIntent.metadata.pack_size);
  const sessionsGranted = parseInt(paymentIntent.metadata.sessions_granted);

  if (!userId) {
    console.error('No user ID in payment intent metadata');
    return;
  }

  // Record purchase
  const { error: purchaseError } = await supabase
    .from('session_pack_purchases')
    .insert({
      user_id: userId,
      pack_size: packSize,
      price_paid_pence: paymentIntent.amount,
      sessions_granted: sessionsGranted,
      stripe_payment_intent_id: paymentIntent.id,
      purchased_at: new Date().toISOString()
    });

  if (purchaseError) {
    console.error('Error recording purchase:', purchaseError);
    return;
  }

  // Add bonus sessions to current quota
  const now = new Date().toISOString();
  const { data: quota } = await supabase
    .from('voice_session_quotas')
    .select('*')
    .eq('user_id', userId)
    .lte('period_start', now)
    .gte('period_end', now)
    .single();

  if (quota) {
    await supabase
      .from('voice_session_quotas')
      .update({
        bonus_sessions: (quota.bonus_sessions || 0) + sessionsGranted
      })
      .eq('id', quota.id);

    console.log('Added bonus sessions to quota:', sessionsGranted);
  }
}
