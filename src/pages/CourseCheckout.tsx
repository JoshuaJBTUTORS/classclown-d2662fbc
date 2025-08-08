
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import EmbeddedPaymentForm from '@/components/learningHub/EmbeddedPaymentForm';

const CourseCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Redirect to platform checkout since we no longer do per-course purchases
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Redirect to platform checkout
    navigate('/checkout/platform');
  }, [user, navigate]);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { client_secret, customer_id, amount } = await paymentService.createPaymentIntent();
      
      setClientSecret(client_secret);
      setCustomerId(customer_id);
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      
      if (error.message.includes('already')) {
        setError('You already have access to all courses!');
        setTimeout(() => {
          navigate('/learning-hub/my-courses');
        }, 2000);
      } else if (error.message.includes('Trial already used')) {
        setError('You have already used your free trial. Please choose a paid subscription.');
      } else {
        setError(error.message || 'Failed to initialize payment. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (sessionId?: string) => {
    setPaymentSuccess(true);
    
    toast({
      title: "Payment successful!",
      description: "You now have access to all courses on the platform.",
    });

    setTimeout(() => {
      navigate('/learning-hub/my-courses');
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              You now have access to all courses on the platform.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to your courses...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Redirecting to platform checkout...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Checkout Not Available</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/learning-hub/library')} className="w-full">
                Browse Courses
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/checkout/platform')} 
                className="w-full"
              >
                Go to Platform Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Course Checkout</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Subscribe to Access All Courses
            </CardTitle>
            <CardDescription className="text-lg">
              Get unlimited access to all courses including {course?.title} for £28.55/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                We've simplified our pricing! Instead of individual course purchases, 
                you now get access to all courses with one subscription.
              </p>
              <Button onClick={() => navigate('/checkout/platform')} className="w-full">
                Continue to Platform Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseCheckout;
