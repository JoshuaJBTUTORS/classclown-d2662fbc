import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  voice_minutes_per_month: number;
  price_monthly_pence: number;
  price_annual_pence: number;
}

interface PlanComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  currentPlanName: string;
  billingInterval: 'monthly' | 'yearly';
  onChangePlan: (planName: string) => Promise<void>;
}

export function PlanComparisonDialog({
  open,
  onOpenChange,
  plans,
  currentPlanName,
  billingInterval,
  onChangePlan
}: PlanComparisonDialogProps) {
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  const handlePlanChange = async (planName: string) => {
    setChangingPlan(planName);
    try {
      await onChangePlan(planName);
    } finally {
      setChangingPlan(null);
    }
  };

  const getPrice = (plan: Plan) => {
    const price = billingInterval === 'yearly' 
      ? plan.price_annual_pence 
      : plan.price_monthly_pence;
    return (price / 100).toFixed(2);
  };

  const getPricePerMinute = (plan: Plan) => {
    const price = billingInterval === 'yearly' 
      ? plan.price_annual_pence / 12
      : plan.price_monthly_pence;
    return (price / 100 / plan.voice_minutes_per_month).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upgrade or downgrade anytime. Changes take effect immediately with prorated billing.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {plans.map((plan) => {
            const isCurrent = plan.name === currentPlanName;
            const isUpgrade = plan.voice_minutes_per_month > (plans.find(p => p.name === currentPlanName)?.voice_minutes_per_month || 0);
            
            return (
              <Card 
                key={plan.id}
                className={`p-4 space-y-4 hover:shadow-lg transition-all ${
                  isCurrent ? 'border-mint-500 border-2 relative' : ''
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-mint-500">
                    Current Plan
                  </Badge>
                )}
                
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-3xl font-bold text-mint-700">
                    £{getPrice(plan)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    per {billingInterval === 'yearly' ? 'year' : 'month'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-mint-600" />
                    <span>{plan.voice_minutes_per_month} minutes/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-mint-600" />
                    <span>£{getPricePerMinute(plan)}/minute</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-mint-600" />
                    <span>All subjects</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-mint-600" />
                    <span>Unlimited replays</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePlanChange(plan.name)}
                  disabled={isCurrent || changingPlan !== null}
                  className={`w-full ${
                    isUpgrade && !isCurrent
                      ? 'bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-foreground'
                      : 'text-foreground'
                  }`}
                  variant={isCurrent ? 'outline' : 'default'}
                >
                  {changingPlan === plan.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : isUpgrade ? (
                    'Upgrade'
                  ) : (
                    'Downgrade'
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Changes are prorated automatically. You'll only pay the difference.
        </p>
      </DialogContent>
    </Dialog>
  );
}
