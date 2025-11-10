import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly_pence: number;
  price_annual_pence: number;
  voice_sessions_per_month: number;
  features: string[];
  recommended?: boolean;
}

export const PaymentSetupStep = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupIntent, setSetupIntent] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch plans on mount
  useState(() => {
    fetchPlans();
  });

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Map database results to typed Plan objects
      const typedPlans: Plan[] = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));

      setPlans(typedPlans);
      // Auto-select Standard plan (recommended)
      const standard = typedPlans.find(p => p.name === 'Standard');
      if (standard) {
        setSelectedPlan(standard);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleContinue = () => {
    if (!selectedPlan) return;
    // Create setup intent for card collection
    createSetupIntent();
  };

  const createSetupIntent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-setup-intent', {
        body: { planId: selectedPlan?.id, billingInterval }
      });

      if (error) throw error;
      setSetupIntent(data.clientSecret);
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize payment setup',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-mint-600" />
      </div>
    );
  }

  if (setupIntent && selectedPlan) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: setupIntent }}>
        <PaymentForm 
          plan={selectedPlan} 
          billingInterval={billingInterval}
          onSuccess={() => navigate('/learning-hub')}
        />
      </Elements>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Choose Your Learning Plan</h2>
        <p className="text-muted-foreground">Start with 1 FREE voice lesson - no charge today!</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-cream-100 p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingInterval === 'monthly'
                ? 'bg-white text-mint-600 shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingInterval === 'annual'
                ? 'bg-white text-mint-600 shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Annual <span className="text-xs ml-1">(Save 15%)</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const price = billingInterval === 'annual' 
            ? plan.price_annual_pence / 12 
            : plan.price_monthly_pence;
          const isRecommended = plan.name === 'Standard';
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? 'border-2 border-mint-500 shadow-md'
                  : 'border border-border'
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-mint-500 to-mint-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Recommended
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(Math.round(price))}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {billingInterval === 'annual' && (
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(plan.price_annual_pence)} billed annually
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-mint-600 font-medium">
                  <Zap className="h-4 w-4" />
                  <span>{plan.voice_sessions_per_month} sessions/month</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-mint-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="pt-2">
                    <div className="h-8 flex items-center justify-center rounded-md bg-mint-50 text-mint-700 text-sm font-medium">
                      Selected
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Free Trial Badge */}
      <div className="bg-gradient-to-r from-mint-50 to-cream-50 border border-mint-200 rounded-lg p-4 text-center">
        <p className="text-mint-800 font-medium">
          🎉 Get 1 FREE 5-minute voice lesson to try Cleo risk-free!
        </p>
        <p className="text-sm text-mint-600 mt-1">
          No charge today - billing starts after your trial
        </p>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedPlan || loading}
          size="lg"
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Continue to Payment'
          )}
        </Button>
      </div>
    </div>
  );
};

// Stripe Payment Form Component
interface PaymentFormProps {
  plan: Plan;
  billingInterval: 'monthly' | 'annual';
  onSuccess: () => void;
}

const PaymentForm = ({ plan, billingInterval, onSuccess }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Submit payment element
      const { error: submitError } = await elements.submit();
      if (submitError) throw submitError;

      // Confirm setup
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/learning-hub`,
        },
        redirect: 'if_required'
      });

      if (error) throw error;

      if (setupIntent?.status === 'succeeded') {
        // Create subscription via edge function
        const { error: subError } = await supabase.functions.invoke('create-platform-subscription', {
          body: {
            planId: plan.id,
            billingInterval,
            setupIntentId: setupIntent.id
          }
        });

        if (subError) throw subError;

        toast({
          title: 'Success!',
          description: 'Your subscription has been activated with 1 free trial session'
        });

        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Complete Your Setup</h3>
        <p className="text-muted-foreground">
          Enter your payment details to start your free trial
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">{plan.name} Plan</h4>
          <p className="text-sm text-muted-foreground">
            {billingInterval === 'annual' ? 'Annual' : 'Monthly'} billing
          </p>
        </div>

        <PaymentElement />

        <div className="bg-cream-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">What happens next:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Get 1 FREE voice lesson immediately</li>
            <li>✓ No charge today</li>
            <li>✓ Cancel anytime</li>
          </ul>
        </div>
      </Card>

      <Button type="submit" disabled={!stripe || loading} size="lg" className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Start Free Trial'
        )}
      </Button>
    </form>
  );
};
