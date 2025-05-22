
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, PenSquare, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { learningHubService } from '@/services/learningHubService';
import { Course, CourseModule } from '@/types/course';
import CourseSidebar from '@/components/learningHub/CourseSidebar';
import ContentViewer from '@/components/learningHub/ContentViewer';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isOwner, isTutor } = useAuth();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const hasAdminPrivileges = isAdmin || isOwner || isTutor;

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
    onSuccess: (data) => {
      if (data && data.length > 0 && !activeModuleId) {
        setActiveModuleId(data[0].id);
        
        if (data[0].lessons && data[0].lessons.length > 0) {
          setActiveLessonId(data[0].lessons[0].id);
        }
      }
    }
  });

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    setActiveModuleId(moduleId);
    const selectedModule = modules?.find(m => m.id === moduleId);
    if (selectedModule?.lessons && selectedModule.lessons.length > 0) {
      setActiveLessonId(selectedModule.lessons[0].id);
    } else {
      setActiveLessonId(null);
    }
  };

  // Handle lesson selection
  const handleLessonSelect = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  // Find active content
  const activeModule = modules?.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons?.find(l => l.id === activeLessonId);

  if (courseLoading || modulesLoading) {
    return (
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Skeleton className="h-[600px] w-full" />
          </div>
          <div className="md:col-span-3">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (courseError || modulesError || !course) {
    return (
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
    );
  }

  return (
    <div className="container py-8">
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
        
        {hasAdminPrivileges && (
          <Button 
            onClick={() => navigate(`/learning-hub/course/${courseId}/edit`)}
            variant="outline"
          >
            <PenSquare className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
        )}
      </div>
      
      {/* Course header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-blue-500">{course.subject || "General"}</Badge>
          <Badge variant="outline" className="text-gray-500">{course.status}</Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-600">{course.description}</p>
      </div>
      
      <Separator className="my-6" />
      
      {/* Course content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with modules and lessons */}
        <div className="md:col-span-1">
          <CourseSidebar 
            modules={modules || []}
            activeModuleId={activeModuleId}
            activeLessonId={activeLessonId}
            onModuleSelect={handleModuleSelect}
            onLessonSelect={handleLessonSelect}
          />
        </div>
        
        {/* Content viewer */}
        <div className="md:col-span-3">
          {activeLesson ? (
            <ContentViewer 
              lesson={activeLesson} 
              moduleTitle={activeModule?.title || ''} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 border rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No lesson selected</h3>
              <p className="text-gray-500">
                Select a lesson from the sidebar to start learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
