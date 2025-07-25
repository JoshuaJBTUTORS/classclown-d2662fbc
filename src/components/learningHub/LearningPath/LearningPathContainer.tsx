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
      {/* Quest Map Container */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl p-8 overflow-hidden border border-primary/20 shadow-xl">
        {/* Parchment Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,hsl(var(--primary))_1px,transparent_0)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,hsl(var(--primary)/0.1)_50%,transparent_51%)] bg-[size:60px_60px]" />
        </div>
        
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
        
        {/* Quest Map Journey */}
        <div className="relative z-10 min-h-[600px]">
          {/* Terrain Background Elements */}
          <div className="absolute inset-0">
            {/* Mountains in background */}
            <div className="absolute top-0 left-0 w-full h-32 opacity-10">
              <svg viewBox="0 0 1200 200" className="w-full h-full">
                <path d="M0,200 L200,80 L350,120 L500,60 L700,100 L900,40 L1200,90 L1200,200 Z" 
                      fill="hsl(var(--primary) / 0.3)" />
              </svg>
            </div>
            
            {/* Trees scattered around */}
            <div className="absolute top-16 left-12 w-8 h-12 opacity-20">
              <div className="w-2 h-8 bg-primary/30 mx-auto"></div>
              <div className="w-8 h-4 bg-primary/40 rounded-full -mt-2"></div>
            </div>
            <div className="absolute top-20 right-20 w-6 h-10 opacity-15">
              <div className="w-1.5 h-6 bg-primary/30 mx-auto"></div>
              <div className="w-6 h-3 bg-primary/40 rounded-full -mt-1"></div>
            </div>
            <div className="absolute bottom-32 left-1/4 w-7 h-11 opacity-20">
              <div className="w-2 h-7 bg-primary/30 mx-auto"></div>
              <div className="w-7 h-4 bg-primary/40 rounded-full -mt-2"></div>
            </div>
          </div>
          
          {/* Mobile: Winding Vertical Path */}
          <div className="md:hidden relative px-8 py-12">
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {/* Main path background */}
              <path
                d="M40,50 Q60,100 40,150 Q20,200 40,250 Q60,300 40,350 Q20,400 40,450 Q60,500 40,550"
                stroke="#e2e8f0"
                strokeWidth="16"
                fill="none"
                className="drop-shadow-sm"
              />
              {/* Path center line */}
              <path
                d="M40,50 Q60,100 40,150 Q20,200 40,250 Q60,300 40,350 Q20,400 40,450 Q60,500 40,550"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress dots along path */}
              <circle cx="40" cy="50" r="3" fill="#1d4ed8" />
              <circle cx="50" cy="75" r="2" fill="#3b82f6" opacity="0.7" />
              <circle cx="40" cy="150" r="3" fill="#1d4ed8" />
              <circle cx="30" cy="175" r="2" fill="#3b82f6" opacity="0.7" />
              <circle cx="40" cy="250" r="3" fill="#1d4ed8" />
              <circle cx="50" cy="275" r="2" fill="#3b82f6" opacity="0.7" />
              <circle cx="40" cy="350" r="3" fill="#1d4ed8" />
              <circle cx="30" cy="375" r="2" fill="#3b82f6" opacity="0.7" />
              <circle cx="40" cy="450" r="3" fill="#1d4ed8" />
            </svg>
            
            <div className="relative" style={{ zIndex: 2 }}>
              {learningStops.map((stop, index) => {
                const yPosition = 50 + (index * 70);
                const xOffset = index % 2 === 0 ? 0 : 20;
                
                return (
                  <div 
                    key={stop.id} 
                    className="absolute"
                    style={{ 
                      top: `${yPosition}px`,
                      left: `${40 + xOffset}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <SimplePathStop
                      stopNumber={stop.stopNumber}
                      title={stop.title}
                      status={stop.status}
                      progress={stop.progress}
                      onClick={() => handleStopClick(stop.id)}
                      isPersonalized={stop.isPersonalized}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Desktop: Quest Map Layout */}
          <div className="hidden md:block relative px-12 py-16">
            {/* Winding Path SVG */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {/* Main Quest Path Background */}
              <path
                d="M100,150 Q200,100 300,120 Q400,140 500,100 Q600,60 700,80 Q800,100 900,80"
                stroke="#e2e8f0"
                strokeWidth="24"
                fill="none"
                className="drop-shadow-lg"
              />
              
              {/* Path centerline */}
              <path
                d="M100,150 Q200,100 300,120 Q400,140 500,100 Q600,60 700,80 Q800,100 900,80"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
              />
              
              {/* Path markers */}
              <circle cx="100" cy="150" r="4" fill="#1d4ed8" />
              <circle cx="150" cy="125" r="3" fill="#3b82f6" opacity="0.7" />
              <circle cx="250" cy="110" r="3" fill="#3b82f6" opacity="0.7" />
              <circle cx="300" cy="120" r="4" fill="#1d4ed8" />
              <circle cx="400" cy="140" r="4" fill="#1d4ed8" />
              <circle cx="450" cy="120" r="3" fill="#3b82f6" opacity="0.7" />
              <circle cx="500" cy="100" r="4" fill="#1d4ed8" />
              <circle cx="600" cy="60" r="4" fill="#1d4ed8" />
              <circle cx="650" cy="70" r="3" fill="#3b82f6" opacity="0.7" />
              <circle cx="700" cy="80" r="4" fill="#1d4ed8" />
              <circle cx="800" cy="100" r="3" fill="#3b82f6" opacity="0.7" />
              <circle cx="900" cy="80" r="4" fill="#1d4ed8" />
              
              {/* Branch paths for second row */}
              {learningStops.length > 5 && (
                <>
                  <path
                    d="M700,80 Q650,180 600,280 Q550,380 600,400 Q650,420 700,420 Q750,420 800,420"
                    stroke="#e2e8f0"
                    strokeWidth="20"
                    fill="none"
                    className="drop-shadow-lg"
                  />
                  <path
                    d="M700,80 Q650,180 600,280 Q550,380 600,400 Q650,420 700,420 Q750,420 800,420"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle cx="675" cy="130" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="625" cy="230" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="600" cy="280" r="4" fill="#1d4ed8" />
                  <circle cx="575" cy="340" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="600" cy="400" r="4" fill="#1d4ed8" />
                  <circle cx="650" cy="420" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="700" cy="420" r="4" fill="#1d4ed8" />
                  <circle cx="750" cy="420" r="3" fill="#3b82f6" opacity="0.7" />
                  <circle cx="800" cy="420" r="4" fill="#1d4ed8" />
                </>
              )}
            </svg>
            
            {/* Quest Waypoints */}
            <div className="relative" style={{ zIndex: 2 }}>
              {/* First row waypoints */}
              {learningStops.slice(0, 5).map((stop, index) => {
                const positions = [
                  { x: 100, y: 150 },
                  { x: 300, y: 120 },
                  { x: 500, y: 100 },
                  { x: 700, y: 80 },
                  { x: 900, y: 80 }
                ];
                
                const pos = positions[index];
                if (!pos) return null;
                
                return (
                  <div 
                    key={stop.id} 
                    className="absolute"
                    style={{ 
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <SimplePathStop
                      stopNumber={stop.stopNumber}
                      title={stop.title}
                      status={stop.status}
                      progress={stop.progress}
                      onClick={() => handleStopClick(stop.id)}
                      isPersonalized={stop.isPersonalized}
                    />
                  </div>
                );
              })}
              
              {/* Second row waypoints */}
              {learningStops.slice(5, 10).map((stop, index) => {
                const positions = [
                  { x: 600, y: 280 },
                  { x: 600, y: 400 },
                  { x: 700, y: 420 },
                  { x: 800, y: 420 },
                  { x: 850, y: 380 }
                ];
                
                const pos = positions[index];
                if (!pos) return null;
                
                return (
                  <div 
                    key={stop.id} 
                    className="absolute"
                    style={{ 
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <SimplePathStop
                      stopNumber={stop.stopNumber}
                      title={stop.title}
                      status={stop.status}
                      progress={stop.progress}
                      onClick={() => handleStopClick(stop.id)}
                      isPersonalized={stop.isPersonalized}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Quest Markers and Decorations */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Milestone flags */}
              <div className="absolute" style={{ left: '300px', top: '90px' }}>
                <div className="w-6 h-8 opacity-40">
                  <div className="w-1 h-8 bg-primary/60 mx-auto rounded-full"></div>
                  <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-primary/70 -mt-6 ml-1"></div>
                </div>
              </div>
              
              <div className="absolute" style={{ left: '700px', top: '50px' }}>
                <div className="w-6 h-8 opacity-40">
                  <div className="w-1 h-8 bg-primary/60 mx-auto rounded-full"></div>
                  <div className="w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-primary/70 -mt-6 ml-1"></div>
                </div>
              </div>
              
              {/* Treasure chest at the end */}
              {learningStops.filter(s => s.status === 'completed').length === learningStops.length && (
                <div className="absolute animate-bounce" style={{ left: '850px', top: '350px' }}>
                  <div className="text-2xl">🏆</div>
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