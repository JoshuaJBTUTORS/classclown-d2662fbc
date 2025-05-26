
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ShoppingCart, CheckCircle } from 'lucide-react';
import { Course } from '@/types/course';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import CoursePaymentModal from './CoursePaymentModal';
import { useAuth } from '@/contexts/AuthContext';

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
  hasProgress?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isAdmin = false, hasProgress = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(true);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (user && course.status === 'published') {
        try {
          const purchased = await paymentService.checkCoursePurchase(course.id);
          setIsPurchased(purchased);
        } catch (error) {
          console.error('Error checking purchase status:', error);
        }
      }
      setIsCheckingPurchase(false);
    };

    checkPurchaseStatus();
  }, [course.id, user, course.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const getButtonText = () => {
    if (course.status !== 'published' && !isAdmin) {
      return "Preview Course";
    }
    
    if (isPurchased || isAdmin) {
      return hasProgress ? "Continue Learning" : "Start Learning";
    }
    
    return "Preview Course";
  };

  const handleButtonClick = () => {
    if (course.status === 'published' && !isPurchased && !isAdmin && user) {
      // For published courses that haven't been purchased by non-admin users
      // Still allow preview (first lesson access)
      navigate(`/course/${course.id}`);
    } else {
      // For all other cases (admin, purchased, or preview)
      navigate(`/course/${course.id}`);
    }
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPaymentModal(true);
  };

  const isPublishedAndNotPurchased = course.status === 'published' && !isPurchased && !isAdmin && user;

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full">
        <div className="h-40 bg-gray-100 relative">
          {course.cover_image_url ? (
            <img 
              src={course.cover_image_url} 
              alt={course.title} 
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(course.status)}`}
            >
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </Badge>
            
            {isPurchased && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Owned
              </Badge>
            )}
          </div>
          
          {course.status === 'published' && course.price && (
            <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white">
              {formatPrice(course.price)}
            </Badge>
          )}
        </div>
        
        <CardHeader>
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <CardDescription className="line-clamp-3">
            {course.description || "No description available"}
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="mt-auto flex flex-col gap-2">
          <Button 
            onClick={handleButtonClick} 
            className="w-full"
            variant={course.status === 'published' ? "default" : "outline"}
            disabled={course.status !== 'published' && !isAdmin}
          >
            {isCheckingPurchase ? "Checking..." : getButtonText()}
          </Button>
          
          {isPublishedAndNotPurchased && (
            <Button 
              onClick={handlePurchaseClick}
              variant="outline"
              className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Full Course - {formatPrice(course.price || 899)}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <CoursePaymentModal
        course={course}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </>
  );
};

export default CourseCard;
