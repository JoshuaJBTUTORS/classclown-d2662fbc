import React from 'react';
import { motion } from 'framer-motion';
import { WorkedExampleContent } from '@/types/lessonContent';

interface WorkedExampleBlockProps {
  data: WorkedExampleContent;
}

export const WorkedExampleBlock: React.FC<WorkedExampleBlockProps> = ({ data }) => {
  // Defensive check for invalid data
  if (!data || !data.problem || !data.steps || data.steps.length === 0) {
    if (import.meta.env.DEV) {
      console.error('WorkedExampleBlock received invalid data:', {
        data,
        hasData: !!data,
        hasProblem: data?.problem,
        hasSteps: data?.steps,
        stepsLength: data?.steps?.length
      });
    }
    
    return (
      <div className="cleo-content-card bg-destructive/10 border-destructive/30">
        <p className="text-sm font-medium text-destructive mb-1">Worked example formatting error</p>
        <p className="text-xs text-muted-foreground">
          This lesson has a formatting issue. Please try regenerating the lesson.
        </p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cleo-content-card"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Worked Example</h3>
        <p className="text-base font-medium p-4 bg-cream-light rounded-lg">
          {data.problem}
        </p>
      </div>

      <div className="space-y-4">
        {data.steps.map((step, index) => (
          <motion.div
            key={step.step_number}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cleo-green text-white flex items-center justify-center font-bold">
              {step.step_number}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{step.explanation}</p>
              {step.calculation && (
                <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-cleo-green">
                  <code className="text-base font-mono">{step.calculation}</code>
                </div>
              )}
              {step.visual_note && (
                <p className="text-xs italic text-muted-foreground mt-2">
                  💡 {step.visual_note}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-cleo-mint/20 rounded-lg border-l-4 border-cleo-green">
        <p className="text-sm font-medium text-cleo-green">Key Technique:</p>
        <p className="text-sm mt-1">{data.key_technique}</p>
      </div>
    </motion.div>
  );
};
