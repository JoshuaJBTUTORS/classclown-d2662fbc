import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import PageTitle from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Copy, ExternalLink, Loader2, Mail, Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SendOfferDialog from '@/components/tutors/SendOfferDialog';
import LoadingHand from '@/components/ui/loading-hand';

interface OfferRow {
  id: string;
  recipient_name: string;
  recipient_email: string;
  position: string;
  hourly_rate: number;
  start_date: string;
  min_hours_per_week: number;
  custom_intro: string | null;
  access_token: string;
  status: string;
  document_ref: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  created_at: string;
  tutor_id: string | null;
}

const statusColor = (s: string) => {
  switch (s) {
    case 'signed': return 'bg-green-100 text-green-800 border-green-300';
    case 'viewed': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'sent': return 'bg-amber-100 text-amber-800 border-amber-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function SentOffers() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutor_offers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load offers', description: error.message, variant: 'destructive' });
    } else {
      setOffers((data || []) as OfferRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return offers.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.recipient_name.toLowerCase().includes(q) ||
          o.recipient_email.toLowerCase().includes(q) ||
          (o.document_ref || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [offers, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { all: offers.length, sent: 0, viewed: 0, signed: 0 } as Record<string, number>;
    offers.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [offers]);

  const offerUrl = (o: OfferRow) => `https://classclowncrm.com/offer/${o.id}/${o.access_token}`;

  const copyLink = async (o: OfferRow) => {
    await navigator.clipboard.writeText(offerUrl(o));
    toast({ title: 'Link copied' });
  };

  const resend = async (o: OfferRow) => {
    setResendingId(o.id);
    try {
      const { error } = await supabase.functions.invoke('send-tutor-offer', {
        body: {
          recipientName: o.recipient_name,
          recipientEmail: o.recipient_email,
          position: o.position,
          hourlyRate: Number(o.hourly_rate),
          startDate: o.start_date,
          minHoursPerWeek: o.min_hours_per_week,
          customIntro: o.custom_intro || undefined,
          tutorId: o.tutor_id || undefined,
        },
      });
      if (error) throw error;
      toast({ title: 'Offer re-sent', description: `Email sent to ${o.recipient_email}` });
      load();
    } catch (e: any) {
      toast({ title: 'Failed to resend', description: e.message, variant: 'destructive' });
    } finally {
      setResendingId(null);
    }
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB') : '—';

  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/tutors')} title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageTitle title="Tutor Onboarding" subtitle="Track and send tutor offer letters" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setSendOpen(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Send Offer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {(['all', 'sent', 'viewed', 'signed'] as const).map((s) => (
          <Card
            key={s}
            className={`p-4 cursor-pointer ${statusFilter === s ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            <p className="text-xs uppercase text-muted-foreground">{s}</p>
            <p className="text-2xl font-bold">{counts[s] || 0}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search name, email or ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingHand />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No offers found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Signed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.recipient_name}</div>
                    <div className="text-xs text-muted-foreground">{o.recipient_email}</div>
                    <div className="text-[10px] text-muted-foreground">{o.document_ref}</div>
                  </TableCell>
                  <TableCell>{o.position}</TableCell>
                  <TableCell>£{Number(o.hourly_rate).toFixed(2)}</TableCell>
                  <TableCell>{fmtDate(o.start_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(o.status)}>{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{fmtDate(o.sent_at || o.created_at)}</TableCell>
                  <TableCell className="text-sm">{fmtDate(o.signed_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => copyLink(o)} title="Copy link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Open offer">
                        <a href={offerUrl(o)} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {o.status !== 'signed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resend(o)}
                          disabled={resendingId === o.id}
                          title="Resend email"
                        >
                          {resendingId === o.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Mail className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <SendOfferDialog
        isOpen={sendOpen}
        onClose={() => { setSendOpen(false); load(); }}
      />
    </main>
  );
}
