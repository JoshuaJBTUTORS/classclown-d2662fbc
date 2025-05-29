
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ShoppingCart, CheckCircle, Gift, Clock, Users, Star } from 'lucide-react';
import { Course } from '@/types/course';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import CoursePaymentModal from './CoursePaymentModal';
import { useAuth } from '@/contexts/AuthContext';

interface CourseCardProps {
  course: Course;
  isAdmin?: boolean;
  hasProgress?: boolean;
  viewMode?: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isAdmin = false, 
  hasProgress = false,
  viewMode = 'grid'
}) => {
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
      case 'draft': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'published': return 'bg-green-50 text-green-700 border-green-200';
      case 'archived': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
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
    navigate(`/course/${course.id}`);
  };

  const handlePurchaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPaymentModal(true);
  };

  const isPublishedAndNotPurchased = course.status === 'published' && !isPurchased && !isAdmin && user;

  if (viewMode === 'list') {
    return (
      <>
        <Card className="flex flex-row overflow-hidden hover:shadow-lg transition-all duration-200 border-gray-200 bg-white">
          <div className="w-48 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 relative flex-shrink-0">
            {course.cover_image_url ? (
              <img 
                src={course.cover_image_url} 
                alt={course.title} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
            )}
            
            {course.status === 'published' && course.price && (
              <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1">
                {formatPrice(course.price)}/month
              </Badge>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-between p-6">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{course.subject || "General"}</Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(course.status)} text-xs`}
                    >
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                    {isPurchased && (
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Subscribed
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {course.description || "No description available"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Self-paced</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>4.8</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isPublishedAndNotPurchased && (
                  <Button 
                    onClick={handlePurchaseClick}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Start Free Trial
                  </Button>
                )}
                
                <Button 
                  onClick={handleButtonClick} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  variant={course.status === 'published' ? "default" : "outline"}
                  disabled={course.status !== 'published' && !isAdmin}
                >
                  {isCheckingPurchase ? "Checking..." : getButtonText()}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <CoursePaymentModal
          course={course}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-200 border-gray-200 bg-white group">
        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
          {course.cover_image_url ? (
            <img 
              src={course.cover_image_url} 
              alt={course.title} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
          )}
          
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(course.status)} shadow-sm backdrop-blur-sm`}
            >
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </Badge>
            
            {isPurchased && (
              <Badge className="bg-green-500 text-white shadow-sm backdrop-blur-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                Subscribed
              </Badge>
            )}
          </div>
          
          {course.status === 'published' && course.price && (
            <Badge className="absolute bottom-3 left-3 bg-blue-600 text-white shadow-sm backdrop-blur-sm">
              {formatPrice(course.price)}/month
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-100 text-blue-700 text-xs">{course.subject || "General"}</Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>4.8</span>
            </div>
          </div>
          <CardTitle className="line-clamp-2 text-lg font-semibold text-gray-900">{course.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-gray-600">
            {course.description || "No description available"}
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="mt-auto flex flex-col gap-3 pt-0">
          <div className="flex items-center justify-between w-full text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Self-paced</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>1.2k students</span>
            </div>
          </div>
          
          <Button 
            onClick={handleButtonClick} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
            variant={course.status === 'published' ? "default" : "outline"}
            disabled={course.status !== 'published' && !isAdmin}
          >
            {isCheckingPurchase ? "Checking..." : getButtonText()}
          </Button>
          
          {isPublishedAndNotPurchased && (
            <Button 
              onClick={handlePurchaseClick}
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50 font-medium"
            >
              <Gift className="h-4 w-4 mr-2 text-green-600" />
              Start Free Trial
              <Badge className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1">
                7 days free
              </Badge>
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
