
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Lock } from 'lucide-react';
import { Course } from '@/types/course';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const { url } = await paymentService.createCoursePayment(course.id);
      
      // Open Stripe checkout in a new tab
      window.open(url, '_blank');
      
      toast({
        title: "Redirecting to payment",
        description: "Please complete your purchase in the new tab.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Purchase Course
          </DialogTitle>
          <DialogDescription>
            Get full access to {course.title} and all its lessons
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {course.description || "Complete course access"}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Full access to all course lessons</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Lifetime access to course content</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Progress tracking and completion certificates</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(course.price || 899)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={isProcessing}
            className="flex-1"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : "Buy Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePaymentModal;
