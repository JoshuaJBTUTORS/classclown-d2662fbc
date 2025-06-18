
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Lock, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CourseAccessControlProps {
  courseId: string;
  children: React.ReactNode;
}

const CourseAccessControl: React.FC<CourseAccessControlProps> = ({
  courseId,
  children
}) => {
  const { user, isOwner } = useAuth();

  const { data: hasPurchased, isLoading } = useQuery({
    queryKey: ['course-purchase', courseId, user?.id],
    queryFn: () => paymentService.checkCoursePurchase(courseId),
    enabled: !!user && !!courseId && !isOwner, // Skip check if user is owner
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: paymentService.getSubscriptionStatus,
    enabled: !!user && !isOwner, // Skip check if user is owner
  });

  // Sync subscription status on mount
  React.useEffect(() => {
    if (user && !isOwner) {
      paymentService.syncSubscriptionStatus().catch(console.error);
    }
  }, [user, isOwner]);

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Required
          </CardTitle>
          <CardDescription>
            Please sign in to access this course
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Owners have full access to all courses
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

  if (!hasPurchased) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Course Locked
          </CardTitle>
          <CardDescription>
            Subscribe to access this course content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.href = `/course/${courseId}`}>
            View Course Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if payment needs updating
  if (subscriptionStatus?.needsPaymentUpdate) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your payment method needs updating to continue accessing this course.
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto"
              onClick={async () => {
                try {
                  const { url } = await paymentService.createCustomerPortal();
                  window.open(url, '_blank');
                } catch (error) {
                  console.error('Error opening customer portal:', error);
                }
              }}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Update Payment Method
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default CourseAccessControl;
