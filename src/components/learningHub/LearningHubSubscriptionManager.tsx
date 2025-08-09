
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Calendar,
  BookOpen,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LearningHubSubscriptionManager: React.FC = () => {
  const { toast } = useToast();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await learningHubPaymentService.getSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await learningHubPaymentService.createCustomerPortal();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Unable to open subscription management. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSyncStatus = async () => {
    setIsSyncing(true);
    try {
      await loadSubscriptionStatus();
      toast({
        title: "Success",
        description: "Subscription status updated successfully",
      });
    } catch (error) {
      console.error('Error syncing subscription:', error);
      toast({
        title: "Error",
        description: "Failed to sync subscription status",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (hasActive: boolean, needsPayment: boolean, isInGracePeriod: boolean) => {
    if (isInGracePeriod) return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Grace Period</Badge>;
    if (needsPayment) return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Payment Required</Badge>;
    if (hasActive) return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    return <Badge variant="outline">No Subscription</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading subscription details...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grace Period Alert */}
      {subscriptionStatus?.gracePeriodInfo?.isInGracePeriod && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Payment Failed - Grace Period Active</p>
              <p>
                Your payment failed, but you still have <strong>{subscriptionStatus.gracePeriodInfo.daysRemaining} days</strong> of access remaining.
              </p>
              {subscriptionStatus.gracePeriodInfo.gracePeriodEnd && (
                <p className="text-sm">
                  Access expires: {new Date(subscriptionStatus.gracePeriodInfo.gracePeriodEnd).toLocaleDateString()}
                </p>
              )}
              <Button 
                onClick={handleManageSubscription}
                size="sm"
                className="mt-2"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Learning Hub Subscription
            </CardTitle>
            {getStatusBadge(
              subscriptionStatus?.hasActiveSubscription || false,
              subscriptionStatus?.needsPaymentUpdate || false,
              subscriptionStatus?.gracePeriodInfo?.isInGracePeriod || false
            )}
          </div>
          <CardDescription>
            Unlimited access to all courses and materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus?.hasActiveSubscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Learning Hub Access</p>
                    <p className="text-sm text-gray-600">£25.00/month • All courses included</p>
                  </div>
                </div>
                {subscriptionStatus.subscription?.current_period_end && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Next billing</p>
                    <p className="text-sm font-medium">
                      {new Date(subscriptionStatus.subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {subscriptionStatus.subscription?.trial_end && new Date(subscriptionStatus.subscription.trial_end) > new Date() && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800 mb-1">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Free Trial Active</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Trial ends: {new Date(subscriptionStatus.subscription.trial_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No active subscription</p>
              <p className="text-sm text-gray-500 mt-1">
                Subscribe to get unlimited access to all courses
              </p>
            </div>
          )}

          {subscriptionStatus?.needsPaymentUpdate && !subscriptionStatus?.gracePeriodInfo?.isInGracePeriod && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Payment Update Required</p>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Your subscription requires payment method update. Please manage your subscription to continue access.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {subscriptionStatus?.hasActiveSubscription && (
              <Button onClick={handleManageSubscription} className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
            )}
            <Button onClick={handleSyncStatus} variant="outline" disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Use the subscription management portal to cancel, pause, or update your payment method.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningHubSubscriptionManager;
