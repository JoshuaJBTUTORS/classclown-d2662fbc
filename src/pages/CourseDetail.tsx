import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CourseAccessControl from '@/components/learningHub/CourseAccessControl';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import ContentViewer from '@/components/learningHub/ContentViewer';
import NotesSection from '@/components/learningHub/NotesSection';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
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
  Gift,
  Crown,
  ArrowLeft
} from 'lucide-react';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isOwner } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

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

  // Hide main sidebar when lesson is selected
  useEffect(() => {
    const mainSidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (mainSidebar) {
      if (selectedLessonId) {
        (mainSidebar as HTMLElement).style.display = 'none';
      } else {
        (mainSidebar as HTMLElement).style.display = '';
      }
    }

    // Cleanup on unmount
    return () => {
      const mainSidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (mainSidebar) {
        (mainSidebar as HTMLElement).style.display = '';
      }
    };
  }, [selectedLessonId]);

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
  };

  const handleBackToCourse = () => {
    setSelectedLessonId(null);
    setSelectedLesson(null);
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
      {selectedLessonId && selectedLesson ? (
        <CourseAccessControl courseId={course.id}>
          {/* Full Screen Layout - No Sidebar Padding */}
          <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 z-50">
            <div className="flex h-full">
              {/* Course Sidebar - Fixed Width */}
              <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
                {/* Header with Back Button */}
                <div className="p-4 border-b border-gray-200">
                  <Button
                    onClick={handleBackToCourse}
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-pink-600 hover:bg-pink-50"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Course
                  </Button>
                </div>
                
                {/* Sidebar Content */}
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

              {/* Main Content Area - Full Remaining Width */}
              <div className="flex-1 overflow-y-auto">
                <div className="h-full p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Left Column - Course Content Details */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50 p-6">
                      <div className="mb-6">
                        <Badge variant="outline" className="mb-3 border-pink-200 text-pink-700 bg-pink-50">
                          {course.subject}
                        </Badge>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedLesson.title}
                        </h1>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {selectedLesson.description || "Continue with this lesson to master the concepts."}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{selectedLesson.duration_minutes || 10} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{selectedLesson.content_type || 'video'}</span>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">Understand core concepts</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">Apply knowledge practically</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-pink-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">Complete exercises</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Video and Flash Cards */}
                    <div className="space-y-6">
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
                  {isOwner && (
                    <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin Access
                    </Badge>
                  )}
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

                {hasAccess ? (
                  <Button onClick={handleStartLearning} size="lg" className="bg-primary hover:bg-primary/90">
                    <Play className="h-5 w-5 mr-2" />
                    {isOwner ? 'Access Course (Admin)' : 'Continue Learning'}
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
