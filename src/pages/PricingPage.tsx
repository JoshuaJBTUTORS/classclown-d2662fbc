import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { DomainSEO } from '@/components/seo/DomainSEO';

const PricingPage = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 9.99,
      minutes: 50,
      popular: false,
      features: [
        '50 minutes of AI voice tutoring',
        'Full access to all GCSE courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
      ],
    },
    {
      name: 'Standard',
      monthlyPrice: 19.99,
      minutes: 100,
      popular: true,
      features: [
        '100 minutes of AI voice tutoring',
        'Full access to all GCSE courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
      ],
    },
    {
      name: 'Booster',
      monthlyPrice: 45,
      minutes: 250,
      popular: false,
      features: [
        '250 minutes of AI voice tutoring',
        'Full access to all GCSE courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Priority support',
      ],
    },
    {
      name: 'Pro',
      monthlyPrice: 98,
      minutes: 500,
      popular: false,
      features: [
        '500 minutes of AI voice tutoring',
        'Full access to all GCSE courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Priority support',
        'Perfect for families',
      ],
    },
  ];

  const calculatePrice = (monthlyPrice: number) => {
    if (isAnnual) {
      // Use exact annual prices from Stripe
      const annualPricing: Record<number, number> = {
        9.99: 102,
        19.99: 204,
        45: 510,
        98: 1020,
      };
      
      const annualPrice = annualPricing[monthlyPrice] || monthlyPrice * 12 * 0.85;
      return {
        total: annualPrice,
        perMonth: Number((annualPrice / 12).toFixed(2)),
      };
    }
    return {
      total: monthlyPrice,
      perMonth: monthlyPrice,
    };
  };

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoadingPlan(planName);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          planName,
          billingInterval: isAnnual ? 'yearly' : 'monthly',
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open in new tab/window - works in both sandboxed iframes and production
        const checkoutWindow = window.open(data.url, '_blank');
        
        if (!checkoutWindow) {
          // Popup blocked - show user-friendly message
          toast.error('Please allow popups to complete checkout', {
            description: 'Click the button again and allow popups in your browser'
          });
          setLoadingPlan(null);
          return;
        }
        
        // Reset loading state after opening checkout
        setLoadingPlan(null);
        
        // Show helpful message
        toast.info('Redirecting to secure checkout...', {
          description: 'Complete your payment in the new tab'
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process. Please try again.');
      setLoadingPlan(null);
    }
  };

  if (isOwner) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Owner Access</h2>
              <p className="text-muted-foreground mb-6">
                You have full access to all features as an owner. No subscription needed!
              </p>
              <Button onClick={() => navigate('/learning-hub')}>
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <DomainSEO 
        pageTitle="Pricing Plans"
        pageDescription="Choose the perfect AI tutoring plan for your learning journey. Flexible pricing with unlimited lessons and personalized teaching."
      />
      <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Already used your 3 free lessons? Subscribe to continue learning with Cleo!
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className={!isAnnual ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={isAnnual ? 'font-semibold' : 'text-muted-foreground'}>
              Annual
            </span>
          </div>
          {isAnnual && (
            <p className="text-sm text-primary font-medium">
              Save 15% with annual billing 🎉
            </p>
          )}
          
          {/* Free Sessions Info */}
          <div className="mt-6 inline-block bg-gradient-to-r from-mint-500/20 to-mint-600/20 px-6 py-3 rounded-full border border-mint-300">
            <p className="text-sm font-medium text-foreground">
              🎁 New users get 3 FREE lessons • No credit card required
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const pricing = calculatePrice(plan.monthlyPrice);
            const costPerMinute = (pricing.perMonth / plan.minutes).toFixed(2);

            return (
              <Card
                key={plan.name}
                className={`relative p-6 flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  
                  {/* Price Display with Strikethrough for Annual */}
                  <div className="mb-2">
                    {isAnnual && (
                      <div className="text-lg text-muted-foreground line-through mb-1">
                        £{plan.monthlyPrice}/month
                      </div>
                    )}
                    <div className="transition-all duration-300">
                      <span className="text-4xl font-bold">£{pricing.perMonth}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </div>
                  
                  {/* Annual Billing Info & Savings Badge */}
                  {isAnnual && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        £{pricing.total} billed annually
                      </p>
                      <div className="inline-block bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/20">
                        💰 Save £{Math.round(plan.monthlyPrice * 12 * 0.15)}/year
                      </div>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={!!loadingPlan}
                  className={plan.popular ? 'w-full' : 'w-full'}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All plans include full access to GCSE and 11+ courses.</p>
          <p className="mt-2">Sessions reset monthly. Purchase additional packs anytime if needed.</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default PricingPage;
