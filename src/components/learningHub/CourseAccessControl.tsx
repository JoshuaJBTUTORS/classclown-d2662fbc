
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Lock, CreditCard, Clock } from 'lucide-react';
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

  // Fetch course details to check status
  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId),
    enabled: !!courseId,
  });

  const { data: hasPurchased, isLoading } = useQuery({
    queryKey: ['course-purchase', courseId, user?.id],
    queryFn: () => paymentService.checkCoursePurchase(courseId),
    enabled: !!user && !!courseId && !isOwner,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: paymentService.getSubscriptionStatus,
    enabled: !!user && !isOwner,
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

  // Check if course is draft - block access for everyone except owners
  if (course?.status === 'draft' && !isOwner) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Course Not Available
          </CardTitle>
          <CardDescription>
            This course is currently in development and not yet available
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

  // Show grace period warning if applicable
  if (subscriptionStatus?.gracePeriodInfo?.isInGracePeriod) {
    const { daysRemaining, gracePeriodEnd } = subscriptionStatus.gracePeriodInfo;
    
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Payment Issue - Limited Access</p>
              <p>
                Your payment failed, but you still have access for <strong>{daysRemaining} more days</strong>.
                {gracePeriodEnd && (
                  <span className="block text-sm mt-1">
                    Access expires: {new Date(gracePeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={async () => {
                  try {
                    const { url } = await paymentService.createCustomerPortal();
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

  // Check if payment needs updating (past due status)
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
