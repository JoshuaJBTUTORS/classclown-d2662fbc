import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageTitle from '@/components/ui/PageTitle';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  useStripeExpansionMetrics,
  type ExpansionAccount,
} from '@/hooks/useStripeExpansionMetrics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, AlertCircle } from 'lucide-react';

const monthLabel = (m: string) =>
  new Date(`${m}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

const lastCompleteMonthKey = () => {
  const n = new Date();
  const d = new Date(Date.UTC(n.getFullYear(), n.getMonth() - 1, 1));
  return d.toISOString().slice(0, 10);
};

const RevenueExpansion = () => {
  const { toast } = useToast();
  const [account, setAccount] = useState<ExpansionAccount>('both');
  const [months, setMonths] = useState(12);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'cumulative' | 'current' | 'expansion' | 'contraction'>('cumulative');

  const { data, isLoading, error, refetch } = useStripeExpansionMetrics(
    account,
    months,
    lastCompleteMonthKey(),
  );


  const fmt = useMemo(() => {
    const code = (data?.currency || 'gbp').toUpperCase();
    return (n: number) =>
      new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      }).format(n);
  }, [data?.currency]);

  const chartData = (data?.series ?? []).map((s) => ({
    ...s,
    label: monthLabel(s.month),
  }));

  const series = data?.series ?? [];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentPartial = series.find((s) => s.month === currentMonthKey);
  // Tiles describe the last completed month; the in-progress month is shown separately
  // so a mid-month figure is never mistaken for a full month.
  const latest = [...series].reverse().find((s) => s.month !== currentMonthKey) ?? currentPartial;

  const runSync = async (mode: 'backfill' | 'recent') => {
    setSyncing(true);
    setSyncStatus(mode === 'backfill' ? 'Starting history import...' : 'Refreshing recent months...');
    try {
      if (mode === 'recent') {
        const { data: res, error: err } = await supabase.functions.invoke('sync-stripe-customer-revenue', {
          body: { mode: 'recent', account: 'both' },
        });
        if (err) throw err;
        if ((res as any)?.error) throw new Error((res as any).error);
        setSyncStatus('Recent months refreshed.');
      } else {
        // Backfill runs in bounded slices; keep calling until both accounts report complete
        for (let i = 0; i < 60; i++) {
          setSyncStatus(`Importing history... (pass ${i + 1})`);
          const { data: res, error: err } = await supabase.functions.invoke(
            'sync-stripe-customer-revenue',
            { body: { mode: 'backfill', account: 'both' } },
          );
          if (err) throw err;
          if ((res as any)?.error) throw new Error((res as any).error);
          const results = (res as any)?.results ?? [];
          const active = results.filter((r: any) => !r.skipped);
          if (active.length === 0 || active.every((r: any) => r.complete)) break;
        }
        setSyncStatus('History import complete.');
      }
      toast({ title: 'Stripe sync finished', description: 'Revenue snapshots are up to date.' });
      await refetch();
    } catch (e: any) {
      console.error('Stripe revenue sync failed:', e);
      setSyncStatus('');
      toast({
        title: 'Sync failed',
        description: e?.message || 'Could not sync Stripe revenue.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const customers = data?.customers ?? [];

  const visibleCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? customers.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            c.stripeCustomerId.toLowerCase().includes(q),
        )
      : customers;
    const key = {
      cumulative: (c: any) => c.cumulativeExpansion,
      current: (c: any) => c.currentMrr,
      expansion: (c: any) => c.expansionMrr,
      contraction: (c: any) => c.contractionMrr,
    }[sortBy];
    return [...filtered].sort((a, b) => key(b) - key(a));
  }, [customers, search, sortBy]);

  const exportCsv = () => {
    const header = [
      'Customer',
      'Email',
      'Stripe customer id',
      'Joined',
      'Starting MRR',
      'Previous MRR',
      'Current MRR',
      'Expansion MRR',
      'Contraction MRR',
      'Cumulative expansion',
    ];
    const rows = visibleCustomers.map((c) => [
      c.name ?? '',
      c.email ?? '',
      c.stripeCustomerId,
      c.joinedMonth,
      c.startingMrr,
      c.previousMrr,
      c.currentMrr,
      c.expansionMrr,
      c.contractionMrr,
      c.cumulativeExpansion,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-expansion-${data?.customerMonth ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <PageTitle title="Revenue Expansion" />
          <p className="text-muted-foreground mt-2">
            How much existing Stripe customers grow, shrink, or churn month over month.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={account} onValueChange={(v) => setAccount(v as ExpansionAccount)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both accounts</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
              <SelectItem value="36">Last 36 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={syncing} onClick={() => runSync('recent')}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync now
          </Button>
          <Button variant="secondary" size="sm" disabled={syncing} onClick={() => runSync('backfill')}>
            Import full history
          </Button>
        </div>
      </div>

      {syncStatus && <p className="text-sm text-muted-foreground mb-4">{syncStatus}</p>}

      {data?.mixedCurrency && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">
          <AlertCircle className="h-4 w-4" />
          Multiple currencies detected. Figures are shown in {data.currency.toUpperCase()}, the dominant currency.
        </div>
      )}

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">
            {(error as any)?.message || 'Failed to load expansion metrics.'}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue Retention</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {latest?.nrr != null ? `${latest.nrr}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {latest ? `${monthLabel(latest.month)} (full month)` : ''} vs previous month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expansion</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{fmt(latest?.expansion ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From existing customers{latest ? ` in ${monthLabel(latest.month)}` : ''}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Revenue</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground rotate-180" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{fmt(latest?.newRevenue ?? 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {latest?.customerCount ?? 0} paying customers{latest ? ` in ${monthLabel(latest.month)}` : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {currentPartial && currentPartial.month !== latest?.month && (
            <div className="text-sm text-muted-foreground bg-muted/50 border rounded-md p-3 mb-8">
              {monthLabel(currentPartial.month)} is still in progress:{' '}
              {fmt(currentPartial.totalRevenue)} collected so far from{' '}
              {currentPartial.customerCount} customers. It is included in the charts below but not
              in the tiles above.
            </div>
          )}


          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Net revenue retention over time</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(v: any) => (v == null ? '—' : `${v}%`)} />
                  <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                  <Legend />
                  <Line type="monotone" dataKey="nrr" name="NRR %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="grr" name="GRR %" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Expansion and new revenue</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => fmt(Math.abs(Number(v)))} />
                  <Legend />
                  <Bar dataKey="expansion" name="Expansion" stackId="a" fill="#10b981" />
                  <Bar dataKey="newRevenue" name="New" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">Customer expansion</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.customerMonth ? monthLabel(data.customerMonth) : ''} · {visibleCustomers.length} customers
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[220px]"
                />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cumulative">Cumulative expansion</SelectItem>
                    <SelectItem value="current">Current MRR</SelectItem>
                    <SelectItem value="expansion">Monthly expansion</SelectItem>
                    <SelectItem value="contraction">Monthly contraction</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={visibleCustomers.length === 0}>
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Starting</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Expansion</TableHead>
                      <TableHead className="text-right">Contraction</TableHead>
                      <TableHead className="text-right">Cumulative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                          No customer data for this month yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleCustomers.map((c) => (
                        <TableRow key={c.stripeCustomerId}>
                          <TableCell>
                            <div className="font-medium">{c.name || c.email || c.stripeCustomerId}</div>
                            {c.name && c.email && (
                              <div className="text-xs text-muted-foreground">{c.email}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {monthLabel(c.joinedMonth)}
                          </TableCell>
                          <TableCell className="text-right">{fmt(c.startingMrr)}</TableCell>
                          <TableCell className="text-right">{fmt(c.previousMrr)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(c.currentMrr)}</TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {c.expansionMrr > 0 ? fmt(c.expansionMrr) : '—'}
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {c.contractionMrr > 0 ? fmt(c.contractionMrr) : '—'}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              c.cumulativeExpansion > 0
                                ? 'text-emerald-600'
                                : c.cumulativeExpansion < 0
                                  ? 'text-destructive'
                                  : ''
                            }`}
                          >
                            {fmt(c.cumulativeExpansion)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>


        </>
      )}
    </div>
  );
};

export default RevenueExpansion;
