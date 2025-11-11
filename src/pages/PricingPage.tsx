import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, Sparkles } from 'lucide-react';

const PricingPage = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 18,
      sessions: 15,
      popular: false,
      features: [
        '15 × 5-minute voice lessons',
        'Full access to all GCSE & 11+ courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Practice questions & quizzes',
      ],
    },
    {
      name: 'Standard',
      monthlyPrice: 37,
      sessions: 30,
      popular: true,
      features: [
        '30 × 5-minute voice lessons',
        'Full access to all GCSE & 11+ courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Practice questions & quizzes',
      ],
    },
    {
      name: 'Plus',
      monthlyPrice: 61,
      sessions: 60,
      popular: false,
      features: [
        '60 × 5-minute voice lessons',
        'Full access to all GCSE & 11+ courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Practice questions & quizzes',
      ],
    },
    {
      name: 'Premium',
      monthlyPrice: 110,
      sessions: 90,
      popular: false,
      features: [
        '90 × 5-minute voice lessons',
        'Full access to all GCSE & 11+ courses',
        'AI-powered personalized learning',
        'Progress tracking & analytics',
        'Practice questions & quizzes',
      ],
    },
  ];

  const calculatePrice = (monthlyPrice: number) => {
    if (isAnnual) {
      const annualPrice = monthlyPrice * 12 * 0.85; // 15% discount
      return {
        total: Math.round(annualPrice),
        perMonth: Math.round(annualPrice / 12),
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
        window.location.href = data.url;
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
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Get unlimited access to all courses with flexible voice learning sessions
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
          
          {/* Free Trial Banner */}
          <div className="mt-6 inline-block bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-3 rounded-full">
            <p className="text-sm font-medium">
              🎁 Get your first 5-minute voice lesson FREE with card on file
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const pricing = calculatePrice(plan.monthlyPrice);
            const costPerSession = (pricing.perMonth / plan.sessions).toFixed(2);

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
                  <div className="mb-2">
                    <span className="text-4xl font-bold">£{pricing.perMonth}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground">
                      £{pricing.total} billed annually
                    </p>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    {plan.sessions} sessions • £{costPerSession} per session
                  </div>
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
  );
};

export default PricingPage;
