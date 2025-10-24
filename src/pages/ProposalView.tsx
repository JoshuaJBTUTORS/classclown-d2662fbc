import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import AgreementStep from '@/components/proposals/AgreementStep';
import PaymentCaptureStep from '@/components/proposals/PaymentCaptureStep';
import jbLogo from '@/assets/jb-tutors-logo.png';

interface Proposal {
  id: string;
  recipient_name: string;
  lesson_type: string;
  subject: string;
  price_per_lesson: number;
  payment_cycle: string;
  lesson_times: Array<{ day: string; time: string; duration: number }>;
  status: string;
  created_at: string;
}

export default function ProposalView() {
  const { proposalId, token } = useParams<{ proposalId: string; token: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'view' | 'agreement' | 'payment'>('view');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProposal();
  }, [proposalId, token]);

  const loadProposal = async () => {
    if (!proposalId || !token) {
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
      const { data, error } = await supabase
        .from('lesson_proposals')
        .select('*')
        .eq('id', proposalId)
        .eq('access_token', token)
        .single();

      if (error || !data) {
        console.error('Supabase error:', error);
        throw new Error(error?.message || 'Proposal not found');
      }

      setProposal(data as unknown as Proposal);
      setErrorMessage(null);

      // Mark as viewed if not already
      if (data.status === 'sent') {
        await supabase
          .from('lesson_proposals')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', proposalId)
          .eq('access_token', token);
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
      console.error('Error loading proposal:', error);
      toast({
        title: 'Error',
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
        <h1 className="text-3xl font-bold mb-2">🎉 Welcome to Journey Beyond!</h1>
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12">
        <Card className="p-8 md:p-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <img src={jbLogo} alt="Journey Beyond Education" className="h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-primary">Journey Beyond Education</h1>
            <p className="text-xl text-muted-foreground">Lesson Proposal</p>
          </div>

          {/* Prepared For Section */}
          <div className="grid md:grid-cols-2 gap-8 py-8 border-y">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">PREPARED FOR</h3>
              <p className="text-lg font-medium">{proposal.recipient_name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">PREPARED BY</h3>
              <p className="text-lg font-medium">Journey Beyond Education</p>
              <p className="text-sm text-muted-foreground">Business Development Team</p>
            </div>
          </div>

          {/* Investment Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-primary">💎 Investment in Your Child's Future</h2>
            
            <div className="grid gap-4 bg-muted/50 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">📚 Lesson Type</p>
                  <p className="text-lg font-semibold">{proposal.lesson_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">📖 Subject</p>
                  <p className="text-lg font-semibold">{proposal.subject}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">💰 Price Per Lesson</p>
                  <p className="text-2xl font-bold text-primary">£{proposal.price_per_lesson.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">📅 Payment Cycle</p>
                  <p className="text-lg font-semibold">{proposal.payment_cycle}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">⏰ Lesson Times</p>
                <div className="space-y-2">
                  {proposal.lesson_times.map((time, index) => (
                    <p key={index} className="text-base">
                      <span className="font-semibold">{time.day}</span> at {time.time} ({time.duration} minutes)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Our Offering */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">✨ Our Offering</h2>
            <ul className="space-y-3 list-none">
              {[
                'Lesson recordings available for revision',
                'Unlimited access to our learning hub E learning courses',
                'Parent dashboard with progress updates and six-week check-ins',
                'Half-termly assessments with feedback',
                'Homework after each session, marked to track progress',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Tutors */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">👨‍🏫 Our Tutors</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Our tutors are carefully selected professionals with at least 3 years of experience in their subject areas. 
              They are passionate about education and committed to helping every student reach their full potential. 
              All tutors undergo rigorous background checks and continuous professional development.
            </p>
          </div>

          {/* Success Rates */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">🏆 Our Track Record</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">🎓 92%</p>
                <p className="text-sm font-medium text-muted-foreground">A*/A rate for GCSE</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">🎯 95%</p>
                <p className="text-sm font-medium text-muted-foreground">Pass rate for 11 plus</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">⭐ 98%</p>
                <p className="text-sm font-medium text-muted-foreground">Satisfaction rate</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-6 text-center">
            <button
              onClick={() => setCurrentStep('agreement')}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t">
            <p className="text-sm font-semibold text-primary">✨ Helping Every Child Shine ✨</p>
            <p className="text-xs text-muted-foreground mt-2">
              &copy; {new Date().getFullYear()} Journey Beyond Education. All rights reserved.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
