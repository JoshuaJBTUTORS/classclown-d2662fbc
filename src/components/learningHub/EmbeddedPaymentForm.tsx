
import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

// Load Stripe (replace with your publishable key)
const stripePromise = loadStripe('pk_test_...');

interface PaymentFormProps {
  clientSecret: string;
  customerId: string;
  courseTitle: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  customerId,
  courseTitle,
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setErrorMessage('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Details</label>
        <div className="p-3 border rounded-md bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Your trial starts today:</strong>
          <br />
          • 7 days free access to {courseTitle}
          <br />
          • £{(amount / 100).toFixed(2)}/month after trial
          <br />
          • Cancel anytime during trial period
        </p>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Start 7-Day Free Trial
          </>
        )}
      </Button>
    </form>
  );
};

interface EmbeddedPaymentFormProps {
  clientSecret: string;
  customerId: string;
  courseTitle: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const EmbeddedPaymentForm: React.FC<EmbeddedPaymentFormProps> = (props) => {
  const options: StripeElementsOptions = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default EmbeddedPaymentForm;
