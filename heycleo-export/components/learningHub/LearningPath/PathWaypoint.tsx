import React from 'react';
import { motion } from 'framer-motion';
import { PathWaypoint as PathWaypointType } from '@/types/learningPath';
import { BookOpen, Lock, CheckCircle, Play, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PathWaypointProps {
  waypoint: PathWaypointType;
  onClick: (courseId: string) => void;
  isActive?: boolean;
  theme: 'desert' | 'forest' | 'space' | 'ocean';
}

const PathWaypoint: React.FC<PathWaypointProps> = ({ 
  waypoint, 
  onClick, 
  isActive = false,
  theme = 'desert'
}) => {
  const { course, position, status, progress } = waypoint;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'available':
        return <BookOpen className="h-4 w-4" />;
      case 'locked':
        return <Lock className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };
  
  const getWaypointColors = () => {
    const themes = {
      desert: {
        locked: 'from-gray-300 to-gray-400',
        available: 'from-orange-400 to-yellow-500',
        in_progress: 'from-blue-400 to-purple-500',
        completed: 'from-green-400 to-emerald-500'
      },
      forest: {
        locked: 'from-gray-300 to-gray-400',
        available: 'from-green-400 to-teal-500',
        in_progress: 'from-blue-400 to-indigo-500',
        completed: 'from-emerald-400 to-green-600'
      },
      space: {
        locked: 'from-gray-300 to-gray-400',
        available: 'from-purple-400 to-pink-500',
        in_progress: 'from-blue-400 to-cyan-500',
        completed: 'from-yellow-400 to-orange-500'
      },
      ocean: {
        locked: 'from-gray-300 to-gray-400',
        available: 'from-blue-400 to-cyan-500',
        in_progress: 'from-teal-400 to-blue-500',
        completed: 'from-green-400 to-teal-600'
      }
    };
    
    return themes[theme][status];
  };
  
  const isClickable = status !== 'locked';
  
  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: position.x,
        top: position.y,
        rotate: `${position.angle}rad`
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.1 : 1,
        opacity: 1 
      }}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Waypoint Circle */}
      <div
        className={`
          relative w-16 h-16 rounded-full shadow-lg border-4 border-white
          bg-gradient-to-br ${getWaypointColors()}
          ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
          ${isActive ? 'ring-4 ring-primary/30' : ''}
          transition-all duration-200
        `}
        onClick={() => isClickable && onClick(course.id)}
      >
        {/* Progress Ring */}
        {status === 'in_progress' && progress > 0 && (
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
        )}
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {getStatusIcon()}
        </div>
        
        {/* Premium Badge */}
        {course.price && course.price > 0 && (
          <div className="absolute -top-1 -right-1">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
          </div>
        )}
      </div>
      
      {/* Course Info Tooltip */}
      <motion.div
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-48 max-w-64">
          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
            {course.title}
          </h4>
          
          {course.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {course.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {course.subject && (
                <Badge variant="outline" className="text-xs">
                  {course.subject}
                </Badge>
              )}
              
              {course.difficulty_level && (
                <Badge variant="outline" className="text-xs capitalize">
                  {course.difficulty_level}
                </Badge>
              )}
            </div>
            
            {status === 'in_progress' && (
              <span className="text-xs font-medium text-blue-600">
                {progress}%
              </span>
            )}
          </div>
          
          {course.price && course.price > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">
                £{(course.price / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PathWaypoint;