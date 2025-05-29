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
      className="space-y-3"
    >
      {Object.entries(options).map(([key, value]) => (
        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50" key={key}>
          <RadioGroupItem value={key} id={`choice-${key}`} className="mt-1" />
          <Label htmlFor={`choice-${key}`} className="flex-1 cursor-pointer">
            <span className="font-medium mr-2">{key}.</span>
            {String(value)}
          </Label>
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
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Question {question.question_number} ({question.marks_available} marks)
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-800 leading-relaxed">{question.question_text}</p>
        
        {/* Display question image if it exists */}
        {question.image_url && (
          <div className="my-4">
            <img 
              src={question.image_url} 
              alt={`Question ${question.question_number} image`}
              className="max-w-full h-auto rounded-lg shadow-sm border"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}
        
        <div className="space-y-4">
          {question.question_type === 'multiple_choice' ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Select your answer:</p>
              <MultipleChoiceQuestion
                question={question}
                studentAnswer={studentAnswer}
                onAnswerChange={onAnswerChange}
              />
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your answer:</p>
              <Textarea
                placeholder="Enter your answer here..."
                value={studentAnswer}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                disabled={isMarking}
                className="min-h-[120px]"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={onMark} 
            disabled={isMarking || !studentAnswer.trim()}
            className="w-full max-w-xs"
          >
            {isMarking ? 'Marking Answer...' : 'Mark Answer'}
          </Button>
        </div>
        
        <QuestionFeedback feedback={feedback} isLoading={isMarking} />
      </CardContent>
    </Card>
  );
};

export default AssessmentQuestionCard;
