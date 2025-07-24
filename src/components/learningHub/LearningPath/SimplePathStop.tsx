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
      className="flex flex-col items-center space-y-3"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: stopNumber * 0.1 }}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
    >
      {/* Stop Circle */}
      <div
        className={`
          relative w-16 h-16 rounded-full border-2 flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${getStopStyles()}
          ${isActive ? 'ring-4 ring-primary/30 ring-offset-2' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
      >
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
        <div className="relative z-10">
          {status === 'locked' ? (
            getStatusIcon()
          ) : status === 'completed' || status === 'in_progress' ? (
            getStatusIcon()
          ) : (
            <span className="text-white font-bold text-lg">{stopNumber}</span>
          )}
        </div>
      </div>

      {/* Stop Title */}
      <div className="text-center max-w-24">
        <h4 className={`
          text-sm font-medium leading-tight
          ${status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}
        `}>
          {title}
        </h4>
        {isPersonalized && (
          <Badge variant="secondary" className="mt-1 text-xs bg-primary/10 text-primary hover:bg-primary/20">
            <Target className="w-2 h-2 mr-1" />
            Focus
          </Badge>
        )}
      </div>
    </motion.div>
  );
};

export default SimplePathStop;