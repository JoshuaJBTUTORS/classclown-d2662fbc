import React from 'react';
import { LessonStep } from '@/types/lessonContent';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface LessonProgressBarProps {
  steps: LessonStep[];
  currentStep: number;
  completedSteps: string[];
}

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({
  steps,
  currentStep,
  completedSteps,
}) => {
  return (
    <div className="w-full bg-card border-b border-border py-6 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const isPast = index < currentStep;

            return (
              <div key={step.id} className="contents">
                {/* Step Indicator */}
                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300
                      ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : isPast
                          ? 'bg-primary/50 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.order
                    )}
                  </motion.div>
                  <div className="text-center">
                    <p
                      className={`
                        text-xs font-medium line-clamp-2
                        ${
                          isActive
                            ? 'text-primary'
                            : isPast || isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      `}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      h-0.5 flex-shrink-0 w-12 transition-all duration-300
                      ${
                        isPast || isCompleted
                          ? 'bg-primary'
                          : 'bg-muted'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
