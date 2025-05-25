
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CircleCheck, Circle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CourseModule, CourseLesson, StudentProgress } from '@/types/course';

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
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    // Default to expanding all modules
    modules.reduce((acc, module) => ({ ...acc, [module.id]: true }), {})
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Helper to check lesson status
  const getLessonStatus = (lessonId: string) => {
    const progress = studentProgress.find(p => p.lesson_id === lessonId);
    return progress?.status || 'not_started';
  };

  // Helper to get lesson progress percentage
  const getLessonProgress = (lessonId: string) => {
    const progress = studentProgress.find(p => p.lesson_id === lessonId);
    return progress?.completion_percentage || 0;
  };

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
              const moduleProgress = module.lessons?.map(lesson => getLessonStatus(lesson.id)) || [];
              const completedCount = moduleProgress.filter(status => status === 'completed').length;
              const totalCount = moduleProgress.length;
              
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
                  
                  {expandedModules[module.id] && module.lessons && module.lessons.length > 0 && (
                    <div className="ml-4 border-l pl-3 mt-1 space-y-1">
                      {module.lessons.map((lesson) => {
                        const status = getLessonStatus(lesson.id);
                        const progress = getLessonProgress(lesson.id);
                        const isActive = currentLessonId === lesson.id;
                        
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full text-left p-2 text-sm rounded-md flex items-start hover:bg-gray-100 ${
                              isActive ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                          >
                            <div className="mr-2 mt-0.5">
                              {status === 'completed' ? (
                                <CircleCheck className="h-4 w-4 text-green-500" />
                              ) : status === 'in_progress' ? (
                                <Play className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className={`line-clamp-2 ${isActive ? 'font-medium text-blue-700' : ''}`}>
                                {lesson.title}
                              </span>
                              {status === 'in_progress' && progress > 0 && (
                                <div className="mt-1">
                                  <div className="w-full bg-gray-200 rounded-full h-1">
                                    <div 
                                      className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                                      style={{ width: `${progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                                </div>
                              )}
                            </div>
                          </button>
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
