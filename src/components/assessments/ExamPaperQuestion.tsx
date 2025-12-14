import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LatexRenderer } from '@/components/cleo/LatexRenderer';
import { CoinAnimation } from '@/components/cleo/CoinAnimation';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: string;
  marks_available: number;
  correct_answer: string;
  marking_scheme: any;
  position: number;
  question_number: number;
  image_url?: string;
  keywords?: string[];
}

interface AIMarkingResult {
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface ExamPaperQuestionProps {
  question: AssessmentQuestion;
  questionIndex: number;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  onMark: (questionId: string) => void;
  isMarking: boolean;
  isMarked: boolean;
  feedback?: any;
  subject?: string;
  examBoard?: string;
  disabled?: boolean;
}

export const ExamPaperQuestion: React.FC<ExamPaperQuestionProps> = ({
  question,
  questionIndex,
  studentAnswer,
  onAnswerChange,
  onMark,
  isMarking,
  isMarked,
  feedback,
  subject,
  examBoard,
  disabled = false,
}) => {
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [markingResult, setMarkingResult] = useState<AIMarkingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle escape key to close expanded view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isExpanded]);

  const isTextInput = question.question_type === 'short_answer' || 
                      question.question_type === 'extended_writing' || 
                      question.question_type === 'calculation' ||
                      question.question_type === 'free_response';

  // Parse marking_scheme for multiple choice options
  const getOptions = (): { id: string; text: string; isCorrect: boolean }[] => {
    if (question.question_type === 'multiple_choice' && question.marking_scheme) {
      const scheme = typeof question.marking_scheme === 'string' 
        ? JSON.parse(question.marking_scheme) 
        : question.marking_scheme;
      
      if (scheme.options) {
        return scheme.options.map((opt: any, idx: number) => ({
          id: opt.id || `option-${idx}`,
          text: opt.text || opt,
          isCorrect: opt.isCorrect || opt.text === question.correct_answer || opt === question.correct_answer,
        }));
      }
    }
    return [];
  };

  const options = getOptions();

  const handleAnswerSelect = (optionId: string) => {
    if (disabled || isMarked) return;
    onAnswerChange(question.id, optionId);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled || isMarked) return;
    onAnswerChange(question.id, e.target.value);
  };

  const handleSubmit = async () => {
    if (!studentAnswer.trim() || isMarking || isMarked) return;
    
    setIsSubmitting(true);
    
    try {
      // For text input, use AI marking
      if (isTextInput) {
        const { data: result, error } = await supabase.functions.invoke('ai-mark-cleo-question', {
          body: {
            questionText: question.question_text,
            studentAnswer: studentAnswer,
            questionType: question.question_type,
            marks: question.marks_available,
            keywords: question.keywords,
            subject: subject || 'General',
            examBoard: examBoard,
            correctAnswer: question.correct_answer,
          }
        });

        if (!error && result) {
          setMarkingResult(result);
          if (result.marksAwarded >= Math.ceil(result.maxMarks * 0.5)) {
            setShowCoinAnimation(true);
            setTimeout(() => setShowCoinAnimation(false), 1500);
          }
        }
      } else {
        // For multiple choice, check if correct
        const selectedOption = options.find(o => o.id === studentAnswer);
        if (selectedOption?.isCorrect) {
          setShowCoinAnimation(true);
          setTimeout(() => setShowCoinAnimation(false), 1500);
        }
      }
      
      onMark(question.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnswerLines = () => {
    if (question.question_type === 'extended_writing') return 10;
    if (question.question_type === 'calculation') return 6;
    return 4;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: questionIndex * 0.1 }}
      className="relative"
    >
      <div className="exam-question-paper">
        {/* Coin animation overlay */}
        {showCoinAnimation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <CoinAnimation show={showCoinAnimation} />
          </div>
        )}

        {/* Right margin stripe */}
        <div className="exam-margin-stripe">
          <span>DO NOT WRITE IN THIS AREA</span>
        </div>

        {/* Question row with inline number */}
        <div className="exam-question-row">
          <span className="exam-question-number">
            {question.question_number || questionIndex + 1}
          </span>
          <div className="exam-question-text">
            <LatexRenderer content={question.question_text} />
          </div>
        </div>

        {/* Question Image */}
        {question.image_url && (
          <div className="ml-9 mb-4">
            <img 
              src={question.image_url} 
              alt={`Question ${questionIndex + 1} diagram`}
              className="max-w-full h-auto border border-gray-200"
            />
          </div>
        )}

        {/* Multiple Choice Options */}
        {!isTextInput && options.length > 0 && (
          <div className="exam-options-list">
            {options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = studentAnswer === option.id;
              
              let className = 'exam-option-row';
              if (isMarked) {
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
                  key={option.id}
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={disabled || isMarked}
                  className={className}
                >
                  <span className={`exam-option-letter ${isSelected ? 'bg-primary text-white' : ''}`}>
                    {letter}
                  </span>
                  <span className="exam-option-text">
                    <LatexRenderer content={option.text} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Text Input Answer Space */}
        {isTextInput && (
          <div className="exam-text-input-section">
            {/* Dotted lines for writing simulation */}
            <div className="exam-dotted-lines">
              {Array.from({ length: getAnswerLines() }).map((_, i) => (
                <div key={i} className="exam-dotted-line"></div>
              ))}
            </div>

            {/* Answer textarea */}
            <div className="exam-answer-box">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Your answer:
                </label>
                {!disabled && !isMarked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    Expand
                  </Button>
                )}
              </div>
              <textarea
                value={studentAnswer}
                onChange={handleTextChange}
                className="exam-answer-textarea font-handwriting"
                rows={getAnswerLines()}
                placeholder="Type your answer here..."
                disabled={disabled || isMarked}
              />
            </div>

            {/* AI Marking Result */}
            {isMarked && markingResult && (
              <div className="mt-4 p-4 bg-white border border-border rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold">
                    {markingResult.marksAwarded}/{markingResult.maxMarks} marks
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    markingResult.marksAwarded === markingResult.maxMarks 
                      ? 'bg-green-100 text-green-800' 
                      : markingResult.isCorrect 
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {markingResult.marksAwarded === markingResult.maxMarks 
                      ? '✨ Full marks!' 
                      : markingResult.isCorrect 
                        ? '👍 Good effort' 
                        : '📚 Keep practicing'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{markingResult.feedback}</p>
                
                {markingResult.strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-green-700 mb-1">✓ Strengths:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {markingResult.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                
                {markingResult.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">→ To improve:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {markingResult.improvements.map((imp, i) => <li key={i}>• {imp}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Expanded Editor */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setIsExpanded(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <div>
                    <h3 className="font-semibold">
                      Question {question.question_number || questionIndex + 1}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {question.marks_available} marks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                    >
                      <Minimize2 className="w-4 h-4 mr-1" />
                      Minimize
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Question text */}
                <div className="p-4 border-b bg-gray-50/50 max-h-32 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-1">Question:</p>
                  <div className="text-sm">
                    <LatexRenderer content={question.question_text} />
                  </div>
                </div>

                {/* Expanded textarea */}
                <div className="flex-1 p-4">
                  <textarea
                    value={studentAnswer}
                    onChange={handleTextChange}
                    className="w-full h-full resize-none border-2 border-gray-200 rounded-lg p-4 font-handwriting text-xl leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Write your answer here..."
                    disabled={disabled || isMarked}
                    autoFocus
                  />
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {studentAnswer.length} characters • Press Escape to close
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsExpanded(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Answer Button */}
        {!disabled && !isMarked && (
          <div className="mt-4 ml-9">
            <Button 
              onClick={handleSubmit}
              disabled={!studentAnswer.trim() || isMarking || isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isMarking || isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Marking...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        )}

        {/* Marks footer */}
        <div className="exam-marks-footer">
          <span>
            (Total for Question {question.question_number || questionIndex + 1} is {question.marks_available} {question.marks_available === 1 ? 'mark' : 'marks'})
          </span>
        </div>

        {/* Show correct answer after marking for MCQ */}
        {isMarked && !isTextInput && feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="exam-explanation-box"
          >
            <p className="text-sm font-semibold mb-2 text-green-700">
              Correct Answer:
            </p>
            <div className="text-sm text-gray-800">
              <LatexRenderer content={question.correct_answer} />
            </div>
            {feedback.feedback && (
              <p className="text-sm text-gray-600 mt-2">{feedback.feedback}</p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ExamPaperQuestion;
