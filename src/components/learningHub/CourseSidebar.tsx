import React, { useState } from 'react';
import { CourseLesson, CourseModule, StudentProgress } from '@/types/course';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, CheckCircle2, Clock, LockIcon, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isPurchased = false,
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    // Auto-expand first module and current module by default
    const initialExpanded: Record<string, boolean> = {};
    
    if (modules.length > 0) {
      initialExpanded[modules[0].id] = true;
    }
    
    // Also expand the module containing the current lesson
    if (currentLessonId) {
      modules.forEach(module => {
        if (module.lessons?.some(lesson => lesson.id === currentLessonId)) {
          initialExpanded[module.id] = true;
        }
      });
    }
    
    return initialExpanded;
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getLessonStatus = (lessonId: string) => {
    const progress = studentProgress.find(p => p.lesson_id === lessonId);
    return progress ? progress.status : 'not_started';
  };

  const getLessonIcon = (lesson: CourseLesson) => {
    const status = getLessonStatus(lesson.id);
    
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    } else if (status === 'in_progress') {
      return <Clock className="h-4 w-4 text-amber-500" />;
    } else if (!isPurchased && !isAdmin && !lesson.is_preview) {
      return <LockIcon className="h-4 w-4 text-gray-400" />;
    } else if (lesson.content_type === 'video') {
      return <PlayCircle className="h-4 w-4 text-blue-500" />;
    }
    
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 sm:py-4 font-medium text-lg bg-gray-50 border-b border-gray-200">
        Course Content
      </div>
      
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {modules.map((module) => (
          <div key={module.id} className="border-b border-gray-200 last:border-b-0">
            {/* Module Header - Touchable area increased for mobile */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full text-left flex items-center py-3 px-4 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
              aria-expanded={expandedModules[module.id]}
            >
              {expandedModules[module.id] ? (
                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
              )}
              <div className="ml-2 flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 truncate">{module.title}</h3>
                {module.lessons && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </p>
                )}
              </div>
            </button>
            
            {/* Lessons list - Expanded when module is open */}
            {expandedModules[module.id] && module.lessons && (
              <div className="pl-8 pr-3 pb-2">
                {module.lessons.map((lesson) => {
                  const isActive = currentLessonId === lesson.id;
                  const canAccess = isAdmin || isPurchased || lesson.is_preview;
                  const status = getLessonStatus(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => canAccess && onSelectLesson(lesson)}
                      disabled={!canAccess}
                      className={cn(
                        "w-full flex items-start py-2.5 px-3 rounded-lg text-left mb-1 transition-colors group",
                        isActive ? "bg-primary/10 text-primary" : 
                        canAccess ? "hover:bg-gray-50" : "opacity-60",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-gray-50"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getLessonIcon(lesson)}
                      </div>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn(
                            "text-sm font-medium truncate flex-1",
                            isActive ? "text-primary" : canAccess ? "text-gray-800" : "text-gray-500"
                          )}>
                            {lesson.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {lesson.is_preview && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-blue-50 text-blue-700 border-blue-200">
                              Preview
                            </Badge>
                          )}
                          
                          {lesson.content_type && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-gray-50 text-gray-600 border-gray-200">
                              {lesson.content_type}
                            </Badge>
                          )}
                          
                          {lesson.duration_minutes && (
                            <span className="text-[10px] text-gray-500">
                              {lesson.duration_minutes} min
                            </span>
                          )}
                          
                          {status === 'completed' && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        
        {modules.length === 0 && (
          <div className="py-6 px-4 text-center text-gray-500">
            No modules available in this course yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSidebar;
