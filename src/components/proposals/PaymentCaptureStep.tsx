import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

const stripePromise = loadStripe('pk_live_51QN38HJvbqr5stJM97b75qtlGHikLcEdXzhPypRqJPKRcZgeYyCztQ6h65rz79HGs1iCgI97GUqUlAUE7vJkGtPk001FSXb648');

interface PaymentCaptureStepProps {
  proposal: any;
  onComplete: () => void;
}

function PaymentForm({ proposal, onComplete }: PaymentCaptureStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(proposal.recipient_name);
  const [email, setEmail] = useState(proposal.recipient_email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Confirm the setup
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name,
              email,
            },
          },
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw confirmError;
      }

      if (setupIntent?.status === 'succeeded') {
        // Complete the proposal setup
        const { error: completeError } = await supabase.functions.invoke('complete-proposal-setup', {
          body: {
            setupIntentId: setupIntent.id,
            proposalId: proposal.id,
          },
        });

        if (completeError) throw completeError;

        toast({
          title: 'Success!',
          description: 'Your payment method has been saved successfully.',
        });

        onComplete();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to save payment method',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Cardholder Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email for Receipts</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Card Details</Label>
          <div className="mt-2">
            <PaymentElement />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-sm">
        <p className="font-medium mb-1">£0.00 Authorization</p>
        <p className="text-muted-foreground">
          We'll authorize your card with £0.00 to verify it. You won't be charged until your first lesson.
        </p>
      </div>

      <Button type="submit" disabled={!stripe || isSubmitting} className="w-full" size="lg">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Complete Sign-Up
      </Button>
    </form>
  );
}

export default function PaymentCaptureStep({ proposal, onComplete }: PaymentCaptureStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createSetupIntent();
  }, []);

  const createSetupIntent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-proposal-setup-intent', {
        body: {
          proposalId: proposal.id,
          email: proposal.recipient_email,
          name: proposal.recipient_name,
        },
      });

      if (error) throw error;

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment setup',
        variant: 'destructive',
      });
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

  if (!clientSecret) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-destructive">Failed to initialize payment setup</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <Card className="p-8 md:p-12 space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-primary">Almost There!</h1>
          <p className="text-muted-foreground">
            Final step: Add your payment method to complete sign-up
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
          }}
        >
          <PaymentForm proposal={proposal} onComplete={onComplete} />
        </Elements>

        <div className="text-center text-xs text-muted-foreground">
          <p>Secured by Stripe. Your card information is never stored on our servers.</p>
        </div>
      </Card>
    </div>
  );
}
