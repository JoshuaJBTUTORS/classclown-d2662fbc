
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CircleCheck, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CourseModule, CourseLesson, StudentProgress } from '@/types/course';
import { learningHubService } from '@/services/learningHubService';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CourseSidebarProps {
  modules: CourseModule[];
  studentProgress?: StudentProgress[];
  onSelectLesson: (lesson: CourseLesson) => void;
  currentLessonId?: string;
  isAdmin?: boolean;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  modules,
  studentProgress = [],
  onSelectLesson,
  currentLessonId,
  isAdmin = false
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    modules.reduce((acc, module) => ({ ...acc, [module.id]: true }), {})
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Helper to check if lesson is completed
  const isLessonCompleted = (lessonId: string) => {
    const progress = studentProgress.find(p => p.lesson_id === lessonId);
    const completed = progress?.status === 'completed';
    console.log('Checking lesson completion:', { lessonId, progress, completed });
    return completed;
  };

  // Mutation for toggling lesson completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      console.log('Starting toggle completion for lesson:', lessonId);
      console.log('User email:', user?.email);
      
      if (!user?.email) {
        throw new Error('User email not available');
      }
      
      const result = await learningHubService.toggleLessonCompletion(user.email, lessonId);
      console.log('Toggle completion result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Toggle completion success:', data);
      
      // Invalidate both student progress queries with proper keys
      queryClient.invalidateQueries({ 
        queryKey: ['student-progress', user?.email] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-progress', user?.email, window.location.pathname.split('/course/')[1]] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['course-progress'] 
      });
      
      toast({
        title: "Lesson status updated",
        description: "Lesson completion status has been updated.",
      });
    },
    onError: (error) => {
      console.error('Error toggling lesson completion:', error);
      toast({
        title: "Error updating lesson",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });

  const handleToggleCompletion = (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    console.log('Circle clicked for lesson:', lessonId);
    console.log('Current student progress:', studentProgress);
    console.log('Is lesson currently completed:', isLessonCompleted(lessonId));
    
    toggleCompletionMutation.mutate(lessonId);
  };

  console.log('CourseSidebar render:', {
    modulesCount: modules.length,
    studentProgressCount: studentProgress.length,
    userEmail: user?.email,
    currentLessonId
  });

  return (
    <div className="w-full h-full flex flex-col border rounded-md">
      <div className="p-4 border-b">
        <h3 className="font-medium">Course Content</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {modules.length === 0 ? (
            <div className="text-center p-4">
              <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No modules available</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Add Content
                </Button>
              )}
            </div>
          ) : (
            modules.map((module) => {
              const moduleLessons = module.lessons || [];
              const completedCount = moduleLessons.filter(lesson => isLessonCompleted(lesson.id)).length;
              const totalCount = moduleLessons.length;
              
              return (
                <div key={module.id} className="mb-3">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-md text-left"
                  >
                    <div className="flex-1">
                      <span className="font-medium truncate block">{module.title}</span>
                      {totalCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {completedCount}/{totalCount} completed
                        </span>
                      )}
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                  
                  {expandedModules[module.id] && moduleLessons.length > 0 && (
                    <div className="ml-4 border-l pl-3 mt-1 space-y-1">
                      {moduleLessons.map((lesson) => {
                        const completed = isLessonCompleted(lesson.id);
                        const isActive = currentLessonId === lesson.id;
                        const isLoading = toggleCompletionMutation.isPending;
                        
                        console.log('Rendering lesson:', { 
                          lessonId: lesson.id, 
                          lessonTitle: lesson.title, 
                          completed, 
                          isActive, 
                          isLoading 
                        });
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`w-full text-left p-2 text-sm rounded-md flex items-start hover:bg-gray-100 ${
                              isActive ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <button
                              onClick={(e) => handleToggleCompletion(e, lesson.id)}
                              disabled={isLoading}
                              className="mr-3 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50"
                            >
                              {completed ? (
                                <CircleCheck className="h-6 w-6 text-green-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-gray-300 hover:text-gray-500" />
                              )}
                            </button>
                            <button
                              onClick={() => onSelectLesson(lesson)}
                              className="flex-1 text-left"
                            >
                              <span className={`line-clamp-2 ${isActive ? 'font-medium text-blue-700' : ''}`}>
                                {lesson.title}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CourseSidebar;
