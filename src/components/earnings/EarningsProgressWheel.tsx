import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EarningsProgressWheelProps {
  currentEarnings: number;
  goalAmount: number;
  progressPercentage: number;
  className?: string;
}

export const EarningsProgressWheel = ({ 
  currentEarnings, 
  goalAmount, 
  progressPercentage, 
  className 
}: EarningsProgressWheelProps) => {
  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  const isOverGoal = currentEarnings > goalAmount && goalAmount > 0;
  const displayPercentage = Math.min(progressPercentage, 100);
  
  // Color logic based on progress
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'hsl(var(--success))';
    if (progressPercentage >= 75) return 'hsl(var(--warning))';
    if (progressPercentage >= 50) return 'hsl(var(--primary))';
    return 'hsl(var(--destructive))';
  };

  return (
    <Card className={cn("animate-scale-in", className)}>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <div className="relative w-40 h-40 mb-4">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              stroke="hsl(var(--muted))"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress circle */}
            <circle
              stroke={getProgressColor()}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={{ 
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease-in-out'
              }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(displayPercentage)}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Progress
            </div>
          </div>
        </div>
        
        {/* Earnings display */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-foreground">
            £{currentEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            of £{goalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal
          </div>
          {isOverGoal && (
            <div className="text-sm font-medium text-success">
              🎉 Goal exceeded by £{(currentEarnings - goalAmount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};