import React from 'react';
import { LessonStep } from '@/types/lessonContent';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompactStepIndicatorProps {
  steps: LessonStep[];
  currentStep: number;
  completedSteps: string[];
}

export const CompactStepIndicator: React.FC<CompactStepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
}) => {
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  return (
    <div className="flex items-center gap-3">
      {/* Mobile: Just numbers */}
      <div className="md:hidden text-sm font-medium text-muted-foreground">
        {currentStep + 1}/{totalSteps}
      </div>

      {/* Desktop: Full display */}
      <div className="hidden md:flex items-center gap-3">
        {/* Step indicators */}
        <div className="flex items-center gap-1.5">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;

            return (
              <motion.div
                key={step.id}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-200
                    ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : isPast
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted/50 text-muted-foreground/50'
                    }
                  `}
                  title={step.title}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.order}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current step info */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          {currentStepData && (
            <span className="text-sm font-medium text-foreground line-clamp-1">
              {currentStepData.title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
