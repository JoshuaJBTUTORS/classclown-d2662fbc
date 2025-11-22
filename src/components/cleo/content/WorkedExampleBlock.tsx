import React from 'react';
import { motion } from 'framer-motion';
import { WorkedExampleContent } from '@/types/lessonContent';
import { Calculator } from 'lucide-react';
import { ContentActionButtons } from './ContentActionButtons';

interface WorkedExampleBlockProps {
  data: WorkedExampleContent;
  onContentAction?: (action: string, message: string) => void;
}

export const WorkedExampleBlock: React.FC<WorkedExampleBlockProps> = ({ data, onContentAction }) => {
  // Defensive check for undefined data
  if (!data || !data.question || !data.steps || data.steps.length === 0) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Worked example content not available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/20 dark:to-teal-950/20 border-l-4 border-blue-400 dark:border-blue-600 rounded-r-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-semibold text-foreground">Worked Example</h4>
                {data.examContext && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    {data.examContext}
                  </span>
                )}
              </div>
              <p className="text-base text-foreground font-medium leading-relaxed">
                {data.question}
              </p>
            </div>

            <div className="space-y-4 mb-4">
              {data.steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-blue-500 dark:bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-foreground mb-1">{step.title}</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      {step.explanation}
                    </p>
                    {step.workShown && (
                      <div className="bg-background/70 dark:bg-background/50 rounded-md p-3 border border-border">
                        <pre className="text-sm font-mono text-foreground whitespace-pre-wrap">
                          {step.workShown}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 dark:border-green-600 rounded-r-md p-4 mb-4">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Final Answer:</p>
              <p className="text-base font-bold text-green-900 dark:text-green-200">{data.finalAnswer}</p>
            </div>

            {data.examTips && data.examTips.length > 0 && (
              <div className="bg-background/50 rounded-md p-4 mb-4">
                <p className="text-sm font-semibold text-primary mb-2">Exam Tips:</p>
                <ul className="space-y-1">
                  {data.examTips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {onContentAction && (
              <ContentActionButtons
                contentId={`worked-example-${data.question.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`}
                contentTitle="this worked example"
                onActionClick={onContentAction}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
