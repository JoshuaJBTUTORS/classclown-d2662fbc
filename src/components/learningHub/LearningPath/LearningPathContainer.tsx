import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { learningHubService } from '@/services/learningHubService';
import { WaypointStatus } from '@/types/learningPath';
import SimplePathStop from './SimplePathStop';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const LearningPathContainer: React.FC = () => {
  const navigate = useNavigate();
  
  // Data fetching
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses-with-path'],
    queryFn: learningHubService.getCourses
  });
  
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      try {
        const progress = await learningHubService.getStudentProgress();
        const progressMap: Record<string, number> = {};
        
        // Simple progress mapping for now
        courses?.forEach((course, index) => {
          // Simulate some progress based on course position
          if (index === 0) progressMap[course.id] = 100; // First course completed
          else if (index === 1) progressMap[course.id] = 60; // Second course in progress
          else progressMap[course.id] = 0; // Rest are not started
        });
        
        return progressMap;
      } catch (error) {
        console.error('Error fetching user progress:', error);
        return {};
      }
    },
    enabled: !!courses
  });
  
  // Fixed learning path stops (10 stops)
  const learningStops = React.useMemo(() => {
    if (!courses || courses.length === 0) return [];
    
    // Take first 10 courses or pad with placeholders
    const stopTitles = [
      'Foundations', 'Basics', 'Core Concepts', 'Practice', 'Intermediate',
      'Advanced', 'Mastery', 'Projects', 'Specialization', 'Expert'
    ];
    
    return Array.from({ length: 10 }, (_, index) => {
      const course = courses[index];
      const progress = userProgress?.[course?.id] || 0;
      
      let status: WaypointStatus = 'locked';
      if (index === 0) status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'available';
      else if (index === 1 && (userProgress?.[courses[0]?.id] || 0) >= 100) {
        status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'available';
      } else if (index > 1) {
        const prevCourse = courses[index - 1];
        const prevProgress = userProgress?.[prevCourse?.id] || 0;
        if (prevProgress >= 100) {
          status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'available';
        }
      }
      
      return {
        id: course?.id || `placeholder-${index}`,
        stopNumber: index + 1,
        title: course?.title || stopTitles[index],
        status,
        progress,
        course
      };
    });
  }, [courses, userProgress]);
  
  // Event handlers
  const handleStopClick = (stopId: string) => {
    const stop = learningStops.find(s => s.id === stopId);
    if (stop?.course && stop.status !== 'locked') {
      navigate(`/course/${stop.course.id}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-primary/5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !courses) {
    return (
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-primary/5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Unable to Load Learning Path</h3>
            <p className="text-gray-600">There was an error loading your learning journey.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (courses.length === 0) {
    return (
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-primary/5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Courses Available</h3>
            <p className="text-gray-600">Courses will appear here when they're published.</p>
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