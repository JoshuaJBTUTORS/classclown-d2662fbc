import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AccountKey = 'main' | 'proposal';
type WindowKey = '7d' | '30d' | '90d' | 'mtd' | 'all';

interface AccountMetrics {
  account: AccountKey;
  churnRate: number;
  canceledCount: number;
  activeAtStart: number;
  activeNow: number;
  totalRevenue: number; // in major units, primary currency
  payingCustomers: number;
  arpu: number;
  currency: string;
  topCustomers: Array<{ id: string; email: string | null; name: string | null; totalSpent: number; currency: string }>;
  truncated: boolean;
}

function windowStart(window: WindowKey): number | null {
  const now = Date.now();
  switch (window) {
    case '7d': return Math.floor((now - 7 * 86400000) / 1000);
    case '30d': return Math.floor((now - 30 * 86400000) / 1000);
    case '90d': return Math.floor((now - 90 * 86400000) / 1000);
    case 'mtd': {
      const d = new Date();
      return Math.floor(new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000);
    }
    case 'all': return null;
  }
}

const MAX_PAGES = 10; // 1000 records per metric per account

async function computeForAccount(stripe: Stripe, account: AccountKey, window: WindowKey): Promise<AccountMetrics> {
  const startTs = windowStart(window);

  // --- Subscriptions: walk all (paginated) to compute churn and active counts ---
  let canceledInWindow = 0;
  let activeAtStart = 0;
  let activeNow = 0;
  let subPages = 0;
  let subTruncated = false;

  for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100 })) {
    if (subPages === 0) {
      // pseudo-pager: stripe SDK auto-paginates here
    }
    // active now
    if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due') {
      activeNow++;
    }
    // canceled within window
    if (sub.canceled_at && (startTs === null || sub.canceled_at >= startTs)) {
      canceledInWindow++;
    }
    // active at window start: created before startTs AND (not canceled OR canceled after startTs)
    if (startTs === null) {
      // "all time" — active at start = 0 baseline; use createdcount instead
      activeAtStart++;
    } else if (sub.created < startTs && (!sub.canceled_at || sub.canceled_at >= startTs)) {
      activeAtStart++;
    }
    subPages++;
    if (subPages >= MAX_PAGES * 100) { subTruncated = true; break; }
  }

  const churnRate = activeAtStart > 0 ? (canceledInWindow / activeAtStart) * 100 : 0;

  // --- Charges: aggregate succeeded charges by customer ---
  const customerTotals = new Map<string, { amount: number; currency: string }>();
  let totalRevenueMinor = 0;
  let primaryCurrency = 'gbp';
  let chargeCount = 0;
  let chargeTruncated = false;

  const chargeListParams: Stripe.ChargeListParams = { limit: 100 };
  if (startTs !== null) chargeListParams.created = { gte: startTs };

  for await (const charge of stripe.charges.list(chargeListParams)) {
    if (!charge.paid || charge.status !== 'succeeded') { chargeCount++; continue; }
    const net = charge.amount - (charge.amount_refunded || 0);
    if (net <= 0) { chargeCount++; continue; }
    totalRevenueMinor += net;
    primaryCurrency = charge.currency || primaryCurrency;
    if (charge.customer && typeof charge.customer === 'string') {
      const existing = customerTotals.get(charge.customer) || { amount: 0, currency: charge.currency };
      existing.amount += net;
      customerTotals.set(charge.customer, existing);
    }
    chargeCount++;
    if (chargeCount >= MAX_PAGES * 100) { chargeTruncated = true; break; }
  }

  const payingCustomers = customerTotals.size;
  const totalRevenue = totalRevenueMinor / 100;
  const arpu = payingCustomers > 0 ? totalRevenue / payingCustomers : 0;

  // Top 10 customers by spend
  const topEntries = Array.from(customerTotals.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10);

  const topCustomers = await Promise.all(
    topEntries.map(async ([id, info]) => {
      try {
        const c = await stripe.customers.retrieve(id) as Stripe.Customer;
        return {
          id,
          email: c.deleted ? null : (c.email ?? null),
          name: c.deleted ? null : (c.name ?? null),
          totalSpent: info.amount / 100,
          currency: info.currency,
        };
      } catch {
        return { id, email: null, name: null, totalSpent: info.amount / 100, currency: info.currency };
      }
    })
  );

  return {
    account,
    churnRate: Math.round(churnRate * 10) / 10,
    canceledCount: canceledInWindow,
    activeAtStart,
    activeNow,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    payingCustomers,
    arpu: Math.round(arpu * 100) / 100,
    currency: primaryCurrency,
    topCustomers,
    truncated: subTruncated || chargeTruncated,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabaseAuth.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify admin/owner role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'owner');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const window: WindowKey = (body.window as WindowKey) || '30d';
    const account: 'main' | 'proposal' | 'both' = body.account || 'both';

    const tasks: Promise<AccountMetrics>[] = [];
    if (account === 'main' || account === 'both') {
      const key = Deno.env.get('STRIPE_SECRET_KEY');
      if (key) {
        const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
        tasks.push(computeForAccount(stripe, 'main', window));
      }
    }
    if (account === 'proposal' || account === 'both') {
      const key = Deno.env.get('STRIPE_SECRET_KEY_LESSON_PROPOSAL');
      if (key) {
        const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
        tasks.push(computeForAccount(stripe, 'proposal', window));
      }
    }

    const results = await Promise.all(tasks.map(p => p.catch((e) => ({ error: String(e?.message || e) }))));

    return new Response(JSON.stringify({ window, account, results, generatedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('get-stripe-admin-metrics error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
