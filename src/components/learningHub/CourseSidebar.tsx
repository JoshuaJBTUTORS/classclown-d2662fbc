
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CircleCheck, Circle, Lock, Play, FileText, Brain, Video } from 'lucide-react';
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
    return progress?.status === 'completed';
  };

  // Helper to check if lesson is accessible
  const isLessonAccessible = (lesson: CourseLesson) => {
    if (isAdmin) return true;
    if (isPurchased) return true;
    return lesson.is_preview === true;
  };

  // Get lesson type icon
  const getLessonIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'quiz':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'ai-assessment':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'text':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
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
    <div className="w-full h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">Course Content</h3>
        <p className="text-sm text-gray-600 mt-1">
          {modules.reduce((total, module) => total + (module.lessons?.length || 0), 0)} lessons
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {modules.length === 0 ? (
            <div className="text-center p-6">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h4 className="font-medium text-gray-800 mb-2">No modules available</h4>
              <p className="text-sm text-gray-600">Course content will appear here once added.</p>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                >
                  Add Content
                </Button>
              )}
            </div>
          ) : (
            modules.map((module, moduleIndex) => {
              const moduleLessons = module.lessons || [];
              const completedCount = moduleLessons.filter(lesson => isLessonCompleted(lesson.id)).length;
              const totalCount = moduleLessons.length;
              const accessibleCount = moduleLessons.filter(lesson => isLessonAccessible(lesson)).length;
              
              return (
                <div key={module.id} className="mb-2">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {moduleIndex + 1}
                        </span>
                        <span className="font-semibold text-gray-900 truncate">{module.title}</span>
                      </div>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-3 text-xs text-gray-600 ml-7">
                          <span>{completedCount}/{totalCount} completed</span>
                          {!isPurchased && !isAdmin && accessibleCount < totalCount && (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-orange-200 text-orange-700 bg-orange-50">
                              {accessibleCount} accessible
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedModules[module.id] && moduleLessons.length > 0 && (
                    <div className="ml-4 border-l-2 border-gray-100 pl-4 mt-2 space-y-1">
                      {moduleLessons.map((lesson, lessonIndex) => {
                        const completed = isLessonCompleted(lesson.id);
                        const isActive = currentLessonId === lesson.id;
                        const isLoading = toggleCompletionMutation.isPending;
                        const accessible = isLessonAccessible(lesson);
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`w-full text-left p-3 text-sm rounded-lg flex items-start transition-all ${
                              isActive 
                                ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                                : 'hover:bg-gray-50'
                            } ${!accessible ? 'opacity-60' : ''}`}
                          >
                            <button
                              onClick={(e) => handleToggleCompletion(e, lesson.id)}
                              disabled={isLoading || !accessible}
                              className="mr-3 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50 flex-shrink-0"
                            >
                              {completed ? (
                                <CircleCheck className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-300 hover:text-gray-500" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => handleLessonClick(lesson)}
                                className="flex items-start gap-3 text-left w-full"
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {getLessonIcon(lesson.content_type)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {lessonIndex + 1}
                                    </span>
                                    <span className={`font-medium line-clamp-2 ${
                                      isActive ? 'text-blue-700' : 'text-gray-900'
                                    }`}>
                                      {lesson.title}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    {lesson.is_preview && (
                                      <Badge variant="outline" className="text-xs px-2 py-0 bg-green-50 text-green-700 border-green-200">
                                        Preview
                                      </Badge>
                                    )}
                                    {lesson.duration_minutes && (
                                      <span className="text-xs text-gray-500">
                                        {lesson.duration_minutes} min
                                      </span>
                                    )}
                                    {!accessible && (
                                      <Lock className="h-3 w-3 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </button>
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
