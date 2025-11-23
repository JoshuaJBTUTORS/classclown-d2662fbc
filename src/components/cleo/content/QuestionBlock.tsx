import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoinAnimation } from '@/components/cleo/CoinAnimation';

interface QuestionBlockProps {
  data: QuestionContent;
  onAnswer: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({ data, onAnswer, onAskHelp }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  // Defensive check for undefined data
  if (!data || !data.question || !data.options || !Array.isArray(data.options)) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Question content not available</p>
      </div>
    );
  }

  const handleAnswerClick = (optionId: string, isCorrect: boolean) => {
    setSelectedAnswer(optionId);
    setShowFeedback(true);
    
    // Trigger coin animation for correct answers
    if (isCorrect) {
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1500);
    }
    
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
      <div className="cleo-question-card relative">
        {/* Coin animation overlay */}
        {showCoinAnimation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <CoinAnimation show={showCoinAnimation} />
          </div>
        )}
        
        <div className="cleo-question-text">{data.question}</div>

        {data.assessmentObjective && (
          <div className="mt-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              📋 {data.assessmentObjective}
            </span>
          </div>
        )}

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
