
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Lock, CheckCircle, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmbeddedPaymentForm from '@/components/learningHub/EmbeddedPaymentForm';

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<{
    subscription_id: string;
    client_secret?: string;
    status: string;
    trial_end?: string;
    course_title: string;
    amount: number;
    requires_payment_method: boolean;
    message?: string;
  } | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [hasStartedTrial, setHasStartedTrial] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Check if user already has access on component mount
  useEffect(() => {
    if (course && !hasStartedTrial) {
      checkExistingAccess();
    }
  }, [course]);

  const checkExistingAccess = async () => {
    if (!course) return;
    
    try {
      const hasAccess = await paymentService.checkCoursePurchase(course.id);
      if (hasAccess) {
        toast({
          title: "Access Already Available",
          description: "You already have access to this course!",
        });
        navigate(`/learning-hub/course/${course.id}`);
      }
    } catch (error) {
      console.error('Error checking course access:', error);
    }
  };

  const handleStartTrial = async () => {
    if (!course || hasStartedTrial) return;
    
    setIsLoadingSubscription(true);
    setHasStartedTrial(true);
    
    try {
      const data = await paymentService.createSubscriptionWithTrial(course.id);
      
      console.log('Subscription response:', data);
      
      if (data.message === "Course already purchased") {
        toast({
          title: "Access Already Available",
          description: "You already have access to this course!",
        });
        navigate(`/learning-hub/course/${course.id}`);
        return;
      }
      
      setSubscriptionData(data);
      
      // If subscription is already active (trial), redirect immediately
      if (data.status === 'trialing') {
        toast({
          title: "Free trial activated!",
          description: "Your 7-day free trial has started. Enjoy full access to the course!",
        });
        navigate(`/learning-hub/course/${course.id}`);
        return;
      }
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      setHasStartedTrial(false);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Unable to start your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!subscriptionData || !course) return;

    try {
      await paymentService.completeSubscriptionSetup(subscriptionData.subscription_id);

      toast({
        title: "Welcome aboard!",
        description: "Your subscription is now active. Enjoy your 7-day free trial!",
      });

      navigate(`/learning-hub/course/${course.id}`);
    } catch (error) {
      console.error('Error completing subscription setup:', error);
      toast({
        title: "Setup Error",
        description: "Payment method saved but there was an issue completing setup. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Setup Failed",
      description: error,
      variant: "destructive",
    });
    setHasStartedTrial(false);
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel - Course Information */}
      <div className="lg:w-2/5 bg-gradient-to-br from-white via-white to-primary/5 border-r border-gray-100 p-8 lg:p-12 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/learning-hub/course/${course.id}`)}
            className="mb-6 p-0 h-auto font-normal text-gray-600 hover:text-primary hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course
          </Button>
        </div>

        {/* Course Details */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {course.description || "Comprehensive learning with expert guidance and practical exercises."}
            </p>
          </div>

          {/* What's Included */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's included</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Full access to all course lessons and materials</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Progress tracking and completion certificates</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Mobile access and offline downloads</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Expert support and community access</span>
              </div>
            </div>
          </div>

          {/* Trial Information */}
          <div className="border border-primary/20 bg-primary/10 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-primary/20 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-primary">7-Day Free Trial</span>
            </div>
            <p className="text-sm text-primary/80">
              Start learning immediately with full access. No charges during your trial period - cancel anytime.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>10,000+ students</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-yellow-400" />
              <span>4.9 rating</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            <span>Payments secured by Stripe</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Subscription Setup */}
      <div className="lg:w-3/5 bg-white p-8 lg:p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start your free trial</h2>
            <p className="text-gray-600">7 days free, then {course.price ? formatPrice(course.price) : '£8.99'}/month</p>
          </div>

          {/* Show start trial button if no subscription data yet */}
          {!subscriptionData && !hasStartedTrial && (
            <div className="space-y-6">
              <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
                <h3 className="font-semibold text-gray-900 mb-4">Ready to start?</h3>
                <p className="text-gray-600 mb-4">
                  Click below to start your 7-day free trial. You'll only need to add a payment method to continue after the trial period.
                </p>
                <Button
                  onClick={handleStartTrial}
                  disabled={isLoadingSubscription}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors"
                >
                  {isLoadingSubscription ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting trial...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Start 7-Day Free Trial
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Payment Form or Loading */}
          {subscriptionData && subscriptionData.requires_payment_method && subscriptionData.client_secret && (
            <EmbeddedPaymentForm
              clientSecret={subscriptionData.client_secret}
              customerId=""
              courseTitle={subscriptionData.course_title}
              amount={subscriptionData.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}

          {/* Loading state */}
          {hasStartedTrial && !subscriptionData && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">
                Setting up your subscription...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
