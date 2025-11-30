
import React from 'react';
import { Clock } from 'lucide-react';

interface AssessmentTimerProps {
  timeRemaining: number | null;
  hasTimeLimit: boolean;
}

const AssessmentTimer: React.FC<AssessmentTimerProps> = ({
  timeRemaining,
  hasTimeLimit
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center text-sm text-muted-foreground">
      {hasTimeLimit && timeRemaining !== null ? (
        <>
          <Clock className="mr-2 h-4 w-4" />
          Time Remaining: {formatTime(timeRemaining)}
        </>
      ) : (
        <span>No time limit</span>
      )}
    </div>
  );
};

export default AssessmentTimer;
