
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  current?: number;
  total?: number;
  progress?: number; // Progress as percentage (0-100)
  label?: string;
  showPercentage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  progress,
  label, 
  showPercentage = true,
  className = '',
  size = 'md'
}) => {
  // Calculate percentage from current/total or use direct progress value
  const percentage = progress !== undefined 
    ? Math.min(Math.max(progress, 0), 100) // Ensure progress is between 0-100
    : total && total > 0 
      ? Math.round((current || 0) / total * 100) 
      : 0;

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{label}</span>
          {showPercentage && (
            <span className="text-gray-500">
              {current !== undefined && total !== undefined 
                ? `${current}/${total} (${percentage}%)`
                : `${percentage}%`
              }
            </span>
          )}
        </div>
      )}
      <Progress value={percentage} className={sizeClasses[size]} />
    </div>
  );
};

export default ProgressBar;
