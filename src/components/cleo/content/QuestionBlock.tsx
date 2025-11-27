import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { QuestionContent } from '@/types/lessonContent';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoinAnimation } from '@/components/cleo/CoinAnimation';
import { LatexRenderer } from '../LatexRenderer';

interface QuestionBlockProps {
  data: QuestionContent;
  onAnswer: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onAskHelp?: (questionId: string, questionText: string) => void;
  subject?: string;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({ data, onAnswer, onAskHelp, subject }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [isSubmittingText, setIsSubmittingText] = useState(false); // Loading state for text submission

  // Defensive check for undefined data
  if (!data || !data.question) {
    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Question content not available</p>
      </div>
    );
  }

  // Determine question type - default to multiple_choice if not specified
  const questionType = data.question_type || 'multiple_choice';
  const isTextInput = questionType === 'short_answer' || questionType === 'extended_writing' || questionType === 'calculation';

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

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) return;
    
    setIsSubmittingText(true); // Show loading state
    
    // Check if this is an English subject - skip keyword matching for English
    const isEnglishSubject = subject?.toLowerCase().includes('english');
    
    let isCorrect = false;
    let matched: string[] = [];
    
    // For English: skip keyword matching, let Cleo evaluate verbally
    if (isEnglishSubject) {
      isCorrect = true; // Default to true, Cleo provides verbal feedback
      matched = []; // Don't evaluate keywords
    } else if (data.keywords && data.keywords.length > 0) {
      // For other subjects: use keyword matching
      const answerLower = textAnswer.toLowerCase();
      matched = data.keywords.filter(kw => 
        answerLower.includes(kw.toLowerCase())
      );
      const threshold = Math.ceil(data.keywords.length * 0.5);
      isCorrect = matched.length >= threshold;
    } else {
      isCorrect = true;
    }
    
    setShowFeedback(true);
    setMatchedKeywords(matched);
    
    // Only show coin animation if actually correct
    if (isCorrect) {
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 1500);
    }
    
    onAnswer(data.id, textAnswer, isCorrect);
    
    // Keep loading state until Cleo responds (simulated with timeout)
    setTimeout(() => setIsSubmittingText(false), 2000);
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
        
        {/* Exam date header - like real past papers */}
        {data.examDate && (
          <div className="exam-paper-date">
            {data.examDate}
          </div>
        )}
        
        {/* Right margin stripe - "DO NOT WRITE IN THIS AREA" */}
        <div className="exam-margin-stripe">
          <span>DO NOT WRITE IN THIS AREA</span>
        </div>

        {/* Question row with inline number */}
        <div className="exam-question-row">
          <span className="exam-question-number">
            {data.questionNumber || '1'}
          </span>
          <div className="exam-question-text">
            <LatexRenderer content={data.question} />
          </div>
        </div>

        {/* Assessment Objective badge */}
        {data.assessmentObjective && (
          <div className="exam-ao-badge">
            📋 {data.assessmentObjective}
          </div>
        )}

        {/* Multiple Choice Options (A, B, C, D) */}
        {!isTextInput && data.options && data.options.length > 0 && (
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
        )}

        {/* Text Input Answer Space (for short_answer, extended_writing, calculation) */}
        {isTextInput && (
          <div className="exam-text-input-section">
            {/* Dotted lines for writing simulation */}
            <div className="exam-dotted-lines">
              {Array.from({ length: data.answerLines || (questionType === 'extended_writing' ? 8 : 4) }).map((_, i) => (
                <div key={i} className="exam-dotted-line"></div>
              ))}
            </div>

            {/* Answer textarea */}
            {!showFeedback && (
              <div className="exam-answer-box">
                <label className="text-sm font-semibold mb-2 block text-gray-700">
                  Your answer:
                </label>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="exam-answer-textarea"
                  rows={questionType === 'extended_writing' ? 8 : 4}
                  placeholder="Type your answer here..."
                />
                <Button 
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim() || isSubmittingText}
                  className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isSubmittingText ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              </div>
            )}
            
            {/* Loading State - Cleo is reviewing */}
            {showFeedback && isSubmittingText && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cleo is reviewing your answer...
              </div>
            )}

            {/* Show submitted answer after feedback */}
            {showFeedback && textAnswer && (
              <div className="exam-answer-box mt-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 p-4 rounded">
                <p className="text-sm font-semibold mb-2 text-green-700">
                  Your submitted answer:
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{textAnswer}</p>
              </div>
            )}

            {/* Keywords Feedback Section - Only for non-English subjects */}
            {showFeedback && data.keywords && data.keywords.length > 0 && !subject?.toLowerCase().includes('english') && (
              <div className="exam-keywords-box mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 p-3 rounded">
                <p className="text-sm font-semibold mb-2 text-blue-700">
                  Mark Scheme Keywords ({matchedKeywords.length}/{data.keywords.length} matched):
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.keywords.map((keyword, idx) => {
                    const isMatched = matchedKeywords.includes(keyword);
                    return (
                      <span 
                        key={idx} 
                        className={`text-xs px-2 py-1 rounded ${
                          isMatched 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800 line-through'
                        }`}
                      >
                        {keyword} {isMatched ? '✓' : '✗'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marks footer - "Total for Question X is X marks" */}
        {data.marks && (
          <div className="exam-marks-footer">
            <span>
              (Total for Question {data.questionNumber || '1'} is {data.marks} {data.marks === 1 ? 'mark' : 'marks'})
            </span>
          </div>
        )}

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
