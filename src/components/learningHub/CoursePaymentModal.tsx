
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Lock, Calendar, Gift, ArrowRight, AlertTriangle } from 'lucide-react';
import { Course } from '@/types/course';
import { paymentService } from '@/services/paymentService';

interface CoursePaymentModalProps {
  course: Course;
  isOpen?: boolean;
  open?: boolean; // Alternative prop name for compatibility
  onClose: () => void;
  onSuccess?: () => void;
}

const CoursePaymentModal: React.FC<CoursePaymentModalProps> = ({
  course,
  isOpen,
  open,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [trialEligible, setTrialEligible] = useState(true);
  const [trialMessage, setTrialMessage] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  
  // Use either isOpen or open prop
  const modalOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : false);

  // Check trial eligibility when modal opens
  useEffect(() => {
    if (modalOpen) {
      checkTrialEligibility();
    }
  }, [modalOpen]);

  const checkTrialEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const result = await paymentService.checkTrialEligibility();
      setTrialEligible(result.eligible);
      if (!result.eligible && result.reason) {
        setTrialMessage(result.reason);
      }
    } catch (error) {
      console.error('Error checking trial eligibility:', error);
      setTrialEligible(false);
      setTrialMessage('Unable to verify trial eligibility. Please try again.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartTrial = () => {
    onClose();
    navigate(`/checkout/${course.id}`);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handlePaidSubscription = () => {
    onClose();
    // Navigate to a paid-only checkout (without trial)
    navigate(`/checkout/${course.id}?trial=false`);
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Subscribe to Course
          </DialogTitle>
          <DialogDescription>
            {checkingEligibility ? 'Checking trial eligibility...' : (
              trialEligible ? `Start your 7-day free trial for ${course.title}` : `Subscribe to ${course.title}`
            )}
          </DialogDescription>
        </DialogHeader>
        
        {checkingEligibility && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Checking trial eligibility...</div>
          </div>
        )}

        {!checkingEligibility && (
          <>
            {!trialEligible && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {trialMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {course.description || "Complete course access"}
                    </p>
                  </div>
                  
                  {trialEligible ? (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">7-Day Free Trial</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Start learning immediately with full access. Cancel anytime during your trial period.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Monthly Subscription</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Get immediate access to all course content with a monthly subscription.
                      </p>
                    </div>
                   )}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Full access to all course lessons</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{trialEligible ? 'Monthly subscription with trial period' : 'Monthly subscription'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Progress tracking and completion certificates</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {trialEligible ? (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span>First 7 days</span>
                          <span className="font-semibold text-green-600">FREE</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Then {formatPrice(course.price || 899)}/month</span>
                          <span className="text-sm text-muted-foreground">Cancel anytime</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">{formatPrice(course.price || 899)}/month</span>
                        <span className="text-sm text-muted-foreground">Cancel anytime</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {trialEligible ? (
                <Button 
                  onClick={handleStartTrial} 
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handlePaidSubscription} 
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Subscribe Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CoursePaymentModal;
