import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import ContentViewer from '@/components/learningHub/ContentViewer';
import ProgressBar from '@/components/learningHub/ProgressBar';
import { CourseLesson, CourseModule } from '@/types/course';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, ShoppingCart, Edit, Menu, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import { toast } from '@/hooks/use-toast';
import NotesSection from '@/components/learningHub/NotesSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const CourseDetail: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole, isOwner, isAdmin } = useAuth();
  
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contentType, setContentType] = useState<string>('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Debug info
  console.log('🔍 CourseDetail Debug Info:');
  console.log('- URL courseId param:', courseId);
  console.log('- courseId type:', typeof courseId);
  console.log('- courseId length:', courseId?.length);
  console.log('- User:', user?.email);
  console.log('- User Role:', userRole);
  console.log('- Is Owner:', isOwner);
  console.log('- Is Admin:', isAdmin);

  const isTutor = userRole === 'tutor';
  const hasAdminPrivileges = isOwner || isAdmin || isTutor;

  console.log('- Is Tutor:', isTutor);
  console.log('- Has Admin Privileges:', hasAdminPrivileges);

  // Fetch course data with enhanced debugging
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      console.log('🔄 Fetching course with ID:', courseId);
      if (!courseId) {
        console.error('❌ No courseId provided to query');
        throw new Error('No course ID provided');
      }
      try {
        const result = await learningHubService.getCourseById(courseId);
        console.log('✅ Course fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Error fetching course:', error);
        throw error;
      }
    },
    enabled: !!courseId,
  });

  // Log course fetch results
  console.log('📚 Course fetch state:');
  console.log('- Course loading:', courseLoading);
  console.log('- Course error:', courseError);
  console.log('- Course data:', course);

  // Fetch modules and lessons
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => learningHubService.getCourseModules(courseId!),
    enabled: !!courseId,
  });

  console.log('📚 Modules loaded:', modules.length);
  modules.forEach((module, index) => {
    console.log(`- Module ${index + 1}: ${module.title} (${module.lessons?.length || 0} lessons)`);
    module.lessons?.forEach((lesson, lessonIndex) => {
      console.log(`  - Lesson ${lessonIndex + 1}: ${lesson.title} (preview: ${lesson.is_preview})`);
    });
  });

  // Check if user has purchased the course
  const { data: isPurchased = false } = useQuery({
    queryKey: ['course-purchase', courseId, user?.id],
    queryFn: async () => {
      if (!user?.id || !courseId) return false;
      return learningHubService.checkCoursePurchase(courseId);
    },
    enabled: !!user?.id && !!courseId,
  });

  console.log('💰 Course purchased:', isPurchased);

  // Fetch student progress if authenticated
  const { data: studentProgress = [] } = useQuery({
    queryKey: ['student-progress', user?.email, courseId],
    queryFn: () => learningHubService.getStudentProgress(user!.email!, courseId),
    enabled: !!user?.email && !!courseId,
  });

  console.log('📈 Student progress entries:', studentProgress.length);

  const canAccessFullCourse = hasAdminPrivileges || isPurchased;

  console.log('🔓 Can access full course:', canAccessFullCourse);

  // Find active module and lesson
  const activeModule = useMemo(() => {
    const found = modules.find(m => m.id === activeModuleId);
    console.log('🎯 Active module found:', found?.title || 'None');
    return found;
  }, [modules, activeModuleId]);

  const activeLesson = useMemo(() => {
    if (!activeModule || !activeLessonId) {
      console.log('❌ No active lesson: module or lesson ID missing');
      console.log('- Active module ID:', activeModuleId);
      console.log('- Active lesson ID:', activeLessonId);
      return null;
    }
    
    const found = activeModule.lessons?.find(l => l.id === activeLessonId);
    console.log('🎯 Active lesson found:', found?.title || 'None');
    return found || null;
  }, [activeModule, activeLessonId]);

  // Initialize first accessible lesson
  useEffect(() => {
    if (modules.length > 0 && !activeModuleId) {
      console.log('🚀 Initializing first accessible lesson...');
      console.log('- Has admin privileges at initialization:', hasAdminPrivileges);
      console.log('- Is purchased at initialization:', isPurchased);
      
      for (const module of modules) {
        console.log(`🔍 Checking module: ${module.title}`);
        
        if (module.lessons && module.lessons.length > 0) {
          for (const lesson of module.lessons) {
            const isAccessible = hasAdminPrivileges || isPurchased || lesson.is_preview;
            console.log(`  - Lesson: ${lesson.title}`);
            console.log(`    - Is preview: ${lesson.is_preview}`);
            console.log(`    - Has admin privileges: ${hasAdminPrivileges}`);
            console.log(`    - Is purchased: ${isPurchased}`);
            console.log(`    - Is accessible: ${isAccessible}`);
            
            if (isAccessible) {
              console.log(`✅ Setting active lesson: ${lesson.title} in module: ${module.title}`);
              setActiveModuleId(module.id);
              setActiveLessonId(lesson.id);
              return;
            }
          }
        }
      }
      
      console.log('❌ No accessible lessons found!');
    }
  }, [modules, activeModuleId, hasAdminPrivileges, isPurchased]);

  // Handle lesson selection
  const handleSelectLesson = (lesson: CourseLesson) => {
    console.log('🎯 Selecting lesson:', lesson.title);
    
    const module = modules.find(m => m.lessons?.some(l => l.id === lesson.id));
    if (module) {
      console.log('📁 Found module for lesson:', module.title);
      setActiveModuleId(module.id);
      setActiveLessonId(lesson.id);
      setShowMobileSidebar(false);
    } else {
      console.error('❌ Could not find module for lesson:', lesson.title);
    }
  };

  // Calculate course progress
  const courseProgress = useMemo(() => {
    const totalLessons = modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);
    const completedLessons = studentProgress.filter(progress => progress.status === 'completed').length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [modules, studentProgress]);

  const handlePurchaseSuccess = () => {
    setShowPaymentModal(false);
    toast({
      title: "Purchase successful!",
      description: "You now have full access to this course.",
    });
    window.location.reload();
  };

  // Find current lesson index and next/prev lessons
  const currentLessonIndex = useMemo(() => {
    if (!activeLesson) return { moduleIndex: -1, lessonIndex: -1 };
    
    let flatLessons: CourseLesson[] = [];
    modules.forEach(module => {
      if (module.lessons) {
        flatLessons = [...flatLessons, ...module.lessons];
      }
    });
    
    return {
      lessonIndex: flatLessons.findIndex(l => l.id === activeLesson.id),
      totalLessons: flatLessons.length
    };
  }, [activeLesson, modules]);

  // Navigate to next/previous lesson
  const navigateToLesson = (direction: 'next' | 'prev') => {
    let flatLessons: CourseLesson[] = [];
    
    modules.forEach(module => {
      if (module.lessons) {
        flatLessons = [...flatLessons, ...module.lessons];
      }
    });
    
    const { lessonIndex } = currentLessonIndex;
    if (lessonIndex === -1) return;
    
    let newIndex = direction === 'next' ? lessonIndex + 1 : lessonIndex - 1;
    
    // Loop back to beginning if at end
    if (newIndex >= flatLessons.length) {
      newIndex = 0;
    } else if (newIndex < 0) {
      newIndex = flatLessons.length - 1;
    }
    
    const newLesson = flatLessons[newIndex];
    
    if (newLesson) {
      const isAccessible = hasAdminPrivileges || isPurchased || newLesson.is_preview;
      
      if (isAccessible) {
        handleSelectLesson(newLesson);
      } else {
        toast({
          title: "Lesson Locked",
          description: "Purchase the course to access this lesson.",
          variant: "destructive"
        });
      }
    }
  };

  // Enhanced error handling and loading states with mobile-friendly design
  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-7xl">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (courseError) {
    console.error('💥 Course error details:', courseError);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-7xl text-center">
          <Card className="max-w-lg mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Error loading course</h1>
              <p className="text-gray-600 mb-4">
                {courseError instanceof Error ? courseError.message : 'An unknown error occurred'}
              </p>
              <p className="text-sm text-gray-500 mb-6">Course ID: {courseId}</p>
              <Button onClick={() => navigate('/learning-hub')} variant="outline" className="hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Learning Hub
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!course) {
    console.error('❌ No course data received');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="mx-auto py-4 sm:py-8 px-4 sm:px-6 max-w-7xl text-center">
          <Card className="max-w-lg mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Course not found</h1>
              <p className="text-gray-600 mb-4">
                The course you're looking for doesn't exist or has been removed.
              </p>
              <p className="text-sm text-gray-500 mb-6">Course ID: {courseId}</p>
              <Button onClick={() => navigate('/learning-hub')} variant="outline" className="hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Learning Hub
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
      {/* Mobile-optimized Course Header - Full width on mobile */}
      <div className="bg-gradient-to-r from-white/85 via-slate-50/80 to-rose-50/75 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="mx-auto py-2 sm:py-4 px-4 sm:px-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Back button and title area */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:flex-1 min-w-0">
              <Button 
                onClick={() => navigate('/learning-hub')} 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-800 hover:bg-white/50 transition-all duration-200 flex-shrink-0 p-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              
              {hasAdminPrivileges && (
                <Button 
                  onClick={() => navigate(`/course/${courseId}/edit`)} 
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-white/50 hover:border-gray-300 transition-all duration-200 flex-shrink-0 p-2 sm:px-3"
                >
                  <Edit className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              
              {/* Mobile: Course navigation button */}
              <div className="block lg:hidden">
                <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-white/50 hover:border-gray-300 transition-all duration-200 flex-shrink-0 p-2"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:w-96 p-0">
                    <div className="h-full">
                      <CourseSidebar
                        modules={modules}
                        studentProgress={studentProgress}
                        onSelectLesson={handleSelectLesson}
                        currentLessonId={activeLessonId || undefined}
                        isAdmin={hasAdminPrivileges}
                        isPurchased={canAccessFullCourse}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate text-center sm:text-left">
                    {course.title}
                  </h1>
                  
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    {course.subject && (
                      <Badge variant="outline" className="text-xs border-gray-300 bg-white/50">
                        {course.subject}
                      </Badge>
                    )}
                    {course.difficulty_level && (
                      <Badge variant="outline" className="text-xs border-gray-300 bg-white/50">
                        {course.difficulty_level}
                      </Badge>
                    )}
                    <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                      {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Purchase button/info area */}
            {!canAccessFullCourse && (
              <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/50 mt-2 sm:mt-0">
                <div className="text-center sm:text-right">
                  <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    £{((course.price || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Progress Bar - Full width on mobile */}
      {user && (
        <div className="bg-white/60 backdrop-blur-sm shadow-sm border-b border-gray-100">
          <div className="mx-auto px-4 sm:px-6 py-2 max-w-7xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 max-w-xs sm:max-w-md">
                <ProgressBar progress={courseProgress} />
              </div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                {courseProgress}% complete
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Full width on mobile */}
      <div className="mx-auto py-4 sm:py-6 px-0 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Desktop Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl overflow-hidden shadow-lg sticky top-4">
              <CourseSidebar
                modules={modules}
                studentProgress={studentProgress}
                onSelectLesson={handleSelectLesson}
                currentLessonId={activeLessonId || undefined}
                isAdmin={hasAdminPrivileges}
                isPurchased={canAccessFullCourse}
              />
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="col-span-1 lg:col-span-4 space-y-4 sm:space-y-6">
            {/* Lesson Navigation */}
            {activeLesson && (
              <div className="bg-white/90 backdrop-blur-sm rounded-none sm:rounded-xl border-0 sm:border border-gray-100 px-4 py-4 sm:p-6 shadow-lg">
                {/* Lesson Title and Course Navigation */}
                <div className="flex flex-col gap-4 mb-4">
                  {/* Title Row with Mobile Navigation Button */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                          {activeModule?.title && (
                            <span className="text-gray-500 text-sm block sm:inline sm:mr-2">
                              {activeModule.title} <span className="hidden sm:inline">—</span>
                            </span>
                          )}
                          <span className="block sm:inline">{activeLesson.title}</span>
                        </h2>
                      </div>
                      
                      {/* Mobile: Course navigation button next to title */}
                      <div className="block lg:hidden flex-shrink-0">
                        <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-white/50 hover:border-gray-300 transition-all duration-200 p-2"
                            >
                              <Menu className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-full sm:w-96 p-0">
                            <div className="h-full">
                              <CourseSidebar
                                modules={modules}
                                studentProgress={studentProgress}
                                onSelectLesson={handleSelectLesson}
                                currentLessonId={activeLessonId || undefined}
                                isAdmin={hasAdminPrivileges}
                                isPurchased={canAccessFullCourse}
                              />
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      
                      {/* Desktop navigation controls */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="text-xs text-gray-500">
                          Lesson {currentLessonIndex.lessonIndex + 1} of {currentLessonIndex.totalLessons}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => navigateToLesson('prev')}
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous lesson</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => navigateToLesson('next')}
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next lesson</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile Navigation Row */}
                    <div className="flex sm:hidden items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Lesson {currentLessonIndex.lessonIndex + 1} of {currentLessonIndex.totalLessons}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigateToLesson('prev')}
                          className="h-8 px-3 text-xs"
                        >
                          <ChevronLeft className="h-3 w-3 mr-1" />
                          Prev
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigateToLesson('next')}
                          className="h-8 px-3 text-xs"
                        >
                          Next
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Lock indicator for non-preview lessons */}
                {!canAccessFullCourse && !activeLesson.is_preview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-amber-700 text-sm flex items-center gap-2 text-center sm:text-left">
                    <Lock className="h-4 w-4 mx-auto sm:mx-0" />
                    <p className="text-center sm:text-left">This is a preview of a premium lesson. Purchase the course to unlock full access.</p>
                  </div>
                )}
                
                {/* Content Viewer */}
                <div>
                  <ContentViewer
                    lesson={activeLesson}
                    onContentTypeChange={setContentType}
                  />
                </div>
                
                {/* Notes Section */}
                {user && (
                  <div className="pt-6">
                    <NotesSection
                      courseId={courseId!}
                      lessonId={activeLesson.id}
                    />
                  </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 sm:mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => navigateToLesson('prev')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button 
                    onClick={() => navigateToLesson('next')}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* No lesson selected fallback */}
            {!activeLesson && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-8 sm:p-12 shadow-lg text-center mx-4 sm:mx-0">
                <BookOpen className="mx-auto h-12 sm:h-16 w-12 sm:w-16 text-gray-300 mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-center">Select a lesson to begin</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-center">
                  Choose a lesson from the sidebar to start learning.
                </p>
                
                {/* On mobile, show a button to open the course navigation */}
                <div className="block lg:hidden">
                  <Button 
                    onClick={() => setShowMobileSidebar(true)}
                    variant="outline" 
                    className="hover:bg-gray-50 border-gray-300"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    View Course Content
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Purchase Modal */}
      {showPaymentModal && course && (
        <CoursePaymentModal
          course={course}
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
      
      {/* Mobile: Floating button to access course navigation */}
      <div className="fixed bottom-6 right-6 block lg:hidden">
        {activeLesson && (
          <Button
            onClick={() => setShowMobileSidebar(true)}
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-primary"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
