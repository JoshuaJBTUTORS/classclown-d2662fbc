import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Lock, Calendar, Gift, ArrowRight } from 'lucide-react';
import { Course } from '@/types/course';

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
  
  // Use either isOpen or open prop
  const modalOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : false);

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartTrial = () => {
    onClose();
    navigate(`/course/${course.id}/checkout`);
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
            Start your 7-day free trial for {course.title}
          </DialogDescription>
        </DialogHeader>
        
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
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Gift className="h-4 w-4 mr-2" />
            Continue to Checkout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePaymentModal;
