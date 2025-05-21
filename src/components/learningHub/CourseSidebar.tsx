
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, BookOpen, CircleCheck, Circle } from 'lucide-react';
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
  const navigate = useNavigate();
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

  return (
    <div className="w-full h-full flex flex-col border-r">
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
                  onClick={() => navigate('/learning-hub/edit')}
                >
                  Add Content
                </Button>
              )}
            </div>
          ) : (
            modules.map((module) => (
              <div key={module.id} className="mb-3">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-md text-left"
                >
                  <span className="font-medium truncate">{module.title}</span>
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
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson)}
                          className={`w-full text-left p-2 text-sm rounded-md flex items-start hover:bg-gray-100 ${
                            currentLessonId === lesson.id ? 'bg-gray-100 font-medium' : ''
                          }`}
                        >
                          <div className="mr-2 mt-0.5">
                            {status === 'completed' ? (
                              <CircleCheck className="h-4 w-4 text-green-500" />
                            ) : status === 'in_progress' ? (
                              <Circle className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <span className="line-clamp-2">{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CourseSidebar;
