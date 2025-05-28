
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<{
    client_secret: string;
    customer_id: string;
    course_title: string;
    amount: number;
  } | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => learningHubService.getCourseById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (course && !paymentData) {
      initializePayment();
    }
  }, [course]);

  const initializePayment = async () => {
    if (!course) return;
    
    setIsLoadingPayment(true);
    try {
      const data = await paymentService.createPaymentIntent(course.id);
      setPaymentData(data);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Error",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
      navigate(`/course/${course.id}`);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentData || !course) return;

    try {
      await paymentService.completeSubscription(
        paymentData.client_secret.split('_secret_')[0],
        course.id
      );

      toast({
        title: "Welcome aboard!",
        description: "Your subscription is now active. Enjoy your 7-day free trial!",
      });

      navigate(`/course/${course.id}`);
    } catch (error) {
      console.error('Error completing subscription:', error);
      toast({
        title: "Subscription Error",
        description: "Payment successful but there was an issue activating your subscription. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Left Panel - Course Branding & Details */}
      <div className="lg:w-2/5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 lg:p-12 flex flex-col justify-between">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/course/${course.id}`)}
            className="mb-8 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course
          </Button>

          {/* Course Hero */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {course.description || "Unlock your potential with comprehensive learning materials, expert guidance, and practical exercises."}
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Full access to all course lessons</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Progress tracking and certificates</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Mobile and offline access</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">Expert support and community</span>
            </div>
          </div>

          {/* Trial Highlight */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded-full">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-semibold text-green-800">7-Day Free Trial</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Start learning immediately with full access. No commitments during your trial period - cancel anytime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Join 10,000+ learners</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-yellow-400" />
              <span>4.9/5 rating</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            <span>Secured by Stripe • 256-bit SSL encryption</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Payment Form */}
      <div className="lg:w-3/5 bg-white p-8 lg:p-12 flex flex-col">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
          {/* Order Summary */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Complete your subscription</h2>
            
            {/* Pricing Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">First 7 days</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Monthly subscription</span>
                <span className="font-semibold">{formatPrice(course.price || 899)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Due today</span>
                  <span className="font-bold text-xl text-gray-900">£0.00</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your trial starts today. You'll be charged {formatPrice(course.price || 899)} on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {paymentData ? (
            <EmbeddedPaymentForm
              clientSecret={paymentData.client_secret}
              customerId={paymentData.customer_id}
              courseTitle={paymentData.course_title}
              amount={paymentData.amount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden mt-8 pt-6 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            <span>Secured by Stripe • SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
