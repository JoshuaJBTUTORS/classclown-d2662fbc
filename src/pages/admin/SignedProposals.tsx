import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminProposalSidebar } from '@/components/admin/AdminProposalSidebar';
import { DoodleEmpty } from '@/components/progress/ProgressDoodles';
import { Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Proposal {
  id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  lesson_type: string;
  price_per_lesson: number;
  payment_cycle: string;
  status: string;
  access_token: string;
  agreed_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Signature {
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip_address: string | null;
}

const stroke = {
  fill: 'none',
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

const gridCols =
  'xl:grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_92px_170px_130px_minmax(0,1.1fr)_60px] xl:items-center xl:gap-4';

const PAGE_SIZE = 10;

export default function SignedProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [signatures, setSignatures] = useState<Record<string, Signature>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadSignedProposals();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const loadSignedProposals = async () => {
    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('lesson_proposals')
        .select('*')
        .in('status', ['agreed', 'completed'])
        .order('agreed_at', { ascending: false });

      if (proposalsError) throw proposalsError;

      setProposals(proposalsData || []);

      if (proposalsData && proposalsData.length > 0) {
        const proposalIds = proposalsData.map((p) => p.id);
        const { data: signaturesData, error: signaturesError } = await supabase
          .from('lesson_proposal_signatures')
          .select('*')
          .in('proposal_id', proposalIds);

        if (signaturesError) throw signaturesError;

        const signaturesMap: Record<string, Signature> = {};
        signaturesData?.forEach((sig: any) => {
          signaturesMap[sig.proposal_id] = {
            signer_name: sig.signer_name,
            signer_email: sig.signer_email,
            signed_at: sig.signed_at,
            ip_address: sig.ip_address,
          };
        });
        setSignatures(signaturesMap);
      }
    } catch (error: any) {
      console.error('Error loading signed proposals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load signed proposals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    const q = searchQuery.toLowerCase();
    return (
      proposal.recipient_name.toLowerCase().includes(q) ||
      proposal.recipient_email.toLowerCase().includes(q) ||
      proposal.subject.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedProposals = filteredProposals.slice(pageStart, pageStart + PAGE_SIZE);

  const statePanel = (content: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-pastel-sand/40 px-6 py-14 text-center">
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
          <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
            <SidebarTrigger className="mb-4 h-10 w-10 rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Signed Proposals
              </h1>
              <button
                type="button"
                onClick={() => navigate('/admin/proposals')}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-foreground px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                View All Proposals
              </button>
            </div>

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
            </div>

            <div className="mt-6 rounded-[var(--radius-soft)] bg-card p-4 shadow-[var(--shadow-soft-lg)] sm:p-6">
              {loading ? (
                statePanel(<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />)
              ) : proposals.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No signed proposals yet</p>
                  </>
                )
              ) : filteredProposals.length === 0 ? (
                statePanel(
                  <>
                    <DoodleEmpty className="h-10 w-10 text-foreground/70" />
                    <p className="text-sm text-muted-foreground">No proposals match your search</p>
                  </>
                )
              ) : (
                <div className="space-y-2">
                  <div
                    className={cn(
                      'hidden px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:grid',
                      gridCols
                    )}
                  >
                    <span>Recipient</span>
                    <span>Subject</span>
                    <span className="text-right">Price</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">Signed</span>
                    <span>Signer</span>
                    <span className="text-right">View</span>
                  </div>

                  {pagedProposals.map((proposal, i) => {
                    const signature = signatures[proposal.id];
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

                        <span className="pl-12 text-sm font-semibold tabular-nums text-foreground xl:pl-0 xl:text-right">
                          £{proposal.price_per_lesson.toFixed(2)}
                        </span>

                        <span className="pl-12 xl:flex xl:justify-center xl:pl-0">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold',
                              proposal.status === 'completed'
                                ? 'bg-foreground text-background'
                                : 'bg-pastel-mint text-foreground'
                            )}
                          >
                            {proposal.status === 'agreed' ? 'Signed · Payment Pending' : 'Completed'}
                          </span>
                        </span>

                        <span className="pl-12 text-sm tabular-nums text-muted-foreground xl:pl-0 xl:text-center">
                          {proposal.agreed_at
                            ? format(new Date(proposal.agreed_at), 'MMM d, yyyy')
                            : '—'}
                        </span>

                        <div className="min-w-0 pl-12 text-sm xl:pl-0">
                          {signature ? (
                            <>
                              <p className="truncate font-medium text-foreground">
                                {signature.signer_name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {signature.signer_email}
                              </p>
                              {signature.ip_address && (
                                <p className="truncate text-xs text-muted-foreground">
                                  IP: {signature.ip_address}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>

                        <div className="flex pl-12 xl:justify-end xl:pl-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/proposals/${proposal.id}/view`)}
                            title="View full proposal details"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:-translate-y-0.5"
                          >
                            <ArrowRight className="h-4 w-4" />
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
    </SidebarProvider>
  );
}
