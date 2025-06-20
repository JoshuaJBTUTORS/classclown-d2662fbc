import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import ContentViewer from '@/components/learningHub/ContentViewer';
import NotesSection from '@/components/learningHub/NotesSection';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Users, 
  CheckCircle,
  Lock,
  Gift,
  Crown,
  ArrowLeft,
  Menu
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const isMobile = useIsMobile();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    enabled: !!id && !isOwner,
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
    if (isOwner || hasPurchased) {
      if (modules && modules.length > 0 && modules[0].lessons && modules[0].lessons.length > 0) {
        const firstLesson = modules[0].lessons[0];
        setSelectedLessonId(firstLesson.id);
        setSelectedLesson(firstLesson);
      }
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleLessonSelect = (lesson: any) => {
    setSelectedLessonId(lesson.id);
    setSelectedLesson(lesson);
    // Close mobile sidebar when lesson is selected
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  const handleBackToCourse = () => {
    setSelectedLessonId(null);
    setSelectedLesson(null);
  };

  const handleBackToLearningHub = () => {
    navigate('/learning-hub');
  };

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = isOwner || hasPurchased;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Back Button - Always visible */}
      <div className="fixed top-4 left-4 z-30">
        <Button
          onClick={selectedLessonId ? handleBackToCourse : handleBackToLearningHub}
          variant="ghost"
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-pink-600 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {selectedLessonId ? 'Back to Course' : 'Back to Learning Hub'}
        </Button>
      </div>

      {/* Mobile Menu Button - Only visible on mobile when viewing lesson */}
      {isMobile && selectedLessonId && selectedLesson && (
        <div className="fixed top-4 right-4 z-30">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 hover:text-pink-600 shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <CourseSidebar
                modules={modules || []}
                onSelectLesson={handleLessonSelect}
                currentLessonId={selectedLessonId}
                isAdmin={isOwner}
                isPurchased={hasAccess}
              />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {selectedLessonId && selectedLesson ? (
        <CourseAccessControl courseId={course.id}>
          {/* Full Screen Layout with Course Sidebar */}
          <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 pt-16">
            <div className="flex h-full">
              {/* Desktop Sidebar - Hidden on mobile */}
              {!isMobile && (
                <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <CourseSidebar
                      modules={modules || []}
                      onSelectLesson={handleLessonSelect}
                      currentLessonId={selectedLessonId}
                      isAdmin={isOwner}
                      isPurchased={hasAccess}
                    />
                  </div>
                </div>
              )}

              {/* Main Content Area - Full width on mobile */}
              <div className="flex-1 overflow-y-auto">
                <div className={`h-full ${isMobile ? 'p-4' : 'p-6'}`}>
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Lesson Title - More compact on mobile */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-4 md:p-6">
                      <Badge variant="outline" className="mb-3 border-pink-200 text-pink-700 bg-pink-50">
                        {course.subject}
                      </Badge>
                      <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                        {selectedLesson.title}
                      </h1>
                      <p className="text-gray-600 leading-relaxed">
                        {selectedLesson.description || "Continue with this lesson to master the concepts."}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{selectedLesson.duration_minutes || 10} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{selectedLesson.content_type || 'video'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Video Content */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
                      <ContentViewer lesson={selectedLesson} />
                    </div>

                    {/* Flash Cards Section */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 overflow-hidden">
                      <NotesSection 
                        courseId={course.id}
                        lessonId={selectedLesson.id}
                        lessonTitle={selectedLesson.title}
                        contentType={selectedLesson.content_type}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CourseAccessControl>
      ) : (
        <div className="pt-16 px-4">
          <div className="container mx-auto py-8">
            {/* Course Header - Responsive layout */}
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-8 mb-8">
              <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="blue">{course.subject}</Badge>
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    {isOwner && (
                      <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin Access
                      </Badge>
                    )}
                  </div>
                  
                  <h1 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
                    {course.title}
                  </h1>
                  
                  <p className={`text-gray-600 mb-6 ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {course.description}
                  </p>
                  
                  <div className={`flex items-center gap-6 text-sm text-gray-500 mb-6 ${isMobile ? 'flex-wrap gap-4' : ''}`}>
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

                  {hasAccess ? (
                    <Button onClick={handleStartLearning} size="lg" className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                      <Play className="h-5 w-5 mr-2" />
                      {isOwner ? 'Access Course (Admin)' : 'Continue Learning'}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 ${isMobile ? 'flex-col items-start' : ''}`}>
                        <div className="text-3xl font-bold text-primary">
                          {formatPrice(course.price || 899)}<span className="text-base font-normal text-gray-600">/month</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <Gift className="h-4 w-4" />
                          <span className="text-sm font-medium">7-day free trial</span>
                        </div>
                      </div>
                      
                      <Button onClick={handleStartLearning} size="lg" className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                        <Gift className="h-5 w-5 mr-2" />
                        Start Free Trial
                      </Button>
                      
                      <p className="text-sm text-gray-500">
                        Cancel anytime during your trial period. No charges until trial ends.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Benefits section - Stack on mobile */}
                <div className="bg-gray-50 rounded-lg p-4 md:p-6">
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

            {/* Course Content Preview - Responsive */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
                <CardDescription>
                  {modules?.length || 0} modules • {modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0} lessons
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
                            {module.lessons?.length || 0} lessons
                          </span>
                        </div>
                        {module.description && (
                          <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        )}
                        <div className="space-y-2">
                          {module.lessons?.slice(0, 3).map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 text-sm">
                              {lesson.is_preview || isOwner ? (
                                <Play className="h-4 w-4 text-green-500" />
                              ) : (
                                <Lock className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={lesson.is_preview || isOwner ? "text-green-700" : "text-gray-600"}>
                                {lesson.title}
                                {(lesson.is_preview || isOwner) && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {isOwner ? 'Admin' : 'Preview'}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                          {(module.lessons?.length || 0) > 3 && (
                            <p className="text-sm text-gray-500 ml-7">
                              +{(module.lessons?.length || 0) - 3} more lessons
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
