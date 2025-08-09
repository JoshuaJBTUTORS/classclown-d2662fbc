
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Lock, CreditCard, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LearningHubAccessControlProps {
  children: React.ReactNode;
}

const LearningHubAccessControl: React.FC<LearningHubAccessControlProps> = ({ children }) => {
  const { user, isOwner } = useAuth();

  const { data: accessInfo, isLoading } = useQuery({
    queryKey: ['learning-hub-access', user?.id],
    queryFn: () => learningHubPaymentService.checkLearningHubAccess(),
    enabled: !!user && !isOwner,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Sign In Required
          </CardTitle>
          <CardDescription>
            Please sign in to access Learning Hub
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Owners have full access
  if (isOwner) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!accessInfo?.hasAccess) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Learning Hub Access Required
          </CardTitle>
          <CardDescription>
            Subscribe to unlock unlimited access to all courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">£25/month</p>
              <p className="text-sm text-muted-foreground">
                {accessInfo?.trialEligible && "7-day free trial • "}Cancel anytime
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={async () => {
                try {
                  const { url } = await learningHubPaymentService.createLearningHubSubscription();
                  window.open(url, '_blank');
                } catch (error) {
                  console.error('Error creating subscription:', error);
                }
              }}
            >
              {accessInfo?.trialEligible ? 'Start Free Trial' : 'Subscribe Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show grace period warning if applicable
  if (accessInfo.isInGracePeriod) {
    const daysRemaining = accessInfo.gracePeriodEnd 
      ? Math.ceil((new Date(accessInfo.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Payment Issue - Limited Access</p>
              <p>
                Your payment failed, but you still have access for <strong>{daysRemaining} more days</strong>.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={async () => {
                  try {
                    const { url } = await learningHubPaymentService.createCustomerPortal();
                    window.open(url, '_blank');
                  } catch (error) {
                    console.error('Error opening customer portal:', error);
                  }
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default LearningHubAccessControl;
