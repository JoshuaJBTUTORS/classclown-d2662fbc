
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, Lock, CheckCircle, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const { data: course, isLoading: isCourseLoading } = useQuery({
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
    if (course && isOwner && !isCourseLoading) {
      console.log('Owner detected, redirecting to course');
      toast({
        title: "Admin Access",
        description: "Redirecting to course content with full access.",
      });
      navigate(`/course/${course.id}`);
    }
  }, [course, isOwner, navigate, toast, isCourseLoading]);

  // Check if user already has access on component mount
  useEffect(() => {
    if (course && !isOwner && !isCheckingAccess) {
      checkExistingAccess();
    }
  }, [course, isOwner]);

  const checkExistingAccess = async () => {
    if (!course || isOwner) return;
    
    console.log('Checking existing access for course:', course.id);
    setIsCheckingAccess(true);
    
    try {
      const hasAccess = await paymentService.checkCoursePurchase(course.id);
      console.log('Access check result:', hasAccess);
      
      if (hasAccess) {
        toast({
          title: "Access Already Available",
          description: "You already have access to this course!",
        });
        navigate(`/course/${course.id}`);
        return;
      }
    } catch (error) {
      console.error('Error checking course access:', error);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course) return;
    
    setIsLoadingSubscription(true);
    
    try {
      console.log('Starting checkout for course:', course.id);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      // Create a form and submit it to trigger the server-side redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/create-checkout-session`;
      form.style.display = 'none';
      
      // Add course ID
      const courseInput = document.createElement('input');
      courseInput.type = 'hidden';
      courseInput.name = 'courseId';
      courseInput.value = course.id;
      form.appendChild(courseInput);
      
      // Add authorization token
      const authInput = document.createElement('input');
      authInput.type = 'hidden';
      authInput.name = 'authorization';
      authInput.value = `Bearer ${session.access_token}`;
      form.appendChild(authInput);
      
      // Add API key
      const apikeyInput = document.createElement('input');
      apikeyInput.type = 'hidden';
      apikeyInput.name = 'apikey';
      apikeyInput.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA';
      form.appendChild(apikeyInput);
      
      document.body.appendChild(form);
      form.submit();
      
      // Clean up the form after submission
      setTimeout(() => {
        if (form.parentNode) {
          document.body.removeChild(form);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Subscription Error",
        description: error instanceof Error ? error.message : "Unable to start your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  // Show loading spinner while checking course or access
  if (isCourseLoading || isCheckingAccess || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCourseLoading ? 'Loading course...' : 'Checking access...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render checkout content for owners (they get redirected)
  if (isOwner) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to course...</p>
        </div>
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
          <div className="border border-primary/20 bg-primary/10 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-primary/20 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-primary">3-Day Free Trial</span>
            </div>
            <p className="text-sm text-primary/80">
              Start learning immediately with full access. Payment details required but no charges during your trial period.
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

      {/* Right Panel - Trial Signup */}
      <div className="lg:w-3/5 bg-white p-8 lg:p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Start your free trial</h2>
            <p className="text-gray-600">3 days free, then {course.price ? formatPrice(course.price) : '£12.99'}/month</p>
          </div>

          <div className="space-y-6">
            <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
              <h3 className="font-semibold text-gray-900 mb-4">Ready to start?</h3>
              <p className="text-gray-600 mb-4">
                Click below to proceed to secure checkout. You'll enter your payment details but won't be charged during the 3-day trial period.
              </p>
              
              {/* Form following Ruby pattern */}
              <form onSubmit={handleStartTrial}>
                <input type="hidden" name="courseId" value={course.id} />
                <Button
                  type="submit"
                  disabled={isLoadingSubscription}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors"
                >
                  {isLoadingSubscription ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting checkout...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Start 3-Day Free Trial
                    </>
                  )}
                </Button>
              </form>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                After your trial ends, you'll be charged {course.price ? formatPrice(course.price) : '£12.99'} monthly. 
                You can cancel or manage your subscription anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
