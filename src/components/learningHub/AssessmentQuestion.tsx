
import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AssessmentQuestion } from '@/services/aiAssessmentService';
import QuestionFeedback from './QuestionFeedback';

interface AssessmentQuestionProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  isMarking?: boolean;
  onMark?: () => void;
  feedback?: any;
  embedded?: boolean;
  isMarked?: boolean;
}

interface MultipleChoiceQuestionProps {
  question: AssessmentQuestion;
  studentAnswer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
}

const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  studentAnswer,
  onAnswerChange,
}) => {
  // Get options from marking scheme or fallback to default
  const options: Record<string, string> = question.marking_scheme?.options || {
    A: 'Option A',
    B: 'Option B', 
    C: 'Option C',
    D: 'Option D'
  };

  return (
    <RadioGroup
      value={studentAnswer}
      onValueChange={(value) => onAnswerChange(question.id, value)}
      className="space-y-4 w-full"
    >
      {Object.entries(options).map(([key, value]) => (
        <div 
          key={key}
          className={`relative cursor-pointer transition-all duration-200 hover:scale-[1.01] w-full ml-6 ${
            studentAnswer === key 
              ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary shadow-lg' 
              : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
          } rounded-xl p-4 sm:p-5 group`}
          onClick={() => onAnswerChange(question.id, key)}
        >
          <div className="flex items-start space-x-3 sm:space-x-4 w-full">
            <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${
              studentAnswer === key
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-500 group-hover:border-gray-400'
            }`}>
              {key}
            </div>
            <RadioGroupItem value={key} id={`choice-${key}`} className="sr-only" />
            <Label 
              htmlFor={`choice-${key}`} 
              className="flex-1 cursor-pointer text-gray-800 leading-relaxed text-sm sm:text-base w-full break-words"
            >
              {String(value)}
            </Label>
            {studentAnswer === key && (
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </RadioGroup>
  );
};

const AssessmentQuestionCard: React.FC<AssessmentQuestionProps> = ({
  question,
  studentAnswer,
  onAnswerChange,
  isMarking = false,
  onMark,
  feedback,
  embedded = false,
  isMarked = false,
}) => {
  return (
    <Card className={embedded ? "border-0 shadow-none rounded-none" : "shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50"}>
      <CardHeader className={embedded ? "px-0 py-2" : "pb-6 px-6 sm:px-8 lg:px-10"}>
        <CardTitle className={embedded ? "text-base sm:text-lg text-center sm:text-left" : "text-xl font-bold"}>
          <div className="flex items-center justify-start w-full">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center mr-3">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-gray-900">
              Question {question.question_number} 
              <span className="text-primary font-normal ml-2">({question.marks_available} marks)</span>
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={embedded ? "px-0 pb-2 space-y-6" : "space-y-6 pt-0 px-6 sm:px-8 lg:px-10"}>
        <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-100 w-full">
          <p className="text-gray-900 leading-relaxed text-lg font-medium break-words text-left">{question.question_text}</p>
        </div>
        
        {/* Display question image if it exists */}
        {question.image_url && (
          <div className="my-4 text-center">
            <img 
              src={question.image_url} 
              alt={`Question ${question.question_number} image`}
              className="max-w-full h-auto rounded-lg shadow-sm border mx-auto"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}
        
        <div className="space-y-6 w-full">
          {question.question_type === 'multiple_choice' ? (
            <div className="w-full">
              <p className="text-base font-semibold text-gray-800 mb-4 text-left pl-6">Select your answer:</p>
              <div className="w-full">
                <MultipleChoiceQuestion
                  question={question}
                  studentAnswer={studentAnswer}
                  onAnswerChange={onAnswerChange}
                />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <p className="text-base font-semibold text-gray-800 mb-4 text-left">Your answer:</p>
              <Textarea
                placeholder="Enter your answer here..."
                value={studentAnswer}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                disabled={isMarking}
                className="min-h-[150px] break-words text-base bg-white border-2 border-gray-200 focus:border-primary rounded-xl p-4 w-full"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-6 w-full">
          <Button 
            onClick={onMark} 
            disabled={isMarking || !studentAnswer.trim() || isMarked}
            className={`px-8 py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg ${
              isMarked 
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                : 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg'
            }`}
            variant="default"
          >
            {isMarking ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Marking Answer...</span>
              </div>
            ) : isMarked ? (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Already Marked</span>
              </div>
            ) : (
              'Mark Answer'
            )}
          </Button>
        </div>
        
        <QuestionFeedback feedback={feedback} isLoading={isMarking} />
      </CardContent>
    </Card>
  );
};

export default AssessmentQuestionCard;
