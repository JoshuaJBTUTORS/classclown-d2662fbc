import { useState } from 'react';
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

interface CardFormProps {
  customerId: string;
  name: string;
  email: string;
  onComplete: () => void;
}

function CardForm({ customerId, name, email, onComplete }: CardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          body: { setupIntentId: setupIntent.id, customerId },
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
      <div>
        <Label>Card Details</Label>
        <div className="mt-2">
          <PaymentElement />
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-card-update-setup-intent', {
        body: { email, name },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    } catch (error: any) {
      console.error('Error creating setup intent:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment setup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

        {!clientSecret ? (
          <form onSubmit={handleContinue} className="space-y-4">
            <div>
              <Label htmlFor="name">Cardholder Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email for Receipts</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>
        ) : (
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
            <CardForm
              customerId={customerId!}
              name={name}
              email={email}
              onComplete={() => setCompleted(true)}
            />
          </Elements>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>Secured by Stripe. Your card information is never stored on our servers.</p>
        </div>
      </Card>
    </div>
  );
}
