import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminProposalSidebar } from '@/components/admin/AdminProposalSidebar';
import { Loader2, Plus, Copy, ExternalLink, Trash2, Pencil, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import ExtendOfferDialog from '@/components/proposals/ExtendOfferDialog';
import { resolveDiscountDeadline } from '@/components/proposals/discountDeadline';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { cn } from '@/lib/utils';

interface Proposal {
  id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  subject: string;
  lesson_type: string;
  price_per_lesson: number;
  payment_cycle: string;
  status: string;
  access_token: string;
  sent_at: string;
  viewed_at: string;
  agreed_at: string;
  completed_at: string;
  created_at: string;
  discount_deadline?: string | null;
}

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DoodleSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...stroke}>
    <path d="M11 4.2c3.6-.3 6.4 2.4 6.3 5.9-.1 3.3-2.8 5.8-6.1 5.7-3.4-.1-5.9-2.7-5.8-6C5.5 6.7 7.9 4.4 11 4.2z" />
    <path d="M15.4 14.6c1.6 1.5 3 3.1 4.3 4.9" />
  </svg>
);

const initials = (name?: string | null) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0].charAt(0)}${parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''}`.toUpperCase();
};

const avatarTones = [
  'bg-pastel-mint',
  'bg-pastel-lilac',
  'bg-pastel-butter',
  'bg-pastel-blush',
  'bg-pastel-sky',
];

const statusTones: Record<string, string> = {
  draft: 'bg-pastel-sand',
  sent: 'bg-pastel-sky',
  viewed: 'bg-pastel-lilac',
  agreed: 'bg-pastel-mint',
  completed: 'bg-foreground text-background',
  declined: 'bg-pastel-blush',
};

const gridCols =
  'xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,1fr)_92px_120px_120px_268px] xl:items-center xl:gap-4';

const iconButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50';


export default function ProposalDashboard() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [extendTarget, setExtendTarget] = useState<Proposal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProposals();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);


  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProposals(data || []);
    } catch (error: any) {
      console.error('Error loading proposals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyProposalLink = async (proposal: Proposal) => {
    const baseUrl = 'https://classclowncrm.com';
    const proposalUrl = `${baseUrl}/proposal/${proposal.id}/${proposal.access_token}`;

    try {
      await navigator.clipboard.writeText(proposalUrl);
      toast({
        title: 'Link Copied',
        description: 'Proposal link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const resendProposal = async (proposal: Proposal) => {
    setResendingId(proposal.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-proposal-email', {
        body: {
          proposalId: proposal.id,
          recipientEmail: proposal.recipient_email,
          recipientName: proposal.recipient_name,
          recipientPhone: proposal.recipient_phone,
        },
      });

      if (error) throw error;

      // Build detailed success message
      let successMessage = `✉️ Email sent to ${proposal.recipient_email}`;
      if (data?.whatsappSent && proposal.recipient_phone) {
        successMessage += `\n📱 WhatsApp sent to ${proposal.recipient_phone}`;
      } else if (proposal.recipient_phone) {
        successMessage += `\n❌ WhatsApp failed: ${data?.whatsappError || 'Unknown error'}`;
      }

      toast({
        title: 'Proposal Resent',
        description: successMessage,
      });
    } catch (error: any) {
      console.error('Error resending proposal:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend proposal',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  };

  const deleteProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: 'Proposal deleted successfully',
      });

      loadProposals();
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete proposal',
        variant: 'destructive',
      });
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedProposals = filteredProposals.slice(pageStart, pageStart + PAGE_SIZE);

  const statePanel = (content: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-soft)] bg-pastel-sand/60 px-6 py-14 text-center">
      {content}
    </div>
  );


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminProposalSidebar
          totalProposals={proposals.length}
          filteredCount={filteredProposals.length}
        />

        <div className="min-w-0 w-full flex-1">
          <header className="sticky top-0 z-10 flex h-12 items-center border-b border-foreground/10 bg-background">
            <SidebarTrigger className="ml-2 rounded-full" />
          </header>

          <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Lesson Proposals
                </h1>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/proposals/create')}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Create Proposal
              </button>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <span className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/70 text-foreground">
                  <DoodleSearch className="h-4 w-4" />
                </span>
                <input
                  placeholder="Search by name, email, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-full border-2 border-foreground bg-transparent pl-12 pr-5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-foreground/[0.03]"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-12 w-full rounded-full border-2 border-foreground bg-transparent px-5 text-sm font-semibold sm:w-56">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-foreground">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="agreed">Agreed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* List surface */}
            <div className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              {loading ? (
                statePanel(<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />)
              ) : proposals.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No proposals created yet</p>
                  </>
                )
              ) : filteredProposals.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">
                      No proposals match your filters
                    </p>
                  </>
                )
              ) : (
                <div className="space-y-2">
                  <div className={cn('hidden px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:grid', gridCols)}>
                    <span>Recipient</span>
                    <span>Subject</span>
                    <span>Lesson Type</span>
                    <span className="text-right">Price</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">Sent</span>
                    <span className="text-right">Actions</span>
                  </div>

                  {pagedProposals.map((proposal, i) => {

                    const deadline = resolveDiscountDeadline(proposal);
                    const expired = deadline <= Date.now();
                    return (
                      <div
                        key={proposal.id}
                        className={cn(
                          'grid grid-cols-1 items-center gap-2 rounded-[1.25rem] bg-pastel-sand/40 px-4 py-3.5 transition-colors duration-200 hover:bg-pastel-sky/60 xl:min-h-[68px]',
                          gridCols
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-foreground',
                              avatarTones[i % avatarTones.length]
                            )}
                          >
                            {initials(proposal.recipient_name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-tight text-foreground">
                              {proposal.recipient_name}
                            </p>
                            <p className="truncate text-sm leading-tight text-muted-foreground">
                              {proposal.recipient_email}
                            </p>
                          </div>
                        </div>

                        <span
                          title={proposal.subject}
                          className="truncate pl-12 text-sm text-foreground xl:pl-0"
                        >
                          {proposal.subject}
                        </span>
                        <span
                          title={proposal.lesson_type}
                          className="truncate pl-12 text-sm text-muted-foreground xl:pl-0"
                        >
                          {proposal.lesson_type}
                        </span>
                        <span className="pl-12 text-sm font-semibold tabular-nums text-foreground xl:pl-0 xl:text-right">
                          £{proposal.price_per_lesson.toFixed(2)}
                        </span>

                        <span className="pl-12 xl:flex xl:justify-center xl:pl-0">
                          <span
                            className={cn(
                              'inline-flex min-w-[86px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold text-foreground',
                              statusTones[proposal.status] || 'bg-pastel-sand'
                            )}
                          >
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </span>
                        </span>

                        <span className="pl-12 text-sm tabular-nums text-muted-foreground xl:pl-0 xl:text-center">
                          {proposal.sent_at
                            ? format(new Date(proposal.sent_at), 'MMM d, yyyy')
                            : '—'}
                        </span>

                        <div className="flex flex-wrap items-center gap-2 pl-12 xl:flex-nowrap xl:justify-end xl:pl-0">

                          {['sent', 'viewed', 'agreed'].includes(proposal.status) && (
                            <button
                              type="button"
                              className={iconButton}
                              onClick={() => resendProposal(proposal)}
                              disabled={resendingId === proposal.id}
                              title="Resend email and WhatsApp"
                            >
                              {resendingId === proposal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() => setExtendTarget(proposal)}
                            title={`Extend discounted rate (ends ${format(
                              new Date(deadline),
                              'd MMM yyyy, HH:mm'
                            )})`}
                          >
                            <Clock className={cn('h-4 w-4', expired && 'text-destructive')} />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() => navigate(`/admin/proposals/edit/${proposal.id}`)}
                            title="Edit proposal"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() => copyProposalLink(proposal)}
                            title="Copy proposal link"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            onClick={() => {
                              const url = `https://classclowncrm.com/proposal/${proposal.id}/${proposal.access_token}`;
                              window.open(url, '_blank');
                            }}
                            title="View proposal"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={cn(iconButton, 'border-destructive text-destructive hover:bg-destructive')}
                            onClick={() => setDeleteTarget(proposal)}
                            title="Delete proposal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredProposals.length > 0 && (
                <div className="mt-5 flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredProposals.length)} of{' '}
                    {filteredProposals.length} proposals
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="inline-flex h-10 items-center rounded-full border-2 border-foreground px-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-foreground">
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="inline-flex h-10 items-center rounded-full border-2 border-foreground px-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <ExtendOfferDialog
        open={!!extendTarget}
        onOpenChange={(open) => !open && setExtendTarget(null)}
        proposal={extendTarget}
        onExtended={loadProposals}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[var(--radius-soft)] border-2 border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl font-extrabold">
              Delete proposal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this proposal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-full border-2 border-foreground bg-transparent px-5 font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-full bg-destructive px-5 font-semibold text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteProposal(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
