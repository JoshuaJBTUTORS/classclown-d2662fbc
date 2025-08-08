import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Lock, CheckCircle, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmbeddedPaymentForm from '@/components/learningHub/EmbeddedPaymentForm';

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner, user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    customerId: string;
    courseTitle: string;
    amount: number;
  } | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [trialEligible, setTrialEligible] = useState(true);
  
  // Check if this is a paid-only checkout
  const isTrialDisabled = searchParams.get('trial') === 'false';

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Handle checkout cancellation
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Checkout Cancelled",
        description: "You can return to complete your subscription anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  // Redirect owners directly to course content
  useEffect(() => {
    if (course && isOwner) {
      toast({
        title: "Admin Access",
        description: "Redirecting to course content with full access.",
      });
      navigate(`/course/${course.id}`);
    }
  }, [course, isOwner, navigate, toast]);

  // Check if user already has access on component mount
  useEffect(() => {
    if (course && !isOwner) {
      checkExistingAccess();
    }
  }, [course, isOwner]);

  // Initialize embedded payment form when component mounts
  useEffect(() => {
    if (course && !isOwner && !paymentData) {
      initializeEmbeddedPayment();
    }
  }, [course, isOwner, paymentData]);

  const checkExistingAccess = async () => {
    if (!course) return;
    
    try {
      const hasAccess = await paymentService.checkCoursePurchase(course.id);
      if (hasAccess) {
        toast({
          title: "Access Already Available",
          description: "You already have access to this course!",
        });
        navigate(`/course/${course.id}`);
      }
    } catch (error) {
      console.error('Error checking course access:', error);
    }
  };

  const initializeEmbeddedPayment = async () => {
    if (!course) return;
    
    setIsLoadingPayment(true);
    setPaymentError(null);
    
    try {
      const data = await paymentService.createPaymentIntent(course.id);
      
      console.log('Payment intent response:', data);
      
      if (data.client_secret) {
        setPaymentData({
          clientSecret: data.client_secret,
          customerId: data.customer_id,
          courseTitle: data.course_title,
          amount: data.amount,
        });
      } else {
        throw new Error("No client secret received");
      }
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setPaymentError(error instanceof Error ? error.message : "Unable to initialize payment. Please try again.");
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Welcome aboard! 🎉",
      description: "Your subscription is now active. Enjoy your 3-day free trial!",
    });
    navigate(`/course/${course.id}`);
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    toast({
      title: "Payment Error",
      description: error,
      variant: "destructive",
    });
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  // Extract user information for pre-filling the form
  const userEmail = user?.email || '';
  const userName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    '';

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render checkout content for owners (they get redirected)
  if (isOwner) {
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
            onClick={() => navigate(`/course/${course.id}`)}
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
          {!isTrialDisabled && (
            <div className="border border-primary/20 bg-primary/10 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-primary/20 rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold text-primary">3-Day Free Trial</span>
              </div>
              <p className="text-sm text-primary/80">
                Start learning immediately with full access. Complete your payment details to begin your trial.
              </p>
            </div>
          )}
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

      {/* Right Panel - Embedded Payment Form */}
      <div className="lg:w-3/5 bg-white p-8 lg:p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isTrialDisabled ? 'Complete your subscription' : 'Complete your free trial'}
            </h2>
            <p className="text-gray-600">
              {isTrialDisabled 
                ? `${course.price ? formatPrice(course.price) : '£12.99'}/month`
                : `3 days free, then ${course.price ? formatPrice(course.price) : '£12.99'}/month`
              }
            </p>
          </div>

          {isLoadingPayment ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading payment form...</span>
            </div>
          ) : paymentError ? (
            <div className="border border-red-200 bg-red-50 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-2">Payment Setup Error</h3>
              <p className="text-red-700 mb-4">{paymentError}</p>
              <Button
                onClick={initializeEmbeddedPayment}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          ) : paymentData ? (
            <EmbeddedPaymentForm
              clientSecret={paymentData.clientSecret}
              customerId={paymentData.customerId}
              courseTitle={paymentData.courseTitle}
              amount={paymentData.amount}
              userEmail={userEmail}
              userName={userName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Initializing payment form...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
