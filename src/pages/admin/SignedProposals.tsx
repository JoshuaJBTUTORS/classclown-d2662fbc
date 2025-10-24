import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminProposalSidebar } from '@/components/admin/AdminProposalSidebar';
import { Loader2, ExternalLink, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

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

export default function SignedProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [signatures, setSignatures] = useState<Record<string, Signature>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSignedProposals();
  }, []);

  const loadSignedProposals = async () => {
    try {
      // Load proposals with status 'agreed' or 'completed'
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('lesson_proposals')
        .select('*')
        .in('status', ['agreed', 'completed'])
        .order('agreed_at', { ascending: false });

      if (proposalsError) throw proposalsError;

      setProposals(proposalsData || []);

      // Load signatures for these proposals
      if (proposalsData && proposalsData.length > 0) {
        const proposalIds = proposalsData.map(p => p.id);
        const { data: signaturesData, error: signaturesError } = await supabase
          .from('lesson_proposal_signatures')
          .select('*')
          .in('proposal_id', proposalIds);

        if (signaturesError) throw signaturesError;

        // Create a map of proposal_id -> signature
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      agreed: 'secondary',
      completed: 'default',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status === 'agreed' ? 'Signed - Payment Pending' : 'Completed'}
      </Badge>
    );
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminProposalSidebar 
          totalProposals={proposals.length} 
          filteredCount={filteredProposals.length} 
        />
        
        <div className="flex-1">
          <header className="h-12 flex items-center border-b bg-background sticky top-0 z-10">
            <SidebarTrigger className="ml-2" />
          </header>

          <div className="container py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <FileCheck className="h-8 w-8 text-primary" />
                  Signed Proposals
                </h1>
                <p className="text-muted-foreground">View all proposals that have been signed by recipients</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/proposals')}>
                View All Proposals
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Signed & Completed Proposals</CardTitle>
                <CardDescription>
                  Track proposals that have been agreed to and completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, email, or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signed Date</TableHead>
                        <TableHead>Signer Info</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {proposals.length === 0
                              ? 'No signed proposals yet'
                              : 'No proposals match your search'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProposals.map((proposal) => {
                          const signature = signatures[proposal.id];
                          return (
                            <TableRow key={proposal.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{proposal.recipient_name}</p>
                                  <p className="text-sm text-muted-foreground">{proposal.recipient_email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{proposal.subject}</TableCell>
                              <TableCell>£{proposal.price_per_lesson.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                              <TableCell>
                                {proposal.agreed_at
                                  ? format(new Date(proposal.agreed_at), 'MMM d, yyyy HH:mm')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {signature ? (
                                  <div className="text-sm">
                                    <p className="font-medium">{signature.signer_name}</p>
                                    <p className="text-muted-foreground">{signature.signer_email}</p>
                                    {signature.ip_address && (
                                      <p className="text-xs text-muted-foreground">IP: {signature.ip_address}</p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const url = `https://classclowncrm.com/proposal/${proposal.id}/${proposal.access_token}`;
                                    window.open(url, '_blank');
                                  }}
                                  title="View proposal"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <p>Showing {filteredProposals.length} of {proposals.length} signed proposals</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
