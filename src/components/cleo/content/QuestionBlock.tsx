import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoinAnimation } from '@/components/cleo/CoinAnimation';
import { LatexRenderer } from '../LatexRenderer';

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
      <div className="exam-question-paper relative">
        {/* Coin animation overlay */}
        {showCoinAnimation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <CoinAnimation show={showCoinAnimation} />
          </div>
        )}
        
        {/* Question Header with number and marks */}
        <div className="exam-question-header">
          <span className="exam-question-number">
            {data.questionNumber ? `${data.questionNumber}.` : 'Question'}
          </span>
          {data.marks && (
            <span className="exam-marks-badge">[{data.marks} {data.marks === 1 ? 'mark' : 'marks'}]</span>
          )}
        </div>

        {/* Question text */}
        <div className="exam-question-text">
          <LatexRenderer content={data.question} />
        </div>

        {/* Assessment Objective badge */}
        {data.assessmentObjective && (
          <div className="exam-ao-badge">
            📋 {data.assessmentObjective}
          </div>
        )}

        {/* Options as A, B, C, D */}
        <div className="exam-options-list">
          {data.options.map((option, index) => {
            const optionId = option.id || `option-${index}`;
            const isSelected = selectedAnswer === optionId;
            const letter = String.fromCharCode(65 + index); // A, B, C, D
            
            let className = 'exam-option-row';
            if (showFeedback) {
              if (isSelected && option.isCorrect) {
                className += ' selected-correct';
              } else if (isSelected && !option.isCorrect) {
                className += ' selected-incorrect';
              } else if (option.isCorrect) {
                className += ' correct-answer';
              }
            }
            
            return (
              <button
                key={optionId}
                onClick={() => handleAnswerClick(optionId, option.isCorrect)}
                disabled={showFeedback}
                className={className}
              >
                <span className="exam-option-letter">{letter}</span>
                <span className="exam-option-text">
                  <LatexRenderer content={option.text} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showFeedback && data.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="exam-explanation-box"
          >
            <p className="text-sm font-semibold mb-2 text-green-700">
              Explanation:
            </p>
            <div className="text-sm text-gray-800">
              <LatexRenderer content={data.explanation} />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
