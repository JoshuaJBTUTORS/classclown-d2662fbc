import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminProposalSidebar } from '@/components/admin/AdminProposalSidebar';
import { Loader2, Plus, Copy, ExternalLink, Trash2, Pencil, Mail } from 'lucide-react';
import { format } from 'date-fns';

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
}

export default function ProposalDashboard() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

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
    if (!confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      sent: 'secondary',
      viewed: 'default',
      agreed: 'default',
      completed: 'default',
      declined: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
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
                <h1 className="text-3xl font-bold">Lesson Proposals</h1>
                <p className="text-muted-foreground">Manage and track all lesson proposals</p>
              </div>
              <Button onClick={() => navigate('/admin/proposals/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </div>

      <Card>
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
          <CardDescription>
            View and manage proposals sent to potential students
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Lesson Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {proposals.length === 0
                        ? 'No proposals created yet'
                        : 'No proposals match your filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{proposal.recipient_name}</p>
                          <p className="text-sm text-muted-foreground">{proposal.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{proposal.subject}</TableCell>
                      <TableCell>{proposal.lesson_type}</TableCell>
                      <TableCell>£{proposal.price_per_lesson.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell>
                        {proposal.sent_at ? format(new Date(proposal.sent_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            {['sent', 'viewed', 'agreed'].includes(proposal.status) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendProposal(proposal)}
                                disabled={resendingId === proposal.id}
                                title="Resend email and WhatsApp"
                              >
                                {resendingId === proposal.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/proposals/edit/${proposal.id}`)}
                              title="Edit proposal"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyProposalLink(proposal)}
                              title="Copy proposal link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProposal(proposal.id)}
                            title="Delete proposal"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>Showing {filteredProposals.length} of {proposals.length} proposals</p>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
