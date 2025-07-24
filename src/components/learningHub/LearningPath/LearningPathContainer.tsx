import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { WaypointStatus } from '@/types/learningPath';
import { CourseModule } from '@/types/course';
import SimplePathStop from './SimplePathStop';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface LearningPathContainerProps {
  modules: CourseModule[];
  onModuleClick: (moduleId: string) => void;
}

const LearningPathContainer: React.FC<LearningPathContainerProps> = ({ modules, onModuleClick }) => {
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', modules.map(m => m.id)],
    queryFn: () => learningHubService.getStudentProgress(),
    enabled: modules.length > 0,
  });
  
  // Fixed learning path stops from modules
  const learningStops = React.useMemo(() => {
    if (!modules || modules.length === 0) return [];
    
    // Take up to 10 modules and map them to learning stops
    return modules.slice(0, 10).map((module, index) => {
      // Calculate progress for this module
      const moduleProgress = userProgress?.filter(progress => {
        // Check if this progress belongs to lessons in this module
        return module.lessons?.some((lesson: any) => lesson.id === progress.lesson_id);
      }) || [];

      // Determine status based on progress
      let status: WaypointStatus = 'locked';
      let progress = 0;

      const totalLessons = module.lessons?.length || 0;
      const completedLessons = moduleProgress.filter(p => p.status === 'completed').length;

      if (index === 0) {
        // First module is always available
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
      } else {
        // Check if previous module is completed
        const prevModule = modules[index - 1];
        const prevModuleProgress = userProgress?.filter(progress => {
          return prevModule.lessons?.some((lesson: any) => lesson.id === progress.lesson_id);
        }) || [];
        const prevCompletedLessons = prevModuleProgress.filter(p => p.status === 'completed').length;
        const prevTotalLessons = prevModule.lessons?.length || 0;
        
        if (prevCompletedLessons === prevTotalLessons && prevTotalLessons > 0) {
          // Previous module completed, this one is available
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
        } else {
          status = 'locked';
          progress = 0;
        }
      }

      return {
        id: module.id,
        stopNumber: index + 1,
        title: module.title,
        status,
        progress,
        module
      };
    });
  }, [modules, userProgress]);
  
  // Event handlers
  const handleStopClick = (stopId: string) => {
    const stop = learningStops.find(s => s.id === stopId);
    if (stop && stop.status !== 'locked') {
      onModuleClick(stopId);
    }
  };
  
  if (!modules || modules.length === 0) {
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
      <div className="relative bg-gradient-to-br from-background to-muted/20 rounded-2xl p-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary))_1px,transparent_0)] bg-[size:24px_24px]" />
        </div>
        
        {/* Progress Header */}
        <div className="relative z-10 mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Learning Journey</h2>
          <p className="text-muted-foreground">Complete each step to unlock the next level</p>
          
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
          {/* Mobile: Vertical Layout */}
          <div className="md:hidden">
            <div className="space-y-8">
              {learningStops.map((stop, index) => (
                <div key={stop.id} className="flex items-center space-x-4">
                  <SimplePathStop
                    stopNumber={stop.stopNumber}
                    title={stop.title}
                    status={stop.status}
                    progress={stop.progress}
                    onClick={() => handleStopClick(stop.id)}
                  />
                  {index < learningStops.length - 1 && (
                    <div className="flex-1 h-px bg-gradient-to-r from-muted to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-muted via-primary/30 to-muted" />
              
              {/* Steps Grid */}
              <div className="grid grid-cols-5 gap-8 lg:gap-12">
                {learningStops.slice(0, 5).map((stop) => (
                  <div key={stop.id} className="relative z-10">
                    <SimplePathStop
                      stopNumber={stop.stopNumber}
                      title={stop.title}
                      status={stop.status}
                      progress={stop.progress}
                      onClick={() => handleStopClick(stop.id)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Second Row */}
              <div className="mt-16 relative">
                <div className="absolute top-8 left-8 right-8 h-px bg-gradient-to-r from-muted via-primary/30 to-muted" />
                <div className="grid grid-cols-5 gap-8 lg:gap-12">
                  {learningStops.slice(5, 10).map((stop) => (
                    <div key={stop.id} className="relative z-10">
                      <SimplePathStop
                        stopNumber={stop.stopNumber}
                        title={stop.title}
                        status={stop.status}
                        progress={stop.progress}
                        onClick={() => handleStopClick(stop.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathContainer;