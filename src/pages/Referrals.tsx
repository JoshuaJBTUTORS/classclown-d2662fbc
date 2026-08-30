import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AddReferralDialog from '@/components/referrals/AddReferralDialog';
import LoadingHand from '@/components/ui/loading-hand';

interface ReferralRow {
  id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  friend_name: string;
  friend_email: string | null;
  friend_phone: string | null;
  child_name: string | null;
  notes: string | null;
  status: string;
  source: string;
  referral_code: string | null;
  created_at: string;
}

const STATUSES = ['invited', 'trial_booked', 'joined', 'reward_paid'] as const;

const STATUS_LABELS: Record<string, string> = {
  invited: 'Invited',
  trial_booked: 'Trial booked',
  joined: 'Joined',
  reward_paid: 'Reward paid',
};

const statusVariant = (status: string) => {
  switch (status) {
    case 'joined':
      return 'default' as const;
    case 'reward_paid':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

const Referrals: React.FC = () => {
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('referrals')
      .select(
        'id, referrer_name, referrer_email, friend_name, friend_email, friend_phone, child_name, notes, status, source, referral_code, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load referrals:', error);
      toast.error('Could not load referrals');
    }
    setRows((data as ReferralRow[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const previous = rows;
    setRows((current) => current.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from('referrals').update({ status }).eq('id', id);
    if (error) {
      console.error('Failed to update referral status:', error);
      toast.error('Could not update status');
      setRows(previous);
      return;
    }
    toast.success('Status updated');
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!term) return true;
      return [r.referrer_name, r.referrer_email, r.friend_name, r.friend_email, r.friend_phone, r.referral_code]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      trialBooked: count('trial_booked'),
      joined: count('joined'),
      rewardPaid: count('reward_paid'),
    };
  }, [rows]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; total: number; joined: number }>();
    rows.forEach((r) => {
      const key = r.referrer_email || r.referrer_name || 'Unknown';
      const entry = map.get(key) || { name: r.referrer_name || key, total: 0, joined: 0 };
      entry.total += 1;
      if (r.status === 'joined' || r.status === 'reward_paid') entry.joined += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [rows]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Referrals</h1>
        </div>
        <AddReferralDialog onCreated={load} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total referrals', value: stats.total },
          { label: 'Trial booked', value: stats.trialBooked },
          { label: 'Joined', value: stats.joined },
          { label: 'Reward paid', value: stats.rewardPaid },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All referrals</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Search name, email or code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingHand />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No referrals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Friend</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(r.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.referrer_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{r.referrer_email}</div>
                        {r.referral_code && (
                          <Badge variant="outline" className="mt-1">
                            {r.referral_code}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.friend_name}</div>
                        {r.child_name && (
                          <div className="text-xs text-muted-foreground">Child: {r.child_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{r.friend_email || '—'}</div>
                        <div className="text-xs text-muted-foreground">{r.friend_phone || '—'}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.source}</TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                          <SelectTrigger className="w-40">
                            <SelectValue>
                              <Badge variant={statusVariant(r.status)}>
                                {STATUS_LABELS[r.status] || r.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top referrers</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((l) => (
                <div key={l.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {l.total} referred · {l.joined} joined
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;
