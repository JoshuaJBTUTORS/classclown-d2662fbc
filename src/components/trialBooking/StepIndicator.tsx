import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted
                      ? 'bg-foreground border-foreground text-background shadow-[0_2px_0_0_hsl(var(--foreground)/0.25)]'
                      : isCurrent
                      ? 'bg-pastel-sky border-foreground text-foreground shadow-[0_2px_0_0_hsl(var(--foreground)/0.25)]'
                      : 'bg-background border-border text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-[11px] uppercase tracking-[0.14em] font-semibold',
                    isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {index < stepLabels.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-[2px] mx-3 sm:mx-5 rounded-full -mt-6',
                    isCompleted ? 'bg-foreground/70' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
