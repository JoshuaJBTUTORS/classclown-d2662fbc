import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AccountKey = 'main' | 'proposal';

const KEY_BY_ACCOUNT: Record<AccountKey, string> = {
  main: 'STRIPE_SECRET_KEY',
  proposal: 'STRIPE_SECRET_KEY_LESSON_PROPOSAL',
};

// Bucket a unix timestamp into the first day of its month (Europe/London calendar month)
function monthKey(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d);
  const year = parts.find((p) => p.type === 'year')!.value;
  const month = parts.find((p) => p.type === 'month')!.value;
  return `${year}-${month}-01`;
}

interface Bucket {
  amount: number; // minor units, net
  currency: string;
  invoiceCount: number;
}

async function syncSlice(
  stripe: Stripe,
  account: AccountKey,
  sinceTs: number,
  untilTs: number,
): Promise<{ rows: any[]; earliest: number | null; processed: number }> {
  // customerId -> month -> bucket
  const buckets = new Map<string, Map<string, Bucket>>();
  const customerMeta = new Map<string, { email: string | null; name: string | null }>();
  let earliest: number | null = null;
  let processed = 0;

  for await (const charge of stripe.charges.list({
    limit: 100,
    created: { gte: sinceTs, lt: untilTs },
    expand: ['data.customer'],
  })) {
    processed++;
    if (earliest === null || charge.created < earliest) earliest = charge.created;
    if (!charge.paid || charge.status !== 'succeeded') continue;

    const net = charge.amount - (charge.amount_refunded || 0);
    if (net <= 0) continue;

    let customerId: string | null = null;
    if (typeof charge.customer === 'string') {
      customerId = charge.customer;
    } else if (charge.customer && typeof charge.customer === 'object') {
      customerId = (charge.customer as Stripe.Customer).id;
      const c = charge.customer as Stripe.Customer;
      if (!c.deleted) {
        customerMeta.set(customerId, { email: c.email ?? null, name: c.name ?? null });
      }
    }
    // Fall back to grouping guest charges by billing email so they still show up
    if (!customerId) {
      const fallback = charge.billing_details?.email || charge.receipt_email;
      if (!fallback) continue;
      customerId = `guest:${fallback.toLowerCase()}`;
      if (!customerMeta.has(customerId)) {
        customerMeta.set(customerId, { email: fallback, name: charge.billing_details?.name ?? null });
      }
    }
    if (!customerMeta.has(customerId)) {
      customerMeta.set(customerId, {
        email: charge.billing_details?.email ?? charge.receipt_email ?? null,
        name: charge.billing_details?.name ?? null,
      });
    }

    const m = monthKey(charge.created);
    let byMonth = buckets.get(customerId);
    if (!byMonth) {
      byMonth = new Map();
      buckets.set(customerId, byMonth);
    }
    const existing = byMonth.get(m) || { amount: 0, currency: charge.currency, invoiceCount: 0 };
    existing.amount += net;
    existing.invoiceCount += 1;
    existing.currency = charge.currency || existing.currency;
    byMonth.set(m, existing);
  }

  // Fill in names/emails we still lack (cap lookups so we never blow the runtime budget)
  const missing = Array.from(buckets.keys()).filter(
    (id) => !id.startsWith('guest:') && !customerMeta.get(id)?.email && !customerMeta.get(id)?.name,
  );
  for (const id of missing.slice(0, 50)) {
    try {
      const c = (await stripe.customers.retrieve(id)) as Stripe.Customer;
      if (!c.deleted) customerMeta.set(id, { email: c.email ?? null, name: c.name ?? null });
    } catch {
      // ignore lookup failures
    }
  }

  const rows: any[] = [];
  for (const [customerId, byMonth] of buckets.entries()) {
    const meta = customerMeta.get(customerId) || { email: null, name: null };
    for (const [month, bucket] of byMonth.entries()) {
      rows.push({
        account,
        stripe_customer_id: customerId,
        customer_email: meta.email,
        customer_name: meta.name,
        month,
        amount: Math.round(bucket.amount) / 100,
        currency: bucket.currency,
        invoice_count: bucket.invoiceCount,
        synced_at: new Date().toISOString(),
      });
    }
  }

  return { rows, earliest, processed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const isCron = body?.cron === true;

    if (!isCron) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await supabaseAuth.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id);
      const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'owner');
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const mode: 'backfill' | 'recent' = body.mode === 'backfill' ? 'backfill' : 'recent';
    const requested: AccountKey[] =
      body.account === 'main' || body.account === 'proposal' ? [body.account] : ['main', 'proposal'];

    const results: any[] = [];
    const seenKeys = new Set<string>();

    for (const account of requested) {
      const key = Deno.env.get(KEY_BY_ACCOUNT[account]);
      if (!key) {
        results.push({ account, skipped: 'no_api_key' });
        continue;
      }
      // Both labels can point at the same Stripe account (post-migration).
      // Syncing it twice would duplicate every customer and double all metrics.
      if (seenKeys.has(key)) {
        results.push({ account, skipped: 'duplicate_api_key' });
        continue;
      }
      seenKeys.add(key);
      const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

      const { data: state } = await supabaseAdmin
        .from('stripe_revenue_sync_state')
        .select('*')
        .eq('account', account)
        .maybeSingle();

      const nowTs = Math.floor(Date.now() / 1000);
      let sinceTs: number;
      let untilTs: number;
      let done = false;

      if (mode === 'recent') {
        // Re-sync the current + previous month so late payments and refunds correct themselves
        const d = new Date();
        const prevMonthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
        sinceTs = Math.floor(prevMonthStart.getTime() / 1000);
        untilTs = nowTs;
        done = true;
      } else {
        // Walk backwards in 3-month slices from the oldest point we've reached so far
        const cursor = state?.backfilled_through
          ? Math.floor(new Date(state.backfilled_through).getTime() / 1000)
          : nowTs;
        untilTs = cursor;
        sinceTs = cursor - 92 * 86400;
        if (state?.backfill_complete) {
          results.push({ account, mode, complete: true, rowsUpserted: 0 });
          continue;
        }
      }

      await supabaseAdmin
        .from('stripe_revenue_sync_state')
        .upsert(
          { account, status: 'running', last_run_at: new Date().toISOString(), error: null },
          { onConflict: 'account' },
        );

      const { rows, earliest, processed } = await syncSlice(stripe, account, sinceTs, untilTs);

      if (rows.length > 0) {
        // Upsert in chunks to stay under payload limits
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await supabaseAdmin
            .from('stripe_customer_monthly_revenue')
            .upsert(rows.slice(i, i + 500), { onConflict: 'account,stripe_customer_id,month' });
          if (error) throw new Error(`upsert failed: ${error.message}`);
        }
      }

      if (mode === 'backfill') {
        // No charges at all in this slice and we're already past 2015 => nothing older exists
        const noMoreHistory = processed === 0 && sinceTs < Math.floor(new Date('2015-01-01').getTime() / 1000);
        done = noMoreHistory;
      }

      await supabaseAdmin.from('stripe_revenue_sync_state').upsert(
        {
          account,
          status: 'idle',
          last_run_at: new Date().toISOString(),
          error: null,
          ...(mode === 'backfill'
            ? {
                backfilled_through: new Date(sinceTs * 1000).toISOString(),
                backfill_complete: done,
                earliest_seen:
                  earliest !== null
                    ? new Date(
                        Math.min(
                          earliest,
                          state?.earliest_seen
                            ? Math.floor(new Date(state.earliest_seen).getTime() / 1000)
                            : earliest,
                        ) * 1000,
                      ).toISOString()
                    : state?.earliest_seen ?? null,
              }
            : {}),
        },
        { onConflict: 'account' },
      );

      results.push({
        account,
        mode,
        rowsUpserted: rows.length,
        chargesScanned: processed,
        sliceFrom: new Date(sinceTs * 1000).toISOString(),
        sliceTo: new Date(untilTs * 1000).toISOString(),
        complete: mode === 'backfill' ? done : true,
      });
    }

    return new Response(JSON.stringify({ results, generatedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('sync-stripe-customer-revenue error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
