import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { WaypointStatus } from '@/types/learningPath';
import { CourseModule } from '@/types/course';
import SimplePathStop from './SimplePathStop';

import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Target } from 'lucide-react';
import { usePersonalizedLearningPath } from '@/hooks/usePersonalizedLearningPath';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LearningPathContainerProps {
  modules: CourseModule[];
  courseId: string;
  onModuleClick: (moduleId: string) => void;
}

const LearningPathContainer: React.FC<LearningPathContainerProps> = ({ modules, courseId, onModuleClick }) => {
  const { toast } = useToast();
  
  // Get personalized module order
  const { data: personalizedOrder } = usePersonalizedLearningPath({
    courseId,
    modules,
    enabled: modules.length > 0
  });

  // Use personalized modules or fallback to original
  const orderedModules = personalizedOrder?.modules || modules;
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', orderedModules.map(m => m.id)],
    queryFn: () => learningHubService.getStudentProgress(),
    enabled: orderedModules.length > 0,
  });
  
  // Add assessment status query with personalized path support
  const { data: moduleAccessList } = useQuery({
    queryKey: ['module-access-list', orderedModules.map(m => m.id), personalizedOrder?.isPersonalized],
    queryFn: async () => {
      if (!orderedModules.length) return {};
      const accessPromises = orderedModules.map(async (module) => {
        // Use personalized path access control if available
        const hasAccess = personalizedOrder?.isPersonalized 
          ? await learningHubService.checkModuleAccessWithPersonalizedPath(module.id, orderedModules)
          : await learningHubService.checkModuleAccess(module.id);
        return [module.id, hasAccess];
      });
      const results = await Promise.all(accessPromises);
      return Object.fromEntries(results);
    },
    enabled: orderedModules.length > 0,
  });

  // Fixed learning path stops from modules
  const learningStops = React.useMemo(() => {
    if (!orderedModules || orderedModules.length === 0) return [];
    
    // Take up to 10 modules and map them to learning stops
    return orderedModules.slice(0, 10).map((module, index) => {
      // Calculate progress for this module
      const moduleProgress = userProgress?.filter(progress => {
        // Check if this progress belongs to lessons in this module
        return module.lessons?.some((lesson: any) => lesson.id === progress.lesson_id);
      }) || [];

      // Determine status based on progress and access control
      let status: WaypointStatus = 'locked';
      let progress = 0;

      const totalLessons = module.lessons?.length || 0;
      const completedLessons = moduleProgress.filter(p => p.status === 'completed').length;
      const hasAccess = moduleAccessList?.[module.id] ?? (index === 0); // First module always accessible by default

      if (!hasAccess) {
        status = 'locked';
        progress = 0;
      } else {
        // Module is accessible
        if (completedLessons === totalLessons && totalLessons > 0) {
          status = 'completed';
          progress = 100;
        } else if (completedLessons > 0) {
          status = 'in_progress';
          progress = Math.round((completedLessons / totalLessons) * 100);
        } else {
          status = 'available';
          progress = 0;
        }
      }

      return {
        id: module.id,
        stopNumber: index + 1,
        title: module.title,
        status,
        progress,
        module,
        isPersonalized: personalizedOrder?.isPersonalized && index > 0 // Don't mark first module as personalized
      };
    });
  }, [orderedModules, userProgress, moduleAccessList, personalizedOrder]);
  
  // Event handlers
  const handleStopClick = (stopId: string) => {
    const stop = learningStops.find(s => s.id === stopId);
    if (stop && stop.status !== 'locked') {
      onModuleClick(stopId);
    } else if (stop && stop.status === 'locked') {
      toast({
        title: "Module Locked",
        description: "Complete the previous module's assessment to unlock this module.",
        variant: "destructive",
      });
    }
  };
  
  if (!orderedModules || orderedModules.length === 0) {
    return (
      <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-50 to-primary/5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Modules Available</h3>
            <p className="text-gray-600">Course content is being prepared.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Learning Path Grid */}
      <div className="relative rounded-2xl p-8 overflow-hidden border border-border/50 bg-white">
        {/* Clean white background */}
        
        {/* Progress Header */}
        <div className="relative z-10 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-foreground">Your Learning Journey</h2>
            {personalizedOrder?.isPersonalized && (
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                <Target className="w-3 h-3 mr-1" />
                Personalized
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {personalizedOrder?.isPersonalized 
              ? "Customized based on your assessment performance" 
              : "Complete each step to unlock the next level"
            }
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(learningStops.filter(s => s.status === 'completed').length / learningStops.length) * 100}%` 
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {learningStops.filter(s => s.status === 'completed').length} of {learningStops.length} completed
            </p>
          </div>
        </div>
        
        {/* Learning Path Steps */}
        <div className="relative z-10">
          {/* Mobile: Vertical Centered Layout */}
          <div className="md:hidden">
            <div className="flex flex-col items-center space-y-6 relative">
              {learningStops.map((stop, index) => (
                <div key={stop.id} className="flex flex-col items-center relative">
                  <SimplePathStop
                    stopNumber={stop.stopNumber}
                    title={stop.title}
                    status={stop.status}
                    progress={stop.progress}
                    onClick={() => handleStopClick(stop.id)}
                    isPersonalized={stop.isPersonalized}
                  />
                  {/* Vertical connection line */}
                  {index < learningStops.length - 1 && (
                    <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-muted mt-4 mb-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Tablet: 2-3 Column Grid Layout */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-3 gap-8 relative">
              {learningStops.map((stop, index) => (
                <div key={stop.id} className="flex flex-col items-center relative">
                  <SimplePathStop
                    stopNumber={stop.stopNumber}
                    title={stop.title}
                    status={stop.status}
                    progress={stop.progress}
                    onClick={() => handleStopClick(stop.id)}
                    isPersonalized={stop.isPersonalized}
                  />
                  {/* Grid connection lines for tablet */}
                  {index < learningStops.length - 1 && (
                    <>
                      {/* Horizontal line to next in row */}
                      {(index + 1) % 3 !== 0 && (
                        <div className="absolute top-8 left-full w-8 h-px bg-gradient-to-r from-primary/50 to-muted z-0" />
                      )}
                      {/* Vertical line to next row */}
                      {(index + 1) % 3 === 0 && index < learningStops.length - 1 && (
                        <div className="absolute top-full left-1/2 w-px h-8 bg-gradient-to-b from-primary/50 to-muted mt-4 -translate-x-1/2 z-0" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Horizontal Layout */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-muted via-primary/30 to-muted" />
              
              {/* Steps Grid */}
              <div className="grid grid-cols-5 gap-8 xl:gap-12">
                {learningStops.slice(0, 5).map((stop) => (
                  <div key={stop.id} className="relative z-10">
                    <SimplePathStop
                      stopNumber={stop.stopNumber}
                      title={stop.title}
                      status={stop.status}
                      progress={stop.progress}
                      onClick={() => handleStopClick(stop.id)}
                      isPersonalized={stop.isPersonalized}
                    />
                  </div>
                ))}
              </div>
              
              {/* Second Row */}
              {learningStops.length > 5 && (
                <div className="mt-16 relative">
                  <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-muted via-primary/30 to-muted" />
                  <div className="grid grid-cols-5 gap-8 xl:gap-12">
                    {learningStops.slice(5, 10).map((stop) => (
                      <div key={stop.id} className="relative z-10">
                        <SimplePathStop
                          stopNumber={stop.stopNumber}
                          title={stop.title}
                          status={stop.status}
                          progress={stop.progress}
                          onClick={() => handleStopClick(stop.id)}
                          isPersonalized={stop.isPersonalized}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathContainer;