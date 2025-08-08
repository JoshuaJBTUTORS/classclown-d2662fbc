
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign
} from 'lucide-react';
import { CoursePurchase } from '@/types/course';

const SubscriptionManager: React.FC = () => {
  const { toast } = useToast();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    subscriptions: CoursePurchase[];
    needsPaymentUpdate: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await paymentService.getSubscriptionStatus();
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
      const { url } = await paymentService.createCustomerPortal();
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
      await paymentService.syncSubscriptionStatus();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Payment Due</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
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

  if (!subscriptionStatus || subscriptionStatus.subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            No active subscriptions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Subscribe to courses to access premium content and features.
          </p>
          <Button onClick={handleSyncStatus} variant="outline" disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your course subscriptions and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionStatus.needsPaymentUpdate && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Payment Required</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Your payment method needs to be updated to continue accessing your courses.
            </p>
            <Button onClick={handleManageSubscription} size="sm" variant="destructive">
              Update Payment Method
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {subscriptionStatus.subscriptions.map((subscription) => (
            <div key={subscription.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">Course Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(subscription.amount_paid)}/month
                  </p>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Started {new Date(subscription.purchase_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {subscription.currency.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleManageSubscription} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
          <Button onClick={handleSyncStatus} variant="outline" disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use the subscription management portal to cancel, pause, or update your payment method.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
