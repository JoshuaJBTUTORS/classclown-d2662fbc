
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Panel - Course Information */}
      <div className="lg:w-2/5 bg-white border-r border-gray-100 p-8 lg:p-12 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/course/${course.id}`)}
            className="mb-6 p-0 h-auto font-normal text-gray-600 hover:text-gray-900 hover:bg-transparent"
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
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Full access to all course lessons and materials</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Progress tracking and completion certificates</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Mobile access and offline downloads</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Expert support and community access</span>
              </div>
            </div>
          </div>

          {/* Trial Information */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-green-100 rounded-full">
                <Shield className="h-4 w-4 text-green-700" />
              </div>
              <span className="font-semibold text-green-900">7-Day Free Trial</span>
            </div>
            <p className="text-sm text-green-800">
              Start learning immediately with full access. Cancel anytime during your trial period with no charges.
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

      {/* Right Panel - Payment Form */}
      <div className="lg:w-3/5 bg-white p-8 lg:p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete subscription</h2>
            <p className="text-gray-600">Start your 7-day free trial today</p>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
