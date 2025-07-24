import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { learningHubService } from '@/services/learningHubService';
import { CourseWithPath, PathWaypoint as PathWaypointType, PathViewport } from '@/types/learningPath';
import { generateWaypointPositions, generatePathLines, calculateViewport } from './utils/pathGeneration';
import { calculateWaypointStatus, calculatePathCompletion, getNextAvailableCourse } from './utils/progressCalculation';
import PathBackground from './PathBackground';
import PathLine from './PathLine';
import PathWaypoint from './PathWaypoint';
import PathControls from './PathControls';
import PathMinimap from './PathMinimap';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

const LearningPathContainer: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 600 });
  
  // State
  const [theme, setTheme] = useState<'desert' | 'forest' | 'space' | 'ocean'>('desert');
  const [viewport, setViewport] = useState<PathViewport>({
    centerX: 600,
    centerY: 300,
    zoom: 1,
    width: 1200,
    height: 600
  });
  const [showMinimap, setShowMinimap] = useState(false);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Data fetching
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses-with-path'],
    queryFn: async () => {
      const coursesData = await learningHubService.getCourses();
      return coursesData as CourseWithPath[];
    }
  });
  
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      try {
        const progress = await learningHubService.getStudentProgress();
        const progressMap: Record<string, number> = {};
        
        // Group progress by course and calculate completion
        const courseProgress: Record<string, any[]> = {};
        progress.forEach(p => {
          if (p.lesson_id) {
            // We'd need to map lessons to courses here
            // For now, let's simulate some progress
            const courseId = `course_${Math.floor(Math.random() * 5) + 1}`;
            if (!courseProgress[courseId]) courseProgress[courseId] = [];
            courseProgress[courseId].push(p);
          }
        });
        
        // Calculate completion percentage for each course
        Object.entries(courseProgress).forEach(([courseId, progressArray]) => {
          const completedLessons = progressArray.filter(p => p.status === 'completed').length;
          const totalLessons = progressArray.length;
          progressMap[courseId] = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        });
        
        return progressMap;
      } catch (error) {
        console.error('Error fetching user progress:', error);
        return {};
      }
    },
    enabled: !!courses
  });
  
  // Calculate waypoints and path
  const waypoints: PathWaypointType[] = React.useMemo(() => {
    if (!courses || courses.length === 0) return [];
    
    const pathConfig = {
      pathType: 'spiral' as const,
      spacing: 120,
      curvature: 0.3
    };
    
    const positions = generateWaypointPositions(
      courses,
      pathConfig,
      containerSize.width,
      containerSize.height
    );
    
    const completedCourses = Object.entries(userProgress || {})
      .filter(([_, progress]) => progress >= 100)
      .map(([courseId]) => courseId);
    
    return courses.map((course, index) => ({
      id: course.id,
      course,
      position: positions[index] || { x: containerSize.width / 2, y: containerSize.height / 2, angle: 0 },
      status: calculateWaypointStatus(course, userProgress || {}, completedCourses),
      isUnlocked: course.path_position <= 100 || completedCourses.length > 0, // Simplified logic
      progress: userProgress?.[course.id] || 0
    }));
  }, [courses, userProgress, containerSize.width, containerSize.height]);
  
  const pathData = React.useMemo(() => {
    if (waypoints.length < 2) return '';
    return generatePathLines(waypoints.map(w => w.position));
  }, [waypoints]);
  
  const pathCompletion = React.useMemo(() => {
    if (!courses) return 0;
    const completedCourses = Object.entries(userProgress || {})
      .filter(([_, progress]) => progress >= 100)
      .map(([courseId]) => courseId);
    return calculatePathCompletion(courses, completedCourses);
  }, [courses, userProgress]);
  
  // Initialize container size and viewport
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newSize = { width: rect.width, height: rect.height };
        setContainerSize(newSize);
        setViewport(prev => ({
          ...prev,
          width: newSize.width,
          height: newSize.height
        }));
      }
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Center the path initially when waypoints are available
  useEffect(() => {
    if (waypoints.length > 0 && !isInitialized) {
      const calculatedViewport = calculateViewport(
        waypoints.map(w => w.position),
        containerSize.width,
        containerSize.height
      );
      setViewport(prev => ({
        ...prev,
        centerX: calculatedViewport.centerX,
        centerY: calculatedViewport.centerY,
        zoom: 0.8
      }));
      setIsInitialized(true);
    }
  }, [waypoints, containerSize, isInitialized]);

  // Auto-focus on next available course (delayed)
  useEffect(() => {
    if (courses && !activeCourse && isInitialized) {
      const timer = setTimeout(() => {
        const nextCourse = getNextAvailableCourse(
          courses,
          userProgress || {},
          Object.entries(userProgress || {})
            .filter(([_, progress]) => progress >= 100)
            .map(([courseId]) => courseId)
        );
        
        if (nextCourse) {
          setActiveCourse(nextCourse.id);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [courses, userProgress, activeCourse, isInitialized]);
  
  // Event handlers
  const handleWaypointClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };
  
  const handleZoomIn = () => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 2)
    }));
  };
  
  const handleZoomOut = () => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.5)
    }));
  };
  
  const handleReset = () => {
    if (waypoints.length > 0) {
      const calculatedViewport = calculateViewport(
        waypoints.map(w => w.position),
        containerSize.width,
        containerSize.height
      );
      setViewport(prev => ({
        ...prev,
        centerX: calculatedViewport.centerX,
        centerY: calculatedViewport.centerY,
        zoom: 0.8
      }));
    }
  };
  
  const handleNavigate = (position: { x: number; y: number }) => {
    setViewport(prev => ({
      ...prev,
      centerX: position.x,
      centerY: position.y
    }));
  };
  
  const pathBounds = React.useMemo(() => {
    if (waypoints.length === 0) {
      return { minX: 0, maxX: containerSize.width, minY: 0, maxY: containerSize.height };
    }
    
    const positions = waypoints.map(w => w.position);
    return {
      minX: Math.min(...positions.map(p => p.x)),
      maxX: Math.max(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
      maxY: Math.max(...positions.map(p => p.y))
    };
  }, [waypoints, containerSize]);
  
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
    <div 
      ref={containerRef}
      className="relative w-full h-[600px] bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200"
    >
      {/* Background */}
      <PathBackground 
        theme={theme} 
        width={containerSize.width} 
        height={containerSize.height} 
      />
      
      {/* Main SVG Canvas */}
      <motion.div
        className="absolute inset-0"
        animate={{
          x: (containerSize.width / 2) - (viewport.centerX * viewport.zoom),
          y: (containerSize.height / 2) - (viewport.centerY * viewport.zoom),
          scale: viewport.zoom
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <svg
          width={containerSize.width}
          height={containerSize.height}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {/* Path Line */}
          {pathData && (
        <PathLine 
          pathData={pathData} 
          positions={waypoints.map(w => w.position)}
          theme={theme} 
          progress={pathCompletion} 
        />
          )}
        </svg>
        
        {/* Waypoints */}
        <div className="relative w-full h-full">
          {waypoints.map((waypoint) => (
            <PathWaypoint
              key={waypoint.id}
              waypoint={waypoint}
              onClick={handleWaypointClick}
              isActive={activeCourse === waypoint.id}
              theme={theme}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Controls */}
      <PathControls
        zoom={viewport.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onThemeChange={setTheme}
        currentTheme={theme}
        pathCompletion={pathCompletion}
        totalCourses={courses.length}
        completedCourses={Object.entries(userProgress || {}).filter(([_, progress]) => progress >= 100).length}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
      />
      
      {/* Minimap */}
      {showMinimap && (
        <PathMinimap
          waypoints={waypoints}
          currentPosition={{ x: viewport.centerX, y: viewport.centerY }}
          onNavigate={handleNavigate}
          pathBounds={pathBounds}
        />
      )}
    </div>
  );
};

export default LearningPathContainer;