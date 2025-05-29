
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PenSquare, BookOpen, Gift, RefreshCw, CheckCircle, Clock, Play, Home, SidebarClose, SidebarOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { learningHubService } from '@/services/learningHubService';
import { paymentService } from '@/services/paymentService';
import { Course, CourseModule } from '@/types/course';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import ContentViewer from '@/components/learningHub/ContentViewer';
import ProgressBar from '@/components/learningHub/ProgressBar';
import NotesSection from '@/components/learningHub/NotesSection';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import { useToast } from '@/hooks/use-toast';

const CourseDetail: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isOwner, isTutor, user } = useAuth();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  // Function to refresh purchase status
  const refreshPurchaseStatus = async () => {
    console.log("Refreshing purchase status for course:", courseId);
    if (user && courseId && course?.status === 'published') {
      try {
        const purchased = await paymentService.checkCoursePurchase(courseId);
        console.log("Purchase status refreshed:", purchased);
        setIsPurchased(purchased);
        return purchased;
      } catch (error) {
        console.error('Error checking purchase status:', error);
        return false;
      }
    }
    return false;
  };

  // Manual refresh button handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const purchased = await refreshPurchaseStatus();
      if (purchased) {
        toast({
          title: "Course access verified!",
          description: "You now have access to this course.",
        });
      } else {
        toast({
          title: "No active subscription found",
          description: "If you just completed payment, please try again in a few moments.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error refreshing status",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check for payment success/failure in URL params and verify payment
  useEffect(() => {
    const handlePaymentVerification = async () => {
      const paymentStatus = searchParams.get('payment');
      const sessionId = searchParams.get('session_id');
      
      console.log("Payment verification check:", { paymentStatus, sessionId, isVerifyingPayment });
      
      if (paymentStatus === 'success' && sessionId && !isVerifyingPayment) {
        setIsVerifyingPayment(true);
        console.log("Starting payment verification with session ID:", sessionId);
        
        try {
          console.log('Calling verify-course-payment with session ID:', sessionId);
          const verificationResult = await paymentService.verifyCoursePayment(sessionId);
          console.log('Payment verification result:', verificationResult);
          
          if (verificationResult.success) {
            toast({
              title: "Subscription started!",
              description: "Your 7-day free trial has begun. You now have full access to this course.",
            });
            
            // Refresh purchase status to grant immediate access
            console.log('Refreshing purchase status after successful verification');
            const purchased = await refreshPurchaseStatus();
            console.log('Purchase status after verification:', purchased);
            
            if (purchased) {
              console.log('Purchase status updated successfully');
            } else {
              console.warn('Purchase status not updated despite successful verification');
              // Add a small delay and try again
              setTimeout(async () => {
                const retryPurchased = await refreshPurchaseStatus();
                console.log('Retry purchase status:', retryPurchased);
              }, 2000);
            }
          } else {
            console.error('Payment verification failed:', verificationResult);
            toast({
              title: "Payment verification failed",
              description: verificationResult.message || "There was an issue verifying your payment. Please contact support.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Payment verification error",
            description: "There was an error verifying your payment. Please contact support if the issue persists.",
            variant: "destructive",
          });
        } finally {
          setIsVerifyingPayment(false);
          // Clean up URL parameters
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('payment');
          newSearchParams.delete('session_id');
          setSearchParams(newSearchParams, { replace: true });
        }
      } else if (paymentStatus === 'cancelled') {
        console.log("Payment was cancelled");
        toast({
          title: "Subscription cancelled",
          description: "Your subscription was cancelled. You can try again anytime.",
          variant: "destructive",
        });
        // Clean up URL parameters
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('payment');
        setSearchParams(newSearchParams, { replace: true });
      }
    };

    handlePaymentVerification();
  }, [searchParams, toast, isVerifyingPayment]);

  // Fetch course details
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Fetch course modules and lessons
  const { data: modules, isLoading: modulesLoading, error: modulesError } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => learningHubService.getCourseModules(courseId!),
    enabled: !!courseId,
  });

  // Check purchase status
  useEffect(() => {
    refreshPurchaseStatus();
  }, [courseId, user, course?.status]);

  // Fetch student progress with corrected query key
  const { data: studentProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['student-progress', user?.email, courseId],
    queryFn: () => learningHubService.getStudentProgress(user!.email, courseId!),
    enabled: !!user?.email && !!courseId,
  });

  // Fetch course completion percentage using user email
  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', courseId, user?.email],
    queryFn: () => learningHubService.getCourseProgress(courseId!, user!.email),
    enabled: !!user?.email && !!courseId,
  });

  // Set initial active module and lesson when data loads
  React.useEffect(() => {
    if (modules && modules.length > 0 && !activeModuleId) {
      setActiveModuleId(modules[0].id);
      
      if (modules[0].lessons && modules[0].lessons.length > 0) {
        // Find the first accessible lesson (preview or purchased)
        const firstAccessibleLesson = modules[0].lessons.find(lesson => 
          lesson.is_preview || isPurchased || hasAdminPrivileges
        );
        if (firstAccessibleLesson) {
          setActiveLessonId(firstAccessibleLesson.id);
        }
      }
    }
  }, [modules, activeModuleId, isPurchased, hasAdminPrivileges]);

  // Handle lesson selection
  const handleLessonSelect = (lesson: any) => {
    setActiveLessonId(lesson.id);
  };

  // Find active content
  const activeModule = modules?.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons?.find(l => l.id === activeLessonId);

  // Count total lessons
  const totalLessons = modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const completedLessons = studentProgress?.filter(p => p.status === 'completed').length || 0;

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const handleStartTrial = () => {
    setShowPaymentModal(true);
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="mr-2"
            >
              <Home className="mr-1 h-4 w-4" />
              Home
            </Button>
          </div>
          
          <div className="flex flex-col gap-4 mb-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div className="col-span-9">
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (courseError || modulesError || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')} 
              className="mr-2"
            >
              <Home className="mr-1 h-4 w-4" />
              Home
            </Button>
          </div>
          
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-red-300 mb-6" />
            <h3 className="text-xl font-semibold text-red-800 mb-3">Error loading course</h3>
            <p className="text-red-600 mb-6">Please try again later or contact support if the issue persists.</p>
            <Button onClick={() => navigate('/learning-hub')} className="bg-rose-600 hover:bg-rose-700">
              Return to Learning Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canAccessFullCourse = hasAdminPrivileges || isPurchased;
  const showTrialButton = course?.status === 'published' && !canAccessFullCourse && user && !isVerifyingPayment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Compact Header */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')} 
                className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
              >
                <Home className="mr-1 h-4 w-4" />
                Home
              </Button>
              <div className="h-4 w-px bg-gray-300" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/learning-hub')} 
                className="text-gray-600 hover:text-gray-900 hover:bg-white/60"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                All Courses
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {isVerifyingPayment && (
                <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50/80 backdrop-blur-sm text-xs">
                  Verifying payment...
                </Badge>
              )}
              
              {!canAccessFullCourse && (
                <Button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/60 backdrop-blur-sm hover:bg-white/80 text-xs"
                >
                  <RefreshCw className={`mr-1 h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Checking...' : 'Refresh Access'}
                </Button>
              )}
              
              {showTrialButton && (
                <Button 
                  onClick={handleStartTrial}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-rose-600 hover:from-emerald-700 hover:to-rose-700 text-white px-4 shadow-lg text-xs"
                >
                  <Gift className="mr-1 h-3 w-3" />
                  Start Free Trial - {formatPrice(course.price || 899)}/month
                </Button>
              )}
              
              {hasAdminPrivileges && (
                <Button 
                  onClick={() => navigate(`/course/${courseId}/edit`)}
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/60 backdrop-blur-sm hover:bg-white/80 text-xs"
                >
                  <PenSquare className="mr-1 h-3 w-3" />
                  Edit Course
                </Button>
              )}
            </div>
          </div>
          
          {/* Compact Course header */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-rose-100/80 text-rose-700 border-rose-200/50 backdrop-blur-sm text-xs">{course?.subject || "General"}</Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${course?.status === 'published' ? 'text-green-700 border-green-200/50 bg-green-50/80 backdrop-blur-sm' : 'text-gray-600 border-gray-200/50 bg-gray-50/80 backdrop-blur-sm'}`}
              >
                {course?.status}
              </Badge>
              {isPurchased && (
                <Badge className="bg-green-500/90 text-white backdrop-blur-sm text-xs">
                  <CheckCircle className="mr-1 h-2 w-2" />
                  Subscribed
                </Badge>
              )}
              {!canAccessFullCourse && course?.status === 'published' && (
                <Badge variant="outline" className="text-orange-600 border-orange-300/50 bg-orange-50/80 backdrop-blur-sm text-xs">
                  <Play className="mr-1 h-2 w-2" />
                  Preview Mode
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">{course?.title}</h1>
            <p className="text-gray-600 text-sm mb-4 max-w-4xl leading-relaxed">{course?.description}</p>
            
            {/* Compact progress bar */}
            {user && !progressLoading && totalLessons > 0 && (
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Course Progress</span>
                  <span className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">{completedLessons}/{totalLessons} lessons completed</span>
                </div>
                <ProgressBar 
                  current={completedLessons}
                  total={totalLessons}
                  className="w-full h-2"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {Math.round((completedLessons / totalLessons) * 100)}% complete
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Course content layout */}
        <div className="flex gap-4">
          {/* Enhanced sidebar with toggle */}
          {!sidebarCollapsed && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">Course Content</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <SidebarClose className="h-4 w-4" />
                  </Button>
                </div>
                <CourseSidebar 
                  modules={modules || []}
                  studentProgress={studentProgress || []}
                  onSelectLesson={handleLessonSelect}
                  currentLessonId={activeLessonId || undefined}
                  isAdmin={hasAdminPrivileges}
                  isPurchased={canAccessFullCourse}
                />
              </div>
            </div>
          )}
          
          {/* Sidebar toggle button when collapsed */}
          {sidebarCollapsed && (
            <div className="flex-shrink-0">
              <div className="sticky top-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90"
                >
                  <SidebarOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Enhanced content viewer - Now takes full width */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4">
              {/* Main content area */}
              {activeLesson ? (
                <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-rose-50/80">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">{activeLesson.title}</h2>
                        {activeLesson.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">{activeLesson.description}</p>
                        )}
                      </div>
                      {activeLesson.duration_minutes && (
                        <div className="flex items-center gap-2 text-gray-500 bg-white/60 px-2 py-1 rounded-md backdrop-blur-sm">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs font-medium">{activeLesson.duration_minutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ContentViewer 
                    lesson={activeLesson} 
                    isLoading={false}
                  />
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center shadow-lg">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-3">No lesson selected</h3>
                  <p className="text-gray-600 max-w-md mx-auto text-sm leading-relaxed">
                    {modules && modules.length > 0 
                      ? "Select a lesson from the course content to start learning"
                      : "No content available for this course yet"}
                  </p>
                </div>
              )}
              
              {/* Flash cards section below the content */}
              <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg overflow-hidden">
                <NotesSection 
                  courseId={courseId!}
                  lessonId={activeLessonId || undefined}
                  lessonTitle={activeLesson?.title}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {course && (
        <CoursePaymentModal
          course={course}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default CourseDetail;
