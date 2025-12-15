import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target, FileText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ExamPaperQuestion from './ExamPaperQuestion';
import { Loader2 } from 'lucide-react';

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

interface Assessment {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  exam_board?: string;
  year?: number;
  paper_type?: string;
  total_marks?: number;
  time_limit_minutes?: number;
  status: string;
  extract_text?: string;
  extract_source?: string;
  extract_type?: string;
}

interface ExamPaperAssessmentProps {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  studentAnswers: { [key: string]: string };
  onAnswerChange: (questionId: string, answer: string) => void;
  onMarkQuestion: (questionId: string) => void;
  markedQuestions: Set<string>;
  markingStates: { [key: string]: boolean };
  feedback: { [key: string]: any };
  onComplete: () => void;
  isCompleting: boolean;
  timeRemaining?: number | null;
  hasTimeLimit: boolean;
  previewMode?: boolean;
  examMode?: boolean; // When true, hide all scoring/marking feedback
}

export const ExamPaperAssessment: React.FC<ExamPaperAssessmentProps> = ({
  assessment,
  questions,
  studentAnswers,
  onAnswerChange,
  onMarkQuestion,
  markedQuestions,
  markingStates,
  feedback,
  onComplete,
  isCompleting,
  timeRemaining,
  hasTimeLimit,
  previewMode = false,
  examMode = false,
}) => {
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    const count = Object.values(studentAnswers).filter(a => a && a.trim()).length;
    setAnsweredCount(count);
  }, [studentAnswers]);

  const progressPercentage = questions.length > 0 
    ? (markedQuestions.size / questions.length) * 100 
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-paper-container max-w-4xl mx-auto">
      {/* Exam Paper Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="exam-paper-header bg-white border-2 border-black mb-0"
      >
        {/* Top row with exam board logo placeholder */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {assessment.exam_board && (
              <div className="font-bold text-lg uppercase tracking-wider font-serif">
                {assessment.exam_board}
              </div>
            )}
          </div>
          <div className="text-right font-serif">
            {assessment.year && <div className="text-sm">{assessment.year}</div>}
            {assessment.paper_type && (
              <div className="text-sm font-medium">{assessment.paper_type}</div>
            )}
          </div>
        </div>

        {/* Title section */}
        <div className="p-6 text-center border-b-2 border-black">
          <h1 className="text-2xl font-bold font-serif mb-2">
            {assessment.title}
          </h1>
          {assessment.subject && (
            <p className="text-lg font-serif text-gray-700">{assessment.subject}</p>
          )}
        </div>

        {/* Meta info row */}
        <div className="flex items-center justify-between p-4 bg-gray-50 font-serif text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Total: {assessment.total_marks || questions.reduce((acc, q) => acc + q.marks_available, 0)} marks</span>
            </div>
            {hasTimeLimit && timeRemaining !== null && timeRemaining !== undefined && (
              <div className={`flex items-center gap-2 ${timeRemaining < 300 ? 'text-red-600 font-bold' : ''}`}>
                <Clock className="w-4 h-4" />
                <span>Time: {formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{questions.length} Questions</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-gray-200 font-serif text-sm">
          <p className="font-semibold mb-2">Instructions</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Answer ALL questions in the spaces provided</li>
            <li>Write clearly and show all your working</li>
            <li>Click "Submit Answer" after completing each question</li>
            {!previewMode && <li>You can complete the questions in any order</li>}
          </ul>
        </div>
      </motion.div>

      {/* Source Text / Extract Section - For English Language */}
      {assessment.extract_text && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border-l-2 border-r-2 border-black"
        >
          <div className="border-b-2 border-black p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg">Source A</h2>
                {assessment.extract_source && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    {assessment.extract_source}
                  </p>
                )}
              </div>
              {assessment.extract_type && (
                <span className="text-xs uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded">
                  {assessment.extract_type}
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="font-serif text-base leading-relaxed extract-text">
              {assessment.extract_text
                ?.replace(/\\n(\d+)\s*\|/g, '\n')
                ?.replace(/\\n/g, '\n')
                ?.split('\n')
                .map((line, index) => (
                  <p key={index} className="mb-2">
                    <span className="text-muted-foreground mr-3 select-none text-sm">{index + 1}</span>
                    {line}
                  </p>
                ))}
            </div>
          </div>
          <div className="border-t border-gray-200 p-3 bg-gray-50 text-center">
            <p className="text-sm text-muted-foreground font-serif italic">
              Read the source carefully before answering the questions below
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress Bar */}
      {!previewMode && (
        <div className="bg-white border-l-2 border-r-2 border-black px-6 py-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Progress</span>
            <span>{markedQuestions.size} of {questions.length} completed</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      )}

      {/* Questions */}
      <div className="exam-questions-container border-l-2 border-r-2 border-black bg-white">
        {questions.map((question, index) => (
          <ExamPaperQuestion
            key={question.id}
            question={question}
            questionIndex={index}
            studentAnswer={studentAnswers[question.id] || ''}
            onAnswerChange={onAnswerChange}
            onMark={onMarkQuestion}
            isMarking={markingStates[question.id] || false}
            isMarked={markedQuestions.has(question.id)}
            feedback={feedback[question.id]}
            subject={assessment.subject}
            examBoard={assessment.exam_board}
            disabled={previewMode}
            examMode={examMode}
          />
        ))}
      </div>

      {/* Complete Assessment Footer */}
      {!previewMode && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="exam-paper-footer bg-white border-2 border-black border-t-0 p-6"
        >
          <div className="text-center">
            <div className="mb-4 font-serif">
              <p className="text-lg font-bold mb-1">End of Assessment</p>
              <p className="text-sm text-gray-600">
                {answeredCount} of {questions.length} questions answered • {markedQuestions.size} marked
              </p>
            </div>

            <Button
              onClick={onComplete}
              disabled={isCompleting || markedQuestions.size === 0}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold"
            >
              {isCompleting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>

            {markedQuestions.size < questions.length && markedQuestions.size > 0 && (
              <p className="text-sm text-amber-600 mt-3">
                ⚠️ You have {questions.length - markedQuestions.size} unanswered questions
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Preview Mode Footer */}
      {previewMode && (
        <div className="exam-paper-footer bg-gray-100 border-2 border-black border-t-0 p-6 text-center">
          <p className="text-gray-600 font-serif italic">
            This is a preview. Students will be able to answer questions and submit their responses.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamPaperAssessment;
