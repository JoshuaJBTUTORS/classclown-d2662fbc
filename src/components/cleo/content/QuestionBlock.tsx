import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionBlockProps {
  data: QuestionContent;
  onAnswer: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
  isExamPractice?: boolean;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({ data, onAnswer, onAskHelp, isExamPractice }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Development mode debugging
  if (import.meta.env.DEV) {
    console.log('QuestionBlock data:', {
      dataType: typeof data,
      hasQuestion: !!data?.question,
      hasOptions: !!data?.options,
      optionsCount: Array.isArray(data?.options) ? data.options.length : 0,
      hasExplanation: !!data?.explanation,
      rawData: data
    });
  }

  // Defensive check for undefined data
  if (!data || !data.question || !data.options || !Array.isArray(data.options)) {
    console.error('QuestionBlock: Invalid data structure:', { 
      hasData: !!data,
      hasQuestion: !!(data?.question),
      hasOptions: !!(data?.options),
      isOptionsArray: Array.isArray(data?.options),
      actualData: data 
    });
    
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Question content not available</p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Debug Info (Development Only)
            </summary>
            <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  const handleAnswerClick = (optionId: string, isCorrect: boolean) => {
    setSelectedAnswer(optionId);
    setShowFeedback(true);
    onAnswer(data.id, optionId, isCorrect);
  };

  const getOptionClassName = (optionId: string, isCorrect: boolean) => {
    if (!showFeedback) {
      return 'border-border hover:border-primary hover:bg-primary/5';
    }

    if (selectedAnswer === optionId) {
      return isCorrect
        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
        : 'border-red-500 bg-red-50 dark:bg-red-900/20';
    }

    if (isCorrect && showFeedback) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    }

    return 'border-border opacity-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="cleo-question-card">
        <div className="cleo-question-text">{data.question}</div>

        <div className="cleo-answers">
          {data.options.map((option, index) => {
            const optionId = option.id || `option-${index}`;
            const isSelected = selectedAnswer === optionId;
            const className = showFeedback && isSelected
              ? option.isCorrect
                ? 'cleo-answer-btn selected-correct'
                : 'cleo-answer-btn selected-incorrect'
              : 'cleo-answer-btn';
            
            return (
              <button
                key={optionId}
                onClick={() => handleAnswerClick(optionId, option.isCorrect)}
                disabled={showFeedback}
                className={className}
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {!selectedAnswer && isExamPractice && onAskHelp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <button
              onClick={() => onAskHelp(data.id, data.question)}
              className="cleo-pill-btn w-full justify-center"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Cleo for Help</span>
            </button>
          </motion.div>
        )}

        {showFeedback && data.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4 p-4 bg-white rounded-lg"
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'hsl(var(--cleo-green))' }}>
              Explanation:
            </p>
            <p className="text-sm" style={{ color: 'hsl(var(--cleo-text-main))' }}>
              {data.explanation}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
