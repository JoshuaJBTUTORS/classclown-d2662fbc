
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Clock, Gift, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { learningHubPaymentService } from '@/services/learningHubPaymentService';

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
  const [trialEligible, setTrialEligible] = useState(true);
  const [trialMessage, setTrialMessage] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { url } = await learningHubPaymentService.createLearningHubSubscription();
      window.open(url, '_blank');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited access to ALL courses",
    "New courses added regularly",
    "Progress tracking across all content",
    "Download course materials",
    "Mobile and desktop access",
    "Cancel anytime"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Learning Hub Access
          </DialogTitle>
          <DialogDescription>
            {checkingEligibility ? 'Checking trial eligibility...' : (
              trialEligible ? 'Start your 7-day free trial' : 'Subscribe to Learning Hub'
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
                  <div className="text-center">
                    <h3 className="font-semibold text-2xl">Learning Hub</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete access to all courses and materials
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
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">Monthly Subscription</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Get immediate access to all course content with a monthly subscription.
                      </p>
                    </div>
                   )}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
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
              </CardContent>
            </Card>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubscribe} 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <>
                    {trialEligible ? <Gift className="h-4 w-4 mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                    {trialEligible ? 'Start Free Trial' : 'Subscribe Now'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LearningHubSubscriptionModal;
