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
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  const isOverGoal = currentEarnings > goalAmount && goalAmount > 0;
  const displayPercentage = Math.min(progressPercentage, 100);
  
  // Color logic based on progress, mapped to design tones
  const getProgressColor = () => {
    if (progressPercentage >= 100) return 'hsl(var(--success))';
    if (progressPercentage >= 75) return 'hsl(40 90% 55%)';
    if (progressPercentage >= 50) return 'hsl(var(--primary))';
    return 'hsl(15 70% 60%)';
  };

  return (
    <section
      className={cn(
        'animate-scale-in rounded-[var(--radius-soft)] border border-foreground/15 bg-pastel-mint/40 shadow-[var(--shadow-soft)]',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative mb-4 h-40 w-40">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="-rotate-90 transform"
          >
            {/* Background circle */}
            <circle
              stroke="hsl(var(--foreground) / 0.08)"
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
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {Math.round(displayPercentage)}%
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Progress
            </div>
          </div>
        </div>
        
        {/* Earnings display */}
        <div className="space-y-1 text-center">
          <div className="font-heading text-3xl font-extrabold tracking-tight text-foreground">
            £{currentEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground">
            of £{goalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal
          </div>
          {isOverGoal && (
            <div className="mt-2 inline-block rounded-full border border-foreground/15 bg-pastel-mint px-3 py-1 text-xs font-semibold text-foreground">
              🎉 Goal exceeded by £{(currentEarnings - goalAmount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
