
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
      setErrorMessage('Card element not foun');
      setIsProcessing(false);
      return;
    }

    try {
      // For subscription setup, we confirm the setup intent or payment intent
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
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message || 'Payment setup failed');
        onError(error.message || 'Payment setup failed');
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_action')) {
        console.log('Payment method setup successful');
        onSuccess();
      } else {
        console.log('Payment intent status:', paymentIntent?.status);
        onSuccess(); // Proceed anyway for subscription setup
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
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
        color: '#374151',
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

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      {/* Trial Summary */}
      <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
        <h3 className="font-semibold text-gray-900 mb-4">Free trial summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Free trial period</span>
            <span className="font-semibold text-primary">7 days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">After trial</span>
            <span className="text-sm text-gray-500">{formatPrice(amount)}/month</span>
          </div>
          <div className="border-t border-primary/20 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Due today</span>
              <span className="font-bold text-xl text-primary">£0.00</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your card will be charged {formatPrice(amount)} on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} unless you cancel.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Setup Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={emailForReceipt}
              onChange={(e) => setEmailForReceipt(e.target.value)}
              className="h-11 border-gray-300 focus:border-primary focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <Label htmlFor="billingName" className="text-sm font-medium text-gray-700 mb-2 block">
              Full name
            </Label>
            <Input
              id="billingName"
              type="text"
              placeholder="Enter your full name"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              className="h-11 border-gray-300 focus:border-primary focus:ring-primary/20"
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Payment method
            </Label>
            <p className="text-xs text-gray-500 mb-3">
              Add your payment method to start your free trial. You won't be charged until your trial ends.
            </p>
            <div className="border border-gray-300 rounded-md bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <div className="h-11 px-3 py-3 border-b border-gray-200">
                <CardNumberElement
                  options={stripeElementOptions}
                  onChange={(event) => setCardComplete(event.complete)}
                />
              </div>
              <div className="grid grid-cols-2">
                <div className="h-11 px-3 py-3 border-r border-gray-200">
                  <CardExpiryElement options={stripeElementOptions} />
                </div>
                <div className="h-11 px-3 py-3">
                  <CardCvcElement options={stripeElementOptions} />
                </div>
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

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete || !emailForReceipt || !billingName}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Start free trial
            </>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By starting your free trial, you agree to our terms. Your subscription will begin after your trial ends. Cancel anytime.
        </p>

        {/* Security Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-100">
          <Lock className="h-3 w-3" />
          <span>Secured by Stripe</span>
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
        colorPrimary: 'hsl(342, 77%, 60%)',
        colorBackground: '#ffffff',
        colorText: '#374151',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        borderRadius: '6px',
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
