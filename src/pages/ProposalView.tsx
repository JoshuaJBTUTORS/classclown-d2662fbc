import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import AgreementStep from '@/components/proposals/AgreementStep';
import PaymentCaptureStep from '@/components/proposals/PaymentCaptureStep';
import ProposalLayout from '@/components/proposals/ProposalLayout';

interface Proposal {
  id: string;
  recipient_name: string;
  lesson_type: string;
  subject: string;
  price_per_lesson: number;
  payment_cycle: string;
  lesson_times: Array<{ day: string; time: string; duration: number; subject?: string }>;
  status: string;
  created_at: string;
  daily_homework_opt_in: boolean;
  agreed_at?: string | null;
}

export default function ProposalView() {
  const { proposalId, token } = useParams<{ proposalId: string; token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'view' | 'agreement' | 'payment'>('view');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [homeworkDismissed, setHomeworkDismissed] = useState(false);

  useEffect(() => {
    loadProposal();
  }, [proposalId, token]);

  const loadProposal = async () => {
    if (!proposalId || !token) {
      console.log('❌ Missing proposalId or token');
      toast({
        title: 'Invalid Link',
        description: 'This proposal link is invalid.',
        variant: 'destructive',
      });
      setErrorMessage('This proposal link is invalid.');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading proposal:', { proposalId, token: token.substring(0, 8) + '...' });
      
      // Query as anon user - no authentication required
      const { data, error } = await supabase
        .from('lesson_proposals')
        .select('*')
        .eq('id', proposalId)
        .eq('access_token', token)
        .single();

      if (error || !data) {
        console.error('❌ Supabase error:', error);
        console.error('Error details:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code
        });
        throw new Error(error?.message || 'Proposal not found');
      }

      console.log('✅ Proposal loaded successfully:', data.id);
      setProposal(data as unknown as Proposal);
      setErrorMessage(null);

      // Mark as viewed if not already
      if (data.status === 'sent') {
        console.log('📝 Updating proposal status to viewed');
        const { error: updateError } = await supabase
          .from('lesson_proposals')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', proposalId)
          .eq('access_token', token);
        
        if (updateError) {
          console.error('⚠️ Failed to update status:', updateError);
        }
      }

      // Determine current step based on status
      if (data.status === 'viewed' || data.status === 'sent') {
        setCurrentStep('view');
      } else if (data.status === 'agreed') {
        setCurrentStep('payment');
      } else if (data.status === 'completed') {
        setCurrentStep('payment');
      }
    } catch (error: any) {
      console.error('❌ Error loading proposal:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      toast({
        title: 'Error Loading Proposal',
        description: error?.message || 'Failed to load proposal',
        variant: 'destructive',
      });
      setErrorMessage(error?.message || 'Failed to load proposal. This link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
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
      <div className="container max-w-2xl py-16 text-center space-y-4">
        <p className="text-muted-foreground text-sm mb-2">
          This is a public proposal page — no sign-in required
        </p>
        <p className="text-destructive text-lg font-semibold">
          {errorMessage || 'Invalid or expired proposal link.'}
        </p>
        <button
          onClick={loadProposal}
          className="underline text-primary hover:text-primary/80 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (proposal.status === 'completed') {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">🎉 Welcome to Class Beyond!</h1>
        <p className="text-muted-foreground">
          Your proposal has been completed. We'll be in touch shortly to schedule your first lesson.
        </p>
      </div>
    );
  }

  if (currentStep === 'payment') {
    return <PaymentCaptureStep proposal={proposal} onComplete={() => loadProposal()} />;
  }

  if (currentStep === 'agreement') {
    return (
      <AgreementStep
        proposal={proposal}
        onAgree={() => {
          setCurrentStep('payment');
          loadProposal();
        }}
        onBack={() => setCurrentStep('view')}
      />
    );
  }

  return (
    <ProposalLayout
      proposal={proposal}
      onConfirm={() => setCurrentStep('agreement')}
      onProposalUpdate={(p) => setProposal(p)}
    />
  );
}
