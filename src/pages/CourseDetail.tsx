
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import ContentViewer from '@/components/learningHub/ContentViewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Users, 
  CheckCircle,
  Lock,
  Gift
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => learningHubService.getCourseById(id!),
    enabled: !!id,
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', id],
    queryFn: () => learningHubService.getCourseModules(id!),
    enabled: !!id,
  });

  const { data: hasPurchased } = useQuery({
    queryKey: ['course-purchase', id],
    queryFn: () => paymentService.checkCoursePurchase(id!),
    enabled: !!id,
  });

  // Handle payment success/cancellation from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      await paymentService.verifyCoursePayment(sessionId);
      toast({
        title: "Welcome aboard! 🎉",
        description: "Your subscription is now active. Enjoy your 7-day free trial!",
      });
      // Refresh the page to update access
      window.location.reload();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Payment Verification Issue",
        description: "Your payment was successful, but we're still processing it. Access will be granted shortly.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartLearning = () => {
    if (hasPurchased) {
      // Find first lesson and start
      if (modules && modules.length > 0 && modules[0].lessons.length > 0) {
        setSelectedLessonId(modules[0].lessons[0].id);
      }
    } else {
      setShowPaymentModal(true);
    }
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedLessonId ? (
        <CourseAccessControl courseId={course.id}>
          <div className="flex h-screen">
            <CourseSidebar 
              course={course} 
              modules={modules || []}
              selectedLessonId={selectedLessonId}
              onLessonSelect={setSelectedLessonId}
            />
            <div className="flex-1">
              <ContentViewer lessonId={selectedLessonId} />
            </div>
          </div>
        </CourseAccessControl>
      ) : (
        <div className="container mx-auto py-8 px-4">
          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="blue">{course.subject}</Badge>
                  <Badge variant="outline">{course.difficulty_level}</Badge>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>
                
                <p className="text-lg text-gray-600 mb-6">
                  {course.description}
                </p>
                
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>1,200+ students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-400" />
                    <span>4.8 rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Self-paced</span>
                  </div>
                </div>

                {hasPurchased ? (
                  <Button onClick={handleStartLearning} size="lg" className="bg-primary hover:bg-primary/90">
                    <Play className="h-5 w-5 mr-2" />
                    Continue Learning
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-primary">
                        {formatPrice(course.price || 899)}<span className="text-base font-normal text-gray-600">/month</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-medium">7-day free trial</span>
                      </div>
                    </div>
                    
                    <Button onClick={handleStartLearning} size="lg" className="bg-primary hover:bg-primary/90">
                      <Gift className="h-5 w-5 mr-2" />
                      Start Free Trial
                    </Button>
                    
                    <p className="text-sm text-gray-500">
                      Cancel anytime during your trial period. No charges until trial ends.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">What you'll learn</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Master core concepts and fundamentals</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Apply knowledge through practical exercises</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Track progress with assessments</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Earn completion certificates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Content
              </CardTitle>
              <CardDescription>
                {modules?.length || 0} modules • {modules?.reduce((acc, mod) => acc + mod.lessons.length, 0) || 0} lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modules && modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">
                          Module {index + 1}: {module.title}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {module.lessons.length} lessons
                        </span>
                      </div>
                      {module.description && (
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      )}
                      <div className="space-y-2">
                        {module.lessons.slice(0, 3).map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 text-sm">
                            {lesson.is_preview ? (
                              <Play className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={lesson.is_preview ? "text-green-700" : "text-gray-600"}>
                              {lesson.title}
                              {lesson.is_preview && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Preview</span>}
                            </span>
                          </div>
                        ))}
                        {module.lessons.length > 3 && (
                          <p className="text-sm text-gray-500 ml-7">
                            +{module.lessons.length - 3} more lessons
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Course content is being prepared.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      <CoursePaymentModal
        course={course}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          toast({
            title: "Payment Successful!",
            description: "Redirecting to checkout to complete your subscription...",
          });
        }}
      />
    </div>
  );
};

export default CourseDetail;
