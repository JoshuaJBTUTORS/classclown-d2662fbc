import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X, HelpCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CoinAnimation } from '@/components/cleo/CoinAnimation';
import { LatexRenderer } from './LatexRenderer';

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
  if (!data || !data.question) {
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

  // Check if this is an essay question (English Literature style)
  const isEssayQuestion = !data.options && (data.marks || data.successCriteria);

  if (isEssayQuestion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="p-6 bg-background/5 backdrop-blur-sm border-primary/20">
          <div className="flex items-start gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">
                <LatexRenderer content={data.question} />
              </h4>
              {data.marks && (
                <p className="text-sm text-muted-foreground">[{data.marks} marks]</p>
              )}
            </div>
          </div>

          <div className="space-y-4 mt-4">
            {data.assessmentObjectives && data.assessmentObjectives.length > 0 && (
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">Assessment Objectives:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.assessmentObjectives.map((ao, i) => (
                    <li key={i}>• {ao}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.themesFocus && data.themesFocus.length > 0 && (
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">Themes to Consider:</p>
                <div className="flex flex-wrap gap-2">
                  {data.themesFocus.map((theme, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data.textReferences && data.textReferences.length > 0 && (
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">Key Text References:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.textReferences.map((ref, i) => (
                    <li key={i}>• {ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.successCriteria && data.successCriteria.length > 0 && (
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-2">Success Criteria:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {data.successCriteria.map((criteria, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.planningPrompts && data.planningPrompts.length > 0 && (
              <div className="bg-background/50 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">Planning Prompts:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {data.planningPrompts.map((prompt, i) => (
                    <li key={i}>• {prompt}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.exampleParagraph && (
              <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                <p className="text-sm font-medium text-foreground mb-2">Example Response:</p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  <LatexRenderer content={data.exampleParagraph} />
                </p>
              </div>
            )}

            {data.explanation && (
              <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary/50">
                <p className="text-sm font-medium text-foreground mb-2">Guidance:</p>
                <p className="text-sm text-muted-foreground">
                  <LatexRenderer content={data.explanation} />
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Multiple choice question rendering
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      {showCoinAnimation && (
        <div className="absolute inset-0 pointer-events-none">
          <CoinAnimation show={true} />
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground mb-2">
          <LatexRenderer content={data.question} />
        </h3>
      </div>

      <div className="space-y-2">
        {data.options?.map((option) => {
          const isOptionSelected = selectedAnswer === option.id;
          const optionClassName = getOptionClassName(option.id, option.isCorrect);

          return (
            <button
              key={option.id}
              onClick={() => handleAnswerClick(option.id, option.isCorrect)}
              disabled={showFeedback}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${optionClassName} ${
                showFeedback ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-1">
                  <LatexRenderer content={option.text} />
                </span>
                {showFeedback && (
                  <>
                    {option.isCorrect ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : isOptionSelected ? (
                      <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                    ) : null}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showFeedback && data.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-4 p-4 bg-muted/50 rounded-lg"
        >
          <p className="text-sm text-muted-foreground">
            <LatexRenderer content={data.explanation} />
          </p>
        </motion.div>
      )}

      {onAskHelp && !showFeedback && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={() => onAskHelp(data.id, data.question)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Ask Cleo for Help
          </Button>
        </div>
      )}
    </motion.div>
  );
};
