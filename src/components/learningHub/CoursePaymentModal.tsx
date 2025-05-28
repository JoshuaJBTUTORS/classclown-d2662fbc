
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Lock, Calendar, Gift, Loader2 } from 'lucide-react';
import { Course } from '@/types/course';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import EmbeddedPaymentForm from './EmbeddedPaymentForm';

interface CoursePaymentModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

const CoursePaymentModal: React.FC<CoursePaymentModalProps> = ({
  course,
  isOpen,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    client_secret: string;
    customer_id: string;
    course_title: string;
    amount: number;
  } | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.createPaymentIntent(course.id);
      setPaymentData(data);
      setShowPaymentForm(true);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Error",
        description: "There was an error setting up your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentData) return;

    try {
      await paymentService.completeSubscription(
        paymentData.client_secret.split('_secret_')[0], // Extract payment intent ID
        course.id
      );

      toast({
        title: "Subscription started!",
        description: "Your 7-day free trial has begun. You now have full access to this course.",
      });

      onClose();
      // Refresh the page to update purchase status
      window.location.reload();
    } catch (error) {
      console.error('Error completing subscription:', error);
      toast({
        title: "Subscription Error",
        description: "There was an error completing your subscription. Please contact support.",
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

  const handleBackToOverview = () => {
    setShowPaymentForm(false);
    setPaymentData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {showPaymentForm ? 'Complete Payment' : 'Subscribe to Course'}
          </DialogTitle>
          <DialogDescription>
            {showPaymentForm 
              ? 'Enter your payment details to start your free trial'
              : `Start your 7-day free trial for ${course.title}`
            }
          </DialogDescription>
        </DialogHeader>
        
        {!showPaymentForm ? (
          <>
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {course.description || "Complete course access"}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">7-Day Free Trial</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Start learning immediately with full access. Cancel anytime during your trial period.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Full access to all course lessons</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>Monthly subscription with trial period</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Progress tracking and completion certificates</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>First 7 days</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Then {formatPrice(course.price || 899)}/month</span>
                      <span className="text-sm text-muted-foreground">Cancel anytime</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleStartTrial} 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {paymentData && (
              <EmbeddedPaymentForm
                clientSecret={paymentData.client_secret}
                customerId={paymentData.customer_id}
                courseTitle={paymentData.course_title}
                amount={paymentData.amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
            
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline" 
                onClick={handleBackToOverview}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoursePaymentModal;
