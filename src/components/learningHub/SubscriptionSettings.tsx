
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalLink, CreditCard, Calendar, AlertCircle } from 'lucide-react';

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

  const getStatusBadgeVariant = (hasActive: boolean, needsPayment: boolean) => {
    if (needsPayment) return 'destructive';
    if (hasActive) return 'default';
    return 'secondary';
  };

  const getStatusText = (hasActive: boolean, needsPayment: boolean) => {
    if (needsPayment) return 'Payment Required';
    if (hasActive) return 'Active';
    return 'No Active Subscription';
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Subscription</CardTitle>
            {subscriptionStatus && (
              <Badge variant={getStatusBadgeVariant(
                subscriptionStatus.hasActiveSubscription,
                subscriptionStatus.needsPaymentUpdate
              )}>
                {getStatusText(
                  subscriptionStatus.hasActiveSubscription,
                  subscriptionStatus.needsPaymentUpdate
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus?.hasActiveSubscription ? (
            <div className="space-y-3">
              {subscriptionStatus.subscriptions.map((subscription: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">Course Subscription</p>
                      <p className="text-sm text-gray-600">
                        Status: {subscription.status}
                      </p>
                    </div>
                  </div>
                  {subscription.trial_end && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Trial ends</p>
                      <p className="text-sm font-medium">
                        {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active subscription found</p>
              <p className="text-sm text-gray-500 mt-1">
                Subscribe to courses to access premium content
              </p>
            </div>
          )}

          {subscriptionStatus?.needsPaymentUpdate && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Payment Update Required</p>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Your subscription requires payment method update. Please manage your subscription to continue access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Management Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Subscription Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="h-auto p-4 flex items-center justify-center gap-3"
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
            className="h-auto p-4 flex items-center justify-center gap-3"
          >
            <Calendar className="h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Refresh Status</div>
              <div className="text-xs opacity-70">Update subscription information</div>
            </div>
          </Button>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">About Subscription Management:</p>
          <ul className="space-y-1 text-xs">
            <li>• Use "Manage Subscription" to update payment methods, pause, or cancel your subscription</li>
            <li>• Changes made through the portal will be reflected in your account within a few minutes</li>
            <li>• You can reactivate paused subscriptions at any time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettings;
