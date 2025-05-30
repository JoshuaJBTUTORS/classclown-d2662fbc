
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
import { ArrowLeft, Lock, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CoursePaymentModal from '@/components/learningHub/CoursePaymentModal';
import { toast } from '@/hooks/use-toast';
import NotesSection from '@/components/learningHub/NotesSection';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, userRole, isOwner, isAdmin } = useAuth();
  
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contentType, setContentType] = useState<string>('');

  console.log('🔍 CourseDetail Debug Info:');
  console.log('- User:', user?.email);
  console.log('- User Role:', userRole);
  console.log('- Is Owner:', isOwner);
  console.log('- Is Admin:', isAdmin);
  console.log('- Course ID:', courseId);

  const isTutor = userRole === 'tutor';
  const hasAdminPrivileges = isOwner || isAdmin || isTutor;

  console.log('- Is Tutor:', isTutor);
  console.log('- Has Admin Privileges:', hasAdminPrivileges);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningHubService.getCourseById(courseId!),
    enabled: !!courseId,
  });

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
      return learningHubService.hasUserPurchasedCourse(user.id, courseId);
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
    // Refresh the purchase status
    window.location.reload();
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Course not found</h1>
        <Button onClick={() => navigate('/learning-hub')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Learning Hub
        </Button>
      </div>
    );
  }

  console.log('🎬 Final render state:');
  console.log('- Active lesson:', activeLesson?.title || 'None');
  console.log('- Can access full course:', canAccessFullCourse);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={() => navigate('/learning-hub')} 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning Hub
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-gray-600 text-lg">{course.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {course.subject && (
                  <Badge variant="outline" className="text-sm">
                    {course.subject}
                  </Badge>
                )}
                {course.difficulty_level && (
                  <Badge variant="outline" className="text-sm">
                    {course.difficulty_level}
                  </Badge>
                )}
                <span className="text-sm text-gray-500">
                  {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
                </span>
              </div>
            </div>
            
            {!canAccessFullCourse && (
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    £{((course.price || 0) / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">One-time payment</p>
                </div>
                <Button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Course
                </Button>
              </div>
            )}
          </div>
          
          {canAccessFullCourse && (
            <div className="mt-4">
              <ProgressBar progress={courseProgress} />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CourseSidebar
              modules={modules}
              studentProgress={studentProgress}
              onSelectLesson={handleSelectLesson}
              currentLessonId={activeLessonId || undefined}
              isAdmin={hasAdminPrivileges}
              isPurchased={canAccessFullCourse}
            />
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeLesson ? (
              <>
                {/* Lesson Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activeLesson.title}
                      </h2>
                      {activeLesson.description && (
                        <p className="text-gray-600">{activeLesson.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {activeLesson.is_preview && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Preview
                        </Badge>
                      )}
                      {activeLesson.duration_minutes && (
                        <Badge variant="outline" className="text-sm">
                          {activeLesson.duration_minutes} min
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Viewer */}
                <ContentViewer 
                  lesson={activeLesson} 
                  onContentTypeChange={setContentType}
                />

                {/* Notes Section - only show for video content */}
                {contentType === 'video' && user && (
                  <NotesSection 
                    courseId={courseId!}
                    lessonId={activeLesson.id}
                  />
                )}
              </>
            ) : (
              <Card className="h-96">
                <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                  {!canAccessFullCourse ? (
                    <>
                      <Lock className="h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Course Locked
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md">
                        Purchase this course to access all lessons and unlock your learning potential.
                      </p>
                      <Button 
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase Course
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ArrowLeft className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        No lesson selected
                      </h3>
                      <p className="text-gray-500">
                        Select a lesson from the course content to start learning
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && course && (
        <CoursePaymentModal
          course={course}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default CourseDetail;
