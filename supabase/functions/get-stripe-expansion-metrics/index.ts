import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AccountFilter = 'main' | 'proposal' | 'both';

interface Row {
  account: string;
  stripe_customer_id: string;
  customer_email: string | null;
  customer_name: string | null;
  month: string;
  amount: number;
  currency: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const account: AccountFilter = body.account || 'both';
    const months: number = Math.min(Math.max(Number(body.months) || 12, 2), 60);

    // Earliest month we care about
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
    const startMonth = startDate.toISOString().slice(0, 10);

    let query = supabaseAdmin
      .from('stripe_customer_monthly_revenue')
      .select('account, stripe_customer_id, customer_email, customer_name, month, amount, currency')
      .gte('month', startMonth)
      .order('month', { ascending: true })
      .limit(50000);

    if (account !== 'both') query = query.eq('account', account);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Row[];

    // Dominant currency
    const currencyTotals = new Map<string, number>();
    for (const r of rows) {
      currencyTotals.set(r.currency, (currencyTotals.get(r.currency) || 0) + Number(r.amount));
    }
    const currency =
      Array.from(currencyTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'gbp';
    const mixedCurrency = currencyTotals.size > 1;

    // month -> customerKey -> amount
    const byMonth = new Map<string, Map<string, number>>();
    const meta = new Map<string, { email: string | null; name: string | null; account: string }>();

    for (const r of rows) {
      // Key on the Stripe customer id only. The same customer id can appear under
      // both account labels when they point at the same Stripe account, and
      // counting it twice would double every figure on the page.
      const key = r.stripe_customer_id;
      if (!meta.has(key)) {
        meta.set(key, { email: r.customer_email, name: r.customer_name, account: r.account });
      } else if (r.customer_email || r.customer_name) {
        meta.set(key, { email: r.customer_email, name: r.customer_name, account: r.account });
      }
      let m = byMonth.get(r.month);
      if (!m) {
        m = new Map();
        byMonth.set(r.month, m);
      }
      // Take the larger of the duplicated rows rather than summing them.
      m.set(key, Math.max(m.get(key) || 0, Number(r.amount)));
    }

    // Build a continuous month list
    const monthList: string[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + i, 1));
      if (d > now) break;
      monthList.push(d.toISOString().slice(0, 10));
    }

    const round = (n: number) => Math.round(n * 100) / 100;

    const series = monthList.map((month, idx) => {
      const cur = byMonth.get(month) ?? new Map<string, number>();
      const prev = idx > 0 ? byMonth.get(monthList[idx - 1]) ?? new Map<string, number>() : new Map<string, number>();

      let startingRevenue = 0;
      let expansion = 0;
      let contraction = 0;
      let churn = 0;
      let newRevenue = 0;

      for (const [key, prevAmount] of prev.entries()) {
        startingRevenue += prevAmount;
        const curAmount = cur.get(key) || 0;
        if (curAmount === 0) churn += prevAmount;
        else if (curAmount > prevAmount) expansion += curAmount - prevAmount;
        else if (curAmount < prevAmount) contraction += prevAmount - curAmount;
      }
      for (const [key, curAmount] of cur.entries()) {
        if (!prev.has(key)) newRevenue += curAmount;
      }

      const retained = startingRevenue + expansion - contraction - churn;
      const totalRevenue = Array.from(cur.values()).reduce((s, v) => s + v, 0);

      return {
        month,
        startingRevenue: round(startingRevenue),
        expansion: round(expansion),
        contraction: round(contraction),
        churn: round(churn),
        newRevenue: round(newRevenue),
        totalRevenue: round(totalRevenue),
        nrr: startingRevenue > 0 ? Math.round((retained / startingRevenue) * 1000) / 10 : null,
        grr:
          startingRevenue > 0
            ? Math.round(((startingRevenue - contraction - churn) / startingRevenue) * 1000) / 10
            : null,
        customerCount: cur.size,
      };
    });

    // Top movers for the requested month (default: latest month with data)
    const requestedMonth: string =
      body.month && monthList.includes(body.month) ? body.month : monthList[monthList.length - 1];
    const moverIdx = monthList.indexOf(requestedMonth);
    const curM = byMonth.get(requestedMonth) ?? new Map<string, number>();
    const prevM =
      moverIdx > 0 ? byMonth.get(monthList[moverIdx - 1]) ?? new Map<string, number>() : new Map<string, number>();

    const moverKeys = new Set<string>([...curM.keys(), ...prevM.keys()]);
    const movers = Array.from(moverKeys)
      .map((key) => {
        const current = curM.get(key) || 0;
        const previous = prevM.get(key) || 0;
        const info = meta.get(key)!;
        const delta = current - previous;
        let status: 'expansion' | 'contraction' | 'churned' | 'new' | 'flat';
        if (previous === 0) status = 'new';
        else if (current === 0) status = 'churned';
        else if (delta > 0) status = 'expansion';
        else if (delta < 0) status = 'contraction';
        else status = 'flat';
        return {
          key,
          account: info?.account ?? 'main',
          email: info?.email ?? null,
          name: info?.name ?? null,
          previous: round(previous),
          current: round(current),
          delta: round(delta),
          percentChange: previous > 0 ? Math.round((delta / previous) * 1000) / 10 : null,
          status,
        };
      })
      .filter((m) => m.status !== 'flat')
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 50);

    // Per-customer expansion detail for the requested month, from the deduped view
    const { data: customerRows, error: custErr } = await supabaseAdmin
      .from('stripe_customer_expansion')
      .select(
        'stripe_customer_id, customer_email, customer_name, currency, month, joined_month, starting_mrr, previous_mrr, current_mrr, expansion_mrr, contraction_mrr, cumulative_expansion',
      )
      .eq('month', requestedMonth)
      .limit(5000);
    if (custErr) console.error('customer expansion view error:', custErr.message);

    const customers = (customerRows ?? []).map((c: any) => ({
      stripeCustomerId: c.stripe_customer_id,
      email: c.customer_email,
      name: c.customer_name,
      currency: c.currency,
      month: c.month,
      joinedMonth: c.joined_month,
      startingMrr: round(Number(c.starting_mrr)),
      previousMrr: round(Number(c.previous_mrr)),
      currentMrr: round(Number(c.current_mrr)),
      expansionMrr: round(Number(c.expansion_mrr)),
      contractionMrr: round(Number(c.contraction_mrr)),
      cumulativeExpansion: round(Number(c.cumulative_expansion)),
    }));

    return new Response(
      JSON.stringify({
        account,
        months,
        currency,
        mixedCurrency,
        series,
        moverMonth: requestedMonth,
        movers,
        customerMonth: requestedMonth,
        customers,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error: any) {
    console.error('get-stripe-expansion-metrics error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
