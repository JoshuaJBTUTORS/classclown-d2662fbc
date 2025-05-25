
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PenSquare, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { learningHubService } from '@/services/learningHubService';
import { Course, CourseModule } from '@/types/course';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import ContentViewer from '@/components/learningHub/ContentViewer';
import ProgressBar from '@/components/learningHub/ProgressBar';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import NotesSection from '@/components/learningHub/NotesSection';

const CourseDetail: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isOwner, isTutor, user } = useAuth();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        setActiveLessonId(modules[0].lessons[0].id);
      }
    }
  }, [modules, activeModuleId]);

  // Handle lesson selection
  const handleLessonSelect = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  // Find active content
  const activeModule = modules?.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons?.find(l => l.id === activeLessonId);

  // Count total lessons
  const totalLessons = modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const completedLessons = studentProgress?.filter(p => p.status === 'completed').length || 0;

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-2">
                  <Skeleton className="h-[600px] w-full" />
                </div>
                <div className="lg:col-span-6">
                  <Skeleton className="h-[600px] w-full" />
                </div>
                <div className="lg:col-span-4">
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
        <div className="flex-1 flex flex-col overflow-hidden">
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

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-4 px-3">
            {/* Header with navigation and actions */}
            <div className="flex items-center justify-between mb-4">
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
            
            {/* Course header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">{course.subject || "General"}</Badge>
                <Badge variant="outline" className="text-gray-500">{course.status}</Badge>
              </div>
              <h1 className="text-xl font-bold mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-3 text-sm">{course.description}</p>
              
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
            
            <Separator className="my-3" />
            
            {/* Optimized course content layout with better spacing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Compact sidebar with modules and lessons - reduced space */}
              <div className="lg:col-span-2">
                <CourseSidebar 
                  modules={modules || []}
                  studentProgress={studentProgress || []}
                  onSelectLesson={lesson => setActiveLessonId(lesson.id)}
                  currentLessonId={activeLessonId || undefined}
                />
              </div>
              
              {/* Expanded content viewer - increased space */}
              <div className="lg:col-span-6">
                {activeLesson ? (
                  <ContentViewer 
                    lesson={activeLesson} 
                    isLoading={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px] bg-gray-50 border rounded-lg">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No lesson selected</h3>
                    <p className="text-gray-500">
                      Select a lesson from the sidebar to start learning
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced notes section - increased space */}
              <div className="lg:col-span-4">
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
    </div>
  );
};

export default CourseDetail;
