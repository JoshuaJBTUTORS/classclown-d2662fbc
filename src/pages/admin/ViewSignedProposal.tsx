import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, ExternalLink, Calendar, Clock, Mail, User, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Proposal {
  id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  message: string | null;
  lesson_type: string;
  price_per_lesson: number;
  payment_cycle: string;
  status: string;
  access_token: string;
  agreed_at: string | null;
  completed_at: string | null;
  created_at: string;
  lesson_times: Array<{
    day: string;
    time: string;
    duration: string;
    subject?: string;
  }>;
  what_you_get: string[] | null;
}

interface Signature {
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip_address: string | null;
}

export default function ViewSignedProposal() {
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (proposalId) {
      loadProposalDetails();
    }
  }, [proposalId]);

  const loadProposalDetails = async () => {
    try {
      // Load proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('lesson_proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      // Parse the data to match our interface
      const parsedProposal: Proposal = {
        id: proposalData.id,
        recipient_name: proposalData.recipient_name,
        recipient_email: proposalData.recipient_email,
        subject: proposalData.subject,
        message: (proposalData as any).message || null,
        lesson_type: proposalData.lesson_type,
        price_per_lesson: proposalData.price_per_lesson,
        payment_cycle: proposalData.payment_cycle,
        status: proposalData.status,
        access_token: proposalData.access_token,
        agreed_at: proposalData.agreed_at,
        completed_at: proposalData.completed_at,
        created_at: proposalData.created_at,
        lesson_times: (proposalData.lesson_times as any) || [],
        what_you_get: (proposalData as any).what_you_get || null,
      };

      setProposal(parsedProposal);

      // Load signature
      const { data: signatureData, error: signatureError } = await supabase
        .from('lesson_proposal_signatures')
        .select('*')
        .eq('proposal_id', proposalId)
        .single();

      if (!signatureError && signatureData) {
        setSignature({
          signer_name: signatureData.signer_name,
          signer_email: signatureData.signer_email,
          signed_at: signatureData.signed_at,
          ip_address: signatureData.ip_address,
        });
      }
    } catch (error: any) {
      console.error('Error loading proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposal details',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Proposal not found</p>
          <Button onClick={() => navigate('/admin/proposals/signed')} className="mt-4">
            Back to Signed Proposals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin/proposals/signed')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Signed Proposals
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const url = `https://classclowncrm.com/proposal/${proposal.id}/${proposal.access_token}`;
            window.open(url, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Public Page
        </Button>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl">{proposal.subject}</CardTitle>
                <CardDescription>Proposal ID: {proposal.id.slice(0, 8)}</CardDescription>
              </div>
              {getStatusBadge(proposal.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Recipient:</span>
                  <span>{proposal.recipient_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{proposal.recipient_email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{format(new Date(proposal.created_at), 'MMM d, yyyy')}</span>
                </div>
                {proposal.agreed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Signed:</span>
                    <span>{format(new Date(proposal.agreed_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Information */}
        {signature && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Signature Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Signed by</p>
                  <p className="font-medium">{signature.signer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{signature.signer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signed on</p>
                  <p className="font-medium">
                    {format(new Date(signature.signed_at), 'MMMM d, yyyy')} at{' '}
                    {format(new Date(signature.signed_at), 'HH:mm:ss')}
                  </p>
                </div>
                {signature.ip_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-medium font-mono text-sm">{signature.ip_address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposal Message */}
        {proposal.message && (
          <Card>
            <CardHeader>
              <CardTitle>Proposal Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Lesson Details */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Lesson Type</p>
                <p className="font-medium capitalize">{proposal.lesson_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price Per Lesson</p>
                <p className="font-medium text-2xl">£{proposal.price_per_lesson.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Cycle</p>
                <p className="font-medium capitalize">{proposal.payment_cycle}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scheduled Lesson Times
              </h3>
              <div className="space-y-2">
                {proposal.lesson_times.map((lesson, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{lesson.day}</p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.time} • {lesson.duration}
                        </p>
                      </div>
                      {lesson.subject && (
                        <Badge variant="outline">{lesson.subject}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You Get */}
        {proposal.what_you_get && proposal.what_you_get.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {proposal.what_you_get.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
