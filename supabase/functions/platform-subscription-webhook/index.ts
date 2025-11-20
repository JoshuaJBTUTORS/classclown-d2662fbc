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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.purchase_type === 'bonus_minutes') {
          await handleBonusMinutesPurchase(supabaseAdmin, session);
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

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id);

  const userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    console.error('No user ID in subscription metadata');
    return;
  }

  // Get current DB subscription
  const { data: dbSub } = await supabase
    .from('user_platform_subscriptions')
    .select('*, plan:platform_subscription_plans(*)')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  // Check if plan changed (upgrade/downgrade)
  const newPlanName = subscription.metadata.plan_name;
  let planChanged = false;
  
  if (newPlanName && dbSub && dbSub.plan.name !== newPlanName) {
    console.log('Plan change detected:', dbSub.plan.name, '->', newPlanName);
    planChanged = true;
    
    // Get new plan ID
    const { data: newPlan } = await supabase
      .from('platform_subscription_plans')
      .select('id, voice_minutes_per_month')
      .eq('name', newPlanName)
      .single();
    
    if (newPlan) {
      // Update plan_id
      await supabase
        .from('user_platform_subscriptions')
        .update({ plan_id: newPlan.id })
        .eq('stripe_subscription_id', subscription.id);

      // Update current period quota
      const now = new Date().toISOString();
      const { data: currentQuota } = await supabase
        .from('voice_session_quotas')
        .select('*')
        .eq('user_id', userId)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();

      if (currentQuota) {
        const minutesDifference = newPlan.voice_minutes_per_month - currentQuota.total_minutes_allowed;
        
        await supabase
          .from('voice_session_quotas')
          .update({
            total_minutes_allowed: newPlan.voice_minutes_per_month,
            minutes_remaining: Math.max(0, currentQuota.minutes_remaining + minutesDifference)
          })
          .eq('id', currentQuota.id);

        console.log('Updated quota for plan change. Difference:', minutesDifference);
      }
    }
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

  // On renewal, create new quota period (skip if plan just changed)
  if (subscription.status === 'active' && !planChanged) {
    const { data: freshDbSub } = await supabase
      .from('user_platform_subscriptions')
      .select('*, plan:platform_subscription_plans(*)')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (freshDbSub) {
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
            total_minutes_allowed: freshDbSub.plan.voice_minutes_per_month,
            minutes_used: 0,
            minutes_remaining: freshDbSub.plan.voice_minutes_per_month,
            bonus_minutes: 0
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

async function handleBonusMinutesPurchase(supabase: any, session: Stripe.Checkout.Session) {
  console.log('Handling bonus minutes purchase:', session.id);

  const userId = session.metadata?.supabase_user_id;
  const bonusMinutes = parseInt(session.metadata?.bonus_minutes || '0');

  if (!userId || !bonusMinutes) {
    console.error('Missing user ID or bonus minutes in metadata');
    return;
  }

  // Get user's current quota
  const now = new Date().toISOString();
  const { data: currentQuota } = await supabase
    .from('voice_session_quotas')
    .select('*')
    .eq('user_id', userId)
    .lte('period_start', now)
    .gte('period_end', now)
    .single();

  if (currentQuota) {
    // Add bonus minutes
    const { error } = await supabase
      .from('voice_session_quotas')
      .update({
        bonus_minutes: currentQuota.bonus_minutes + bonusMinutes
      })
      .eq('id', currentQuota.id);

    if (error) {
      console.error('Error updating bonus minutes:', error);
    } else {
      console.log(`Added ${bonusMinutes} bonus minutes to user ${userId}`);
    }
  } else {
    console.error('No active quota found for user:', userId);
  }
}

