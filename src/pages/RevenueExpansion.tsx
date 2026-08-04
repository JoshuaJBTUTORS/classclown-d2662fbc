import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { RefreshCw, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';

const monthLabel = (m: string) =>
  new Date(`${m}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

const RevenueExpansion = () => {
  const { toast } = useToast();
  const [account, setAccount] = useState<ExpansionAccount>('both');
  const [months, setMonths] = useState(12);
  const [moverMonth, setMoverMonth] = useState<string | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const { data, isLoading, error, refetch } = useStripeExpansionMetrics(account, months, moverMonth);

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
    contractionNeg: -s.contraction,
    churnNeg: -s.churn,
  }));

  const latest = data?.series?.[data.series.length - 1];

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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      expansion: 'bg-emerald-100 text-emerald-800',
      new: 'bg-blue-100 text-blue-800',
      contraction: 'bg-amber-100 text-amber-800',
      churned: 'bg-rose-100 text-rose-800',
    };
    return <Badge className={`${map[status] ?? ''} border-0 capitalize`}>{status}</Badge>;
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
          <Select value={String(months)} onValueChange={(v) => { setMonths(Number(v)); setMoverMonth(undefined); }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  {latest ? monthLabel(latest.month) : ''} vs previous month
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
                <p className="text-xs text-muted-foreground mt-1">From existing customers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contraction + Churn</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600">
                  {fmt((latest?.contraction ?? 0) + (latest?.churn ?? 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmt(latest?.contraction ?? 0)} down-spend, {fmt(latest?.churn ?? 0)} lost
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
                  {latest?.customerCount ?? 0} paying customers
                </p>
              </CardContent>
            </Card>
          </div>

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
              <CardTitle className="text-base">Expansion vs contraction and churn</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => fmt(Math.abs(Number(v)))} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" />
                  <Bar dataKey="expansion" name="Expansion" stackId="a" fill="#10b981" />
                  <Bar dataKey="newRevenue" name="New" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="contractionNeg" name="Contraction" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="churnNeg" name="Churn" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
};

export default RevenueExpansion;
