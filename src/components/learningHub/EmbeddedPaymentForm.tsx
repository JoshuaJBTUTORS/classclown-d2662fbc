
import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, AlertCircle, Shield, Lock } from 'lucide-react';

// Load Stripe with your live publishable key
const stripePromise = loadStripe('pk_live_51QN38HJvbqr5stJM97b75qtlGHikLcEdXzhPypRqJPKRcZgeYyCztQ6h65rz79HGs1iCgI97GUqUlAUE7vJkGtPk001FSXb648');

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
  const [cardComplete, setCardComplete] = useState(false);
  const [emailForReceipt, setEmailForReceipt] = useState('');
  const [billingName, setBillingName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      setErrorMessage('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: billingName || undefined,
            email: emailForReceipt || undefined,
          }
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

  const stripeElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontWeight: '400',
        '::placeholder': {
          color: '#9ca3af',
        },
        ':focus': {
          color: '#111827',
        },
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
    hideIcon: false,
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          </div>
          <p className="text-sm text-gray-600">Complete your subscription to {courseTitle}</p>
        </div>

        {/* Billing Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="billingName" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Full Name
            </Label>
            <Input
              id="billingName"
              type="text"
              placeholder="John Doe"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={emailForReceipt}
              onChange={(e) => setEmailForReceipt(e.target.value)}
              className="h-12 border-gray-200 focus:border-primary/50 focus:ring-primary/30"
            />
            <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
          </div>
        </div>

        {/* Card Details */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Card Number
            </Label>
            <div className="relative">
              <div className="h-12 px-3 py-3 border border-gray-200 rounded-md bg-white focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-colors">
                <CardNumberElement
                  options={stripeElementOptions}
                  onChange={(event) => setCardComplete(event.complete)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Expiry Date
              </Label>
              <div className="h-12 px-3 py-3 border border-gray-200 rounded-md bg-white focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-colors">
                <CardExpiryElement options={stripeElementOptions} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                CVC
              </Label>
              <div className="h-12 px-3 py-3 border border-gray-200 rounded-md bg-white focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-colors">
                <CardCvcElement options={stripeElementOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Trial Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded-full mt-0.5">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">7-Day Free Trial</h4>
              <ul className="text-sm text-blue-800 space-y-0.5">
                <li>• Free access to {courseTitle}</li>
                <li>• £{(amount / 100).toFixed(2)}/month after trial</li>
                <li>• Cancel anytime during trial period</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 border-t pt-4">
          <Lock className="h-3 w-3" />
          <span>Secured by Stripe • SSL Encrypted</span>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Start Free Trial
            </>
          )}
        </Button>

        {/* Powered by Stripe */}
        <div className="text-center">
          <p className="text-xs text-gray-400">Powered by Stripe</p>
        </div>
      </form>
    </div>
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
      variables: {
        colorPrimary: '#e11d48',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default EmbeddedPaymentForm;
