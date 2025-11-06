import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionBlockProps {
  data: QuestionContent;
  onAnswer: (questionId: string, answerId: string, isCorrect: boolean) => void;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({ data, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

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
      <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-indigo-100 dark:border-indigo-900 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">❓</span>
            <h3 className="text-xl font-semibold text-foreground">
              {data.question}
            </h3>
          </div>
        </div>

        <div className="space-y-3">
          {data.options.map((option) => (
            <Button
              key={option.id}
              onClick={() => handleAnswerClick(option.id, option.isCorrect)}
              disabled={showFeedback}
              variant="outline"
              className={`w-full justify-start text-left h-auto py-4 px-5 transition-all ${getOptionClassName(
                option.id,
                option.isCorrect
              )}`}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                  {option.id.toUpperCase()}
                </span>
                <span className="flex-1 text-base">{option.text}</span>
                {showFeedback && selectedAnswer === option.id && (
                  <span className="flex-shrink-0">
                    {option.isCorrect ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <X className="w-6 h-6 text-red-600" />
                    )}
                  </span>
                )}
                {showFeedback && option.isCorrect && selectedAnswer !== option.id && (
                  <span className="flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>

        {showFeedback && data.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-6 p-4 bg-muted rounded-lg"
          >
            <p className="text-sm font-medium text-primary mb-2">Explanation:</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.explanation}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
