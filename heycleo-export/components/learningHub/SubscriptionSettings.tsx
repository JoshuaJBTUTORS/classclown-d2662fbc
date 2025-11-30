
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalLink, CreditCard, Calendar, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SubscriptionSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const status = await paymentService.getSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { url } = await paymentService.createCustomerPortal();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error creating customer portal:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management portal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      const status = await paymentService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      toast({
        title: 'Status updated',
        description: 'Your subscription status has been refreshed.',
      });
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh subscription status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (hasActive: boolean, needsPayment: boolean, isInGracePeriod: boolean) => {
    if (isInGracePeriod) return 'destructive';
    if (needsPayment) return 'destructive';
    if (hasActive) return 'default';
    return 'secondary';
  };

  const getStatusText = (hasActive: boolean, needsPayment: boolean, isInGracePeriod: boolean) => {
    if (isInGracePeriod) return 'Grace Period';
    if (needsPayment) return 'Payment Required';
    if (hasActive) return 'Active';
    return 'No Active Subscription';
  };

  return (
    <div className="space-y-6">
      {/* Grace Period Alert */}
      {subscriptionStatus?.gracePeriodInfo?.isInGracePeriod && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
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
                disabled={isLoading}
                size="sm"
                className="mt-2 bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Status */}
      <div className="p-4 rounded-2xl bg-white/40 border border-green-200" style={{ boxShadow: '0 4px 12px rgba(15, 80, 60, 0.1)' }}>
        <div className="pb-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Current Subscription</h3>
            {subscriptionStatus && (
              <Badge variant={getStatusBadgeVariant(
                subscriptionStatus.hasActiveSubscription,
                subscriptionStatus.needsPaymentUpdate,
                subscriptionStatus.gracePeriodInfo?.isInGracePeriod || false
              )}>
                {getStatusText(
                  subscriptionStatus.hasActiveSubscription,
                  subscriptionStatus.needsPaymentUpdate,
                  subscriptionStatus.gracePeriodInfo?.isInGracePeriod || false
                )}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {subscriptionStatus?.hasActiveSubscription ? (
            <div className="space-y-3">
              {subscriptionStatus.subscriptions.map((subscription: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4" style={{ color: 'hsl(var(--cleo-text-dark))' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Course Subscription</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--cleo-text-dark))', opacity: 0.7 }}>
                        Status: {subscription.status}
                        {subscription.status === 'grace_period' && subscription.grace_period_end && (
                          <span className="text-red-600 font-medium ml-2">
                            (Expires: {new Date(subscription.grace_period_end).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {subscription.trial_end && (
                    <div className="text-right">
                      <p className="text-sm" style={{ color: 'hsl(var(--cleo-text-dark))', opacity: 0.7 }}>Trial ends</p>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
                        {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-3" style={{ color: 'hsl(var(--cleo-text-dark))', opacity: 0.4 }} />
              <p style={{ color: 'hsl(var(--cleo-text-dark))' }}>No active subscription found</p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--cleo-text-dark))', opacity: 0.6 }}>
                Subscribe to courses to access premium content
              </p>
            </div>
          )}

          {subscriptionStatus?.needsPaymentUpdate && !subscriptionStatus?.gracePeriodInfo?.isInGracePeriod && (
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Payment Update Required</p>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Your subscription requires payment method update. Please manage your subscription to continue access.
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Management Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: 'hsl(var(--cleo-text-dark))' }}>Subscription Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="h-auto p-4 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Manage Subscription</div>
              <div className="text-xs opacity-90">Update payment, pause, or cancel</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={handleRefreshStatus}
            disabled={isLoading}
            className="h-auto p-4 flex items-center justify-center gap-3 border-green-300 hover:bg-green-50"
          >
            <Calendar className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Refresh Status</div>
              <div className="text-xs opacity-70">Update subscription information</div>
            </div>
          </Button>
        </div>

        <div className="text-sm p-3 rounded-lg bg-white/40 border border-green-200" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
          <p className="font-medium mb-1">About Subscription Management:</p>
          <ul className="space-y-1 text-xs">
            <li>• Use "Manage Subscription" to update payment methods, pause, or cancel your subscription</li>
            <li>• Changes made through the portal will be reflected in your account within a few minutes</li>
            <li>• You can reactivate paused subscriptions at any time</li>
            <li>• If payment fails, you'll have 5 days of continued access to resolve the issue</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
