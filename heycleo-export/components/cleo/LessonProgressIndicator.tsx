import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonProgressIndicatorProps {
  totalSteps: number;
  completedSteps: string[] | number[];
  activeStep: number;
  className?: string;
}

export const LessonProgressIndicator: React.FC<LessonProgressIndicatorProps> = ({
  totalSteps,
  completedSteps,
  activeStep,
  className,
}) => {
  const completedCount = Array.isArray(completedSteps) ? completedSteps.length : 0;
  const completionPercentage = totalSteps > 0 
    ? Math.round((completedCount / totalSteps) * 100) 
    : 0;

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm", className)}>
      {/* Circular Progress Ring */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
            className="transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Steps Info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {completedCount}/{totalSteps} Steps
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          {Array.from({ length: Math.min(totalSteps, 8) }).map((_, i) => {
            const isCompleted = typeof completedSteps[0] === 'number' 
              ? (completedSteps as number[]).includes(i)
              : (completedSteps as string[]).includes(i.toString());
            const isActive = activeStep === i;
            
            return (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isCompleted ? "w-3 bg-primary" : isActive ? "w-4 bg-primary/60" : "w-2 bg-muted"
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Completion Badge */}
      {completionPercentage === 100 && (
        <div className="ml-auto animate-scale-in">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
            <Check className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Complete</span>
          </div>
        </div>
      )}
    </div>
  );
};