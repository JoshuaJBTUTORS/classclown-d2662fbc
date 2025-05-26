
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PenSquare, BookOpen, ShoppingCart } from 'lucide-react';
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
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import NotesSection from '@/components/learningHub/NotesSection';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import { useToast } from '@/hooks/use-toast';

const CourseDetail: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, isOwner, isTutor, user } = useAuth();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check for payment success/failure in URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({
        title: "Payment successful!",
        description: "You now have full access to this course.",
      });
      // Verify the payment and update purchase status
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        paymentService.verifyCoursePayment(sessionId).catch(console.error);
      }
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

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
    const checkPurchaseStatus = async () => {
      if (user && courseId && course?.status === 'published') {
        try {
          const purchased = await paymentService.checkCoursePurchase(courseId);
          setIsPurchased(purchased);
        } catch (error) {
          console.error('Error checking purchase status:', error);
        }
      }
    };

    checkPurchaseStatus();
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

  const handlePurchaseCourse = () => {
    setShowPaymentModal(true);
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto">
            <div className="container py-8">
              <div className="flex items-center mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(-1)} 
                  className="mr-2"
                >
                  <ChevronLeft className="mr-1" />
                  Back
                </Button>
              </div>
              
              <div className="flex flex-col gap-4 mb-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                <div className="lg:col-span-2">
                  <Skeleton className="h-[600px] w-full" />
                </div>
                <div className="lg:col-span-5">
                  <Skeleton className="h-[600px] w-full" />
                </div>
                <div className="lg:col-span-3">
                  <Skeleton className="h-[600px] w-full" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (courseError || modulesError || !course) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-y-auto">
            <div className="container py-8">
              <div className="flex items-center mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(-1)} 
                  className="mr-2"
                >
                  <ChevronLeft className="mr-1" />
                  Back
                </Button>
              </div>
              
              <div className="p-6 text-center">
                <p className="text-red-500">Error loading course. Please try again later.</p>
                <Button onClick={() => navigate('/learning-hub')} className="mt-4">
                  Return to Learning Hub
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const canAccessFullCourse = hasAdminPrivileges || isPurchased;
  const showPurchaseButton = course.status === 'published' && !canAccessFullCourse && user;

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6">
            {/* Header with navigation and actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/learning-hub')} 
                  className="mr-2"
                >
                  <ChevronLeft className="mr-1" />
                  Back to Courses
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {showPurchaseButton && (
                  <Button 
                    onClick={handlePurchaseCourse}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Course - {formatPrice(course.price || 899)}
                  </Button>
                )}
                
                {hasAdminPrivileges && (
                  <Button 
                    onClick={() => navigate(`/course/${courseId}/edit`)}
                    variant="outline"
                  >
                    <PenSquare className="mr-2 h-4 w-4" />
                    Edit Course
                  </Button>
                )}
              </div>
            </div>
            
            {/* Course header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">{course.subject || "General"}</Badge>
                <Badge variant="outline" className="text-gray-500">{course.status}</Badge>
                {isPurchased && (
                  <Badge className="bg-green-500 text-white">Purchased</Badge>
                )}
                {!canAccessFullCourse && course.status === 'published' && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Preview Mode - {formatPrice(course.price || 899)} to unlock
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description}</p>
              
              {/* Progress bar */}
              {user && !progressLoading && (
                <ProgressBar 
                  current={completedLessons}
                  total={totalLessons}
                  label="Course Progress"
                  className="w-full"
                />
              )}
            </div>
            
            <Separator className="my-4" />
            
            {/* Course content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Sidebar with modules and lessons */}
              <div className="lg:col-span-2">
                <CourseSidebar 
                  modules={modules || []}
                  studentProgress={studentProgress || []}
                  onSelectLesson={handleLessonSelect}
                  currentLessonId={activeLessonId || undefined}
                  isAdmin={hasAdminPrivileges}
                  isPurchased={canAccessFullCourse}
                />
              </div>
              
              {/* Content viewer */}
              <div className="lg:col-span-5">
                {activeLesson ? (
                  <ContentViewer 
                    lesson={activeLesson} 
                    isLoading={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 border rounded-lg">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No lesson selected</h3>
                    <p className="text-gray-500 text-center">
                      {modules && modules.length > 0 
                        ? "Select a lesson from the sidebar to start learning"
                        : "No content available for this course"}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes section */}
              <div className="lg:col-span-3">
                <NotesSection 
                  courseId={courseId!}
                  lessonId={activeLessonId || undefined}
                  lessonTitle={activeLesson?.title}
                />
              </div>
            </div>
          </div>
        </main>
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
