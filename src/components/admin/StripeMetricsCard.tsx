import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, TrendingDown, DollarSign, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  useStripeAdminMetrics,
  type StripeAccount,
  type StripeWindow,
  type StripeAccountMetrics,
} from '@/hooks/useStripeAdminMetrics';

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(amount);

const isMetric = (r: any): r is StripeAccountMetrics => r && typeof r.churnRate === 'number';

const AccountPanel = ({ metrics, label }: { metrics: StripeAccountMetrics; label: string }) => {
  const [showTop, setShowTop] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{metrics.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.canceledCount} canceled / {metrics.activeAtStart} active at start
            </p>
            <p className="text-xs text-muted-foreground">{metrics.activeNow} active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Spend per Customer</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formatMoney(metrics.arpu, metrics.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMoney(metrics.totalRevenue, metrics.currency)} from {metrics.payingCustomers} customers
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics.topCustomers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowTop((s) => !s)}
              className="flex items-center justify-between w-full text-left"
            >
              <CardTitle className="text-sm font-medium">Top Spenders ({label})</CardTitle>
              {showTop ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CardHeader>
          {showTop && (
            <CardContent>
              <div className="space-y-2">
                {metrics.topCustomers.map((c, i) => (
                  <div key={c.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground w-6">#{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name || c.email || c.id}</div>
                        {c.name && c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                      </div>
                    </div>
                    <div className="font-semibold text-primary">{formatMoney(c.totalSpent, c.currency)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {metrics.truncated && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Results truncated at 1000 records — figures are an approximation.
        </p>
      )}
    </div>
  );
};

export const StripeMetricsCard = () => {
  const [account, setAccount] = useState<StripeAccount>('main');
  const [window, setWindow] = useState<StripeWindow>('30d');
  const { data, isLoading, isFetching, error, refetch } = useStripeAdminMetrics(account, window);

  const accountLabel = (a: 'main' | 'proposal') => (a === 'main' ? 'Main' : 'Lesson Proposals');

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Stripe Metrics</CardTitle>
            {data?.generatedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Updated {new Date(data.generatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={account} onValueChange={(v) => setAccount(v as StripeAccount)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main account</SelectItem>
                <SelectItem value="proposal">Lesson Proposals</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            <Select value={window} onValueChange={(v) => setWindow(v as StripeWindow)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="mtd">Month to date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Failed to load Stripe metrics. {(error as Error).message}
          </div>
        ) : data && data.results.length > 0 ? (
          data.results.length === 1 ? (
            isMetric(data.results[0]) ? (
              <AccountPanel metrics={data.results[0]} label={accountLabel(data.results[0].account)} />
            ) : (
              <p className="text-sm text-destructive">{(data.results[0] as any).error}</p>
            )
          ) : (
            <Tabs defaultValue={isMetric(data.results[0]) ? data.results[0].account : 'main'}>
              <TabsList>
                {data.results.map((r, idx) =>
                  isMetric(r) ? (
                    <TabsTrigger key={r.account} value={r.account}>
                      {accountLabel(r.account)}
                    </TabsTrigger>
                  ) : (
                    <TabsTrigger key={idx} value={`err-${idx}`} disabled>Error</TabsTrigger>
                  )
                )}
              </TabsList>
              {data.results.map((r, idx) =>
                isMetric(r) ? (
                  <TabsContent key={r.account} value={r.account}>
                    <AccountPanel metrics={r} label={accountLabel(r.account)} />
                  </TabsContent>
                ) : (
                  <TabsContent key={idx} value={`err-${idx}`}>
                    <p className="text-sm text-destructive">{(r as any).error}</p>
                  </TabsContent>
                )
              )}
            </Tabs>
          )
        ) : (
          <p className="text-sm text-muted-foreground">No data available.</p>
        )}
      </CardContent>
    </Card>
  );
};
