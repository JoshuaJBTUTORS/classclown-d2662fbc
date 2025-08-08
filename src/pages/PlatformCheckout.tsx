
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import EmbeddedPaymentForm from '@/components/learningHub/EmbeddedPaymentForm';

const PlatformCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const trialDisabled = searchParams.get('trial') === 'false';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    initializePayment();
  }, [user, navigate]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { client_secret, customer_id } = await paymentService.createPaymentIntent();
      
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

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    
    toast({
      title: "Welcome to the platform!",
      description: "Your subscription is now active. You have access to all courses.",
    });

    // Redirect to courses after a short delay
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
            <h2 className="text-2xl font-bold text-green-800 mb-2">Welcome to the Platform!</h2>
            <p className="text-gray-600 mb-4">
              Your subscription is now active. You have access to all courses.
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
            <p className="text-gray-600">Setting up your subscription...</p>
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
            <h2 className="text-xl font-bold text-red-800 mb-2">Unable to Process</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/learning-hub/library')} className="w-full">
                Browse Courses
              </Button>
              <Button 
                variant="outline" 
                onClick={initializePayment} 
                className="w-full"
              >
                Try Again
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
              onClick={() => navigate('/learning-hub/library')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Platform Subscription</h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Subscribe to Platform
            </CardTitle>
            <CardDescription className="text-lg">
              Get unlimited access to all courses for £28.55/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret && (
              <EmbeddedPaymentForm
                clientSecret={clientSecret}
                customerId={customerId}
                courseTitle="Platform Access"
                amount={2855} // £28.55 in pence
                userEmail={user.email || ''}
                userName={user.user_metadata?.first_name || ''}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformCheckout;
