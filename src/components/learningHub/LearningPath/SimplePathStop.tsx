import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lock, CheckCircle, Play, Target } from 'lucide-react';
import { WaypointStatus } from '@/types/learningPath';
import { Badge } from '@/components/ui/badge';

interface SimplePathStopProps {
  stopNumber: number;
  title: string;
  status: WaypointStatus;
  progress: number;
  onClick: () => void;
  isActive?: boolean;
  isPersonalized?: boolean;
}

const SimplePathStop: React.FC<SimplePathStopProps> = ({
  stopNumber,
  title,
  status,
  progress,
  onClick,
  isActive = false,
  isPersonalized = false
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return <Lock className="w-6 h-6 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'in_progress':
        return <Play className="w-6 h-6 text-white" />;
      default:
        return <BookOpen className="w-6 h-6 text-white" />;
    }
  };

  const getStopStyles = () => {
    switch (status) {
      case 'locked':
        return 'bg-muted border-muted-foreground/20 cursor-not-allowed';
      case 'completed':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 cursor-pointer hover:from-emerald-600 hover:to-emerald-700';
      case 'in_progress':
        return 'bg-gradient-to-br from-primary to-primary/80 border-primary cursor-pointer hover:from-primary/90 hover:to-primary';
      default:
        return 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 cursor-pointer hover:from-blue-600 hover:to-blue-700';
    }
  };

  const isClickable = status !== 'locked';

  return (
    <motion.div
      className="flex flex-col items-center space-y-3 group"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: stopNumber * 0.1 }}
      whileHover={isClickable ? { 
        scale: 1.1,
        y: -8,
        transition: { duration: 0.3, ease: "backOut" }
      } : {}}
      whileTap={isClickable ? { 
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
    >
      {/* Hover Glow Effect */}
      {isClickable && (
        <motion.div
          className="absolute w-20 h-20 rounded-full -z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ 
            opacity: 0.6,
            scale: 1.4,
            transition: { duration: 0.3 }
          }}
          style={{
            background: status === 'completed' 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
              : status === 'in_progress'
              ? 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
          }}
        />
      )}

      {/* Stop Circle */}
      <motion.div
        className={`
          relative w-16 h-16 rounded-full border-2 flex items-center justify-center
          transition-all duration-300 shadow-lg overflow-hidden
          ${getStopStyles()}
          ${isActive ? 'ring-4 ring-primary/30 ring-offset-2' : ''}
          ${isClickable ? 'group-hover:shadow-2xl group-hover:shadow-primary/25' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
        whileHover={isClickable ? {
          boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.25)",
          transition: { duration: 0.3 }
        } : {}}
      >
        {/* Shimmer Effect on Hover */}
        {isClickable && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%', opacity: 0 }}
            whileHover={{ 
              x: '100%', 
              opacity: 1,
              transition: { duration: 0.6, ease: "easeInOut" }
            }}
            style={{ transform: 'skewX(-15deg)' }}
          />
        )}
        {/* Progress Ring for in_progress status */}
        {status === 'in_progress' && progress > 0 && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2"
                strokeDasharray={`${progress} ${100 - progress}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        
        {/* Stop Number or Icon */}
        <motion.div 
          className="relative z-10"
          whileHover={isClickable ? {
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.5, ease: "easeInOut" }
          } : {}}
        >
          {status === 'locked' ? (
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              {getStatusIcon()}
            </motion.div>
          ) : status === 'completed' ? (
            <motion.div
              whileHover={{
                scale: [1, 1.2, 1],
                transition: { duration: 0.3 }
              }}
            >
              {getStatusIcon()}
            </motion.div>
          ) : status === 'in_progress' ? (
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              whileHover={{
                rotate: 360,
                transition: { duration: 0.6, ease: "easeInOut" }
              }}
            >
              {getStatusIcon()}
            </motion.div>
          ) : (
            <motion.span 
              className="text-white font-bold text-lg"
              whileHover={{
                scale: [1, 1.3, 1],
                transition: { duration: 0.3 }
              }}
            >
              {stopNumber}
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      {/* Stop Title */}
      <motion.div 
        className="text-center max-w-24"
        whileHover={isClickable ? {
          y: -2,
          transition: { duration: 0.2 }
        } : {}}
      >
        <motion.h4 
          className={`
            text-sm font-medium leading-tight transition-colors duration-200
            ${status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}
            ${isClickable ? 'group-hover:text-primary' : ''}
          `}
          whileHover={isClickable ? {
            scale: 1.05,
            transition: { duration: 0.2 }
          } : {}}
        >
          {title}
        </motion.h4>
        {isPersonalized && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 }
            }}
          >
            <Badge variant="secondary" className="mt-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200">
              <Target className="w-2 h-2 mr-1" />
              Focus
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SimplePathStop;