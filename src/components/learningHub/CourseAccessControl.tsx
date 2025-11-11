
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

  const { data: subscriptionAccess, isLoading } = useQuery({
    queryKey: ['platform-subscription-access', user?.id],
    queryFn: () => paymentService.checkPlatformSubscriptionAccess(),
    enabled: !!user && !!courseId && !isOwner,
  });

  // Sync platform subscription status on mount
  React.useEffect(() => {
    if (user && !isOwner) {
      const syncStatus = async () => {
        try {
          await supabase.functions.invoke('sync-platform-subscription-status');
        } catch (error) {
          console.error('Error syncing platform subscription status:', error);
        }
      };
      syncStatus();
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

  if (!subscriptionAccess?.hasAccess) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Subscription Required
          </CardTitle>
          <CardDescription>
            Subscribe to unlock all courses and voice sessions with Cleo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => window.location.href = `/pricing`}>
            View Subscription Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

export default CourseAccessControl;
