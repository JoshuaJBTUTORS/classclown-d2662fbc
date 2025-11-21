import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Zap, CreditCard, Calendar, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { PlanComparisonDialog } from '@/components/subscription/PlanComparisonDialog';

interface Subscription {
  plan_name: string;
  billing_interval: string;
  status: string;
  current_period_end: string;
  voice_sessions_per_month: number;
}

interface Quota {
  minutes_remaining: number;
  bonus_minutes: number;
  minutes_used: number;
  total_minutes_allowed: number;
  period_end: string;
}

export default function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionData();
    fetchAvailablePlans();
  }, []);

  // Handle successful subscription
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      setShowSuccess(true);
      toast({
        title: 'Success!',
        description: 'Subscription activated successfully!',
      });
      
      setTimeout(() => {
        fetchSubscriptionData();
      }, 2000);

      setTimeout(() => {
        navigate('/learning-hub/my-courses');
      }, 3000);
    }
  }, [searchParams, navigate, toast]);

  const fetchSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch subscription
      const { data: subData } = await supabase
        .from('user_platform_subscriptions')
        .select(`
          *,
          plan:platform_subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subData) {
        setSubscription({
          plan_name: subData.plan.name,
          billing_interval: subData.billing_interval,
          status: subData.status,
          current_period_end: subData.current_period_end,
          voice_sessions_per_month: subData.plan.voice_sessions_per_month
        });
      }

      // Fetch current quota
      const now = new Date().toISOString();
      const { data: quotaData } = await supabase
        .from('voice_session_quotas')
        .select('*')
        .eq('user_id', user.id)
        .lte('period_start', now)
        .gte('period_end', now)
        .single();

      if (quotaData) {
        setQuota(quotaData);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    const { data } = await supabase
      .from('platform_subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('voice_minutes_per_month', { ascending: true });
    setAvailablePlans(data || []);
  };

  const handleChangePlan = async (newPlanName: string) => {
    try {
      await paymentService.updateSubscriptionPlan(newPlanName);
      
      toast({
        title: 'Plan Updated!',
        description: `Successfully switched to ${newPlanName} plan. Changes take effect immediately.`,
      });
      
      await fetchSubscriptionData();
      setShowPlanDialog(false);
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to change plan. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('platform-customer-portal');
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('No billing account found')) {
          toast({
            title: 'No Subscription Found',
            description: 'Please subscribe to a plan first to manage your billing.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-mint-600" />
      </div>
    );
  }

  // Show success message after subscription
  if (showSuccess) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 max-w-md text-center">
            <CheckCircle className="w-16 h-16 text-mint-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Subscription Activated!</h2>
            <p className="text-muted-foreground mb-4">
              Your subscription is now active. Redirecting you to courses...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-mint-600 mx-auto" />
          </Card>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card className="p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">No Active Subscription</h2>
          <p className="text-muted-foreground">
            Subscribe to start learning with Cleo's voice sessions
          </p>
          <Button onClick={() => navigate('/pricing')}>
            View Plans
          </Button>
        </Card>
      </div>
    );
  }

  const totalRemaining = (quota?.minutes_remaining || 0) + (quota?.bonus_minutes || 0);
  const percentUsed = quota 
    ? ((quota.minutes_used / quota.total_minutes_allowed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background-cream">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your Cleo voice sessions and billing</p>
        </div>

        {/* Current Plan Card */}
        <Card className="p-6 space-y-6 bg-gradient-to-br from-mint-50 to-white border-mint-200 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-mint-700">
                {subscription.plan_name} Plan
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
              </h2>
              <p className="text-muted-foreground capitalize">
                {subscription.billing_interval} billing
              </p>
            </div>
            <Button 
              onClick={() => setShowPlanDialog(true)}
              className="bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-white border-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>

        {/* Usage Stats */}
        {quota && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Voice Minutes This Period</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{totalRemaining}</span>
                  <span className="text-muted-foreground">/ {quota.total_minutes_allowed} remaining</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-mint-600" />
            </div>

            <Progress value={100 - percentUsed} className="h-3" />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-mint-600">{quota.minutes_used}</p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRemaining}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Resets on {new Date(quota.period_end).toLocaleDateString()}</span>
            </div>
          </div>
          )}
        </Card>

        {/* Upgrade Prompt when out of minutes */}
        {totalRemaining === 0 && (
          <Card className="p-6 space-y-4 bg-gradient-to-br from-mint-50 to-white border-mint-200">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-mint-600" />
              <h3 className="text-xl font-bold">Out of Minutes?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              You've used all your minutes this month. Upgrade your plan for more learning time!
            </p>
            <Button 
              onClick={() => setShowPlanDialog(true)}
              className="w-full bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button 
              onClick={() => setShowPlanDialog(true)}
              className="w-full justify-between bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 text-white"
            >
              Upgrade Plan
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/learning-hub')}>
              Back to Learning Hub
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={handleManageSubscription}>
              View Billing History
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Plan Comparison Dialog */}
        <PlanComparisonDialog
          open={showPlanDialog}
          onOpenChange={setShowPlanDialog}
          plans={availablePlans}
          currentPlanName={subscription.plan_name}
          billingInterval={subscription.billing_interval as 'monthly' | 'yearly'}
          onChangePlan={handleChangePlan}
        />
      </div>
    </div>
  );
}

