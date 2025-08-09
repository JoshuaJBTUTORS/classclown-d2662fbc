
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, AlertTriangle, ArrowLeft } from 'lucide-react';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';
import LearningHubEmbeddedPayment from './LearningHubEmbeddedPayment';

interface LearningHubSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LearningHubSubscriptionModal: React.FC<LearningHubSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [trialEligible, setTrialEligible] = useState(true);
  const [trialMessage, setTrialMessage] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      checkTrialEligibility();
    }
  }, [isOpen]);

  const checkTrialEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const result = await learningHubPaymentService.checkTrialEligibility();
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

  const handleContinueToPayment = () => {
    setStep('payment');
  };

  const handlePaymentSuccess = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Stay on payment step to allow retry
  };

  const handleBackToInfo = () => {
    setStep('info');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'payment' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToInfo}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <BookOpen className="h-5 w-5 text-primary" />
            {step === 'info' ? 'Learning Hub Access' : 'Complete Your Subscription'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' ? (
              checkingEligibility ? 'Checking trial eligibility...' : (
                trialEligible ? 'Start your 7-day free trial' : 'Subscribe to Learning Hub'
              )
            ) : (
              'Enter your payment details to continue'
            )}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'info' && (
          <>
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
                
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-2xl mb-2">Learning Hub</h3>
                    <p className="text-muted-foreground text-sm">
                      Complete access to all courses and materials
                    </p>
                  </div>
                  
                  {trialEligible ? (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">7-Day Free Trial</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Start learning immediately with full access. Cancel anytime during your trial period.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Monthly Subscription</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Get immediate access to all course content with a monthly subscription.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What's included:</h4>
                    <ul className="space-y-2">
                      {[
                        "Unlimited access to ALL courses",
                        "New courses added regularly", 
                        "Progress tracking across all content",
                        "Download course materials",
                        "Mobile and desktop access",
                        "Cancel anytime"
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {trialEligible ? (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span>First 7 days</span>
                            <span className="font-semibold text-green-600">FREE</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">Then £25.00/month</span>
                            <span className="text-sm text-muted-foreground">Cancel anytime</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">£25.00/month</span>
                          <span className="text-sm text-muted-foreground">Cancel anytime</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleContinueToPayment} 
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'payment' && (
          <LearningHubEmbeddedPayment
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LearningHubSubscriptionModal;
