import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeachingStep {
  id: string;
  title: string;
  duration_minutes?: number;
}

interface CompactStepIndicatorProps {
  teachingSequence: TeachingStep[];
  currentStepId?: string;
  completedSteps: string[];
}

export const CompactStepIndicator: React.FC<CompactStepIndicatorProps> = ({
  teachingSequence,
  currentStepId,
  completedSteps,
}) => {
  // Handle empty or invalid teaching sequence
  if (!teachingSequence || teachingSequence.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-muted-foreground">
          Step 1 of 1
        </div>
      </div>
    );
  }

  const totalSteps = teachingSequence.length;
  const currentStepIndex = teachingSequence.findIndex(s => s.id === currentStepId);
  const currentStepData = teachingSequence[currentStepIndex] || teachingSequence[0];

  return (
    <div className="flex items-center gap-3">
      {/* Mobile: Just numbers */}
      <div className="md:hidden text-sm font-medium text-muted-foreground">
        {currentStepIndex >= 0 ? currentStepIndex + 1 : 1}/{totalSteps}
      </div>

      {/* Desktop: Full display */}
      <div className="hidden md:flex items-center gap-3">
        {/* Step indicators */}
        <div className="flex items-center gap-1.5">
          {teachingSequence.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStepId;
            const isPast = currentStepIndex >= 0 && index < currentStepIndex;

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
                    <span>{index + 1}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current step info */}
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            Step {currentStepIndex >= 0 ? currentStepIndex + 1 : 1} of {totalSteps}
          </span>
          {currentStepData && (
            <span className="text-sm font-medium text-foreground line-clamp-1 max-w-[200px]">
              {currentStepData.title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
