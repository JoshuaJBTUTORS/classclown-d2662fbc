
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CircleCheck, Circle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  isPurchased?: boolean;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  modules,
  studentProgress = [],
  onSelectLesson,
  currentLessonId,
  isAdmin = false,
  isPurchased = false
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
    return completed;
  };

  // Helper to check if lesson is accessible
  const isLessonAccessible = (lesson: CourseLesson) => {
    // Admin can access all lessons
    if (isAdmin) return true;
    
    // If course is purchased, all lessons are accessible
    if (isPurchased) return true;
    
    // If not purchased, only preview lessons are accessible
    return lesson.is_preview === true;
  };

  // Mutation for toggling lesson completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user?.email) {
        throw new Error('User email not available');
      }
      
      const result = await learningHubService.toggleLessonCompletion(user.email, lessonId);
      return result;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
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
    toggleCompletionMutation.mutate(lessonId);
  };

  const handleLessonClick = (lesson: CourseLesson) => {
    if (!isLessonAccessible(lesson)) {
      toast({
        title: "Lesson locked",
        description: "Purchase the full course to access this lesson.",
        variant: "destructive",
      });
      return;
    }
    onSelectLesson(lesson);
  };

  return (
    <div className="w-full h-full flex flex-col border rounded-md bg-white">
      <div className="p-3 border-b">
        <h3 className="font-medium text-sm">Course Content</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-1">
          {modules.length === 0 ? (
            <div className="text-center p-3">
              <BookOpen className="mx-auto h-6 w-6 text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">No modules available</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-xs"
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
              const accessibleCount = moduleLessons.filter(lesson => isLessonAccessible(lesson)).length;
              
              return (
                <div key={module.id} className="mb-2">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block">{module.title}</span>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{completedCount}/{totalCount}</span>
                          {!isPurchased && !isAdmin && (
                            <Badge variant="outline" className="text-xs">
                              {accessibleCount} accessible
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="h-3 w-3 flex-shrink-0 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 flex-shrink-0 ml-1" />
                    )}
                  </button>
                  
                  {expandedModules[module.id] && moduleLessons.length > 0 && (
                    <div className="ml-3 border-l pl-2 mt-1 space-y-1">
                      {moduleLessons.map((lesson) => {
                        const completed = isLessonCompleted(lesson.id);
                        const isActive = currentLessonId === lesson.id;
                        const isLoading = toggleCompletionMutation.isPending;
                        const accessible = isLessonAccessible(lesson);
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`w-full text-left p-1.5 text-xs rounded flex items-start hover:bg-gray-50 ${
                              isActive ? 'bg-blue-50 border border-blue-200' : ''
                            } ${!accessible ? 'opacity-60' : ''}`}
                          >
                            <button
                              onClick={(e) => handleToggleCompletion(e, lesson.id)}
                              disabled={isLoading || !accessible}
                              className="mr-2 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50 flex-shrink-0"
                            >
                              {completed ? (
                                <CircleCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-300 hover:text-gray-500" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <button
                                onClick={() => handleLessonClick(lesson)}
                                className="flex-1 text-left min-w-0"
                              >
                                <span className={`line-clamp-2 ${isActive ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                  {lesson.title}
                                </span>
                              </button>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {lesson.is_preview && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Preview
                                  </Badge>
                                )}
                                {!accessible && (
                                  <Lock className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            </div>
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
