import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, CheckCircle2 } from 'lucide-react';

const stripePromise = loadStripe('pk_live_51SEUOvJYNQBAYpmilzLd1wW33J3IqSlLE9oEtDWOQuUwP1zjmTSMFW9nWkhattdVpfIbibEyOAwr8IBDaOXgRwve00JjSVVi6U');

interface UpdateCardFormProps {
  customerId: string;
  token: string;
  initialName: string;
  initialEmail: string;
  onComplete: () => void;
}

function UpdateCardForm({ customerId, token, initialName, initialEmail, onComplete }: UpdateCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    try {
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: { name, email },
          },
        },
        redirect: 'if_required',
      });

      if (confirmError) throw confirmError;

      if (setupIntent?.status === 'succeeded') {
        const { error: completeError } = await supabase.functions.invoke('complete-card-update', {
          body: {
            setupIntentId: setupIntent.id,
            customerId,
            token,
          },
        });

        if (completeError) throw completeError;

        toast({
          title: 'Success!',
          description: 'Your payment method has been updated successfully.',
        });
        onComplete();
      }
    } catch (error: any) {
      console.error('Card update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment method',
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
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Email for Receipts</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Card Details</Label>
          <div className="mt-2">
            <PaymentElement />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={!stripe || isSubmitting} className="w-full" size="lg">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Card Details
      </Button>
    </form>
  );
}

export default function UpdateCardDetails() {
  const { customerId, token } = useParams<{ customerId: string; token: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [initialName, setInitialName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  useEffect(() => {
    if (customerId && token) {
      createSetupIntent();
    }
  }, [customerId, token]);

  const createSetupIntent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-card-update-setup-intent', {
        body: { customerId, token },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setInitialName(data.name || '');
      setInitialEmail(data.email || '');
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      setLinkError(error.message || 'This update link is invalid or has expired.');
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

  if (linkError) {
    return (
      <div className="container max-w-2xl py-16 text-center space-y-4">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Link Expired or Invalid</h1>
        <p className="text-muted-foreground">{linkError}</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="container max-w-2xl py-16">
        <Card className="p-8 md:p-12 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-primary">Card Updated!</h1>
          <p className="text-muted-foreground">
            Your payment details have been updated successfully. You can close this page.
          </p>
        </Card>
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
          <CreditCard className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-3xl font-bold text-primary">Update Card</h1>
          <p className="text-muted-foreground">
            As part of our routine annual payment method check, please update your payment details using the secure form below.
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'flat',
              variables: { colorPrimary: '#1fb86b' },
            },
          }}
        >
          <UpdateCardForm
            customerId={customerId!}
            token={token!}
            initialName={initialName}
            initialEmail={initialEmail}
            onComplete={() => setCompleted(true)}
          />
        </Elements>

        <div className="text-center text-xs text-muted-foreground">
          <p>Secured by Stripe. Your card information is never stored on our servers.</p>
        </div>
      </Card>
    </div>
  );
}
