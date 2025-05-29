
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
  const choices = question.marking_scheme?.choices || ['A', 'B', 'C', 'D'];

  return (
    <RadioGroup
      defaultValue={studentAnswer}
      onValueChange={(value) => onAnswerChange(question.id, value)}
    >
      <div className="grid gap-2">
        {choices.map((choice: string) => (
          <div className="flex items-center space-x-2" key={choice}>
            <RadioGroupItem value={choice} id={`choice-${choice}`} />
            <Label htmlFor={`choice-${choice}`}>{choice}</Label>
          </div>
        ))}
      </div>
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
        <p>{question.question_text}</p>
        
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
        
        {question.question_type === 'multiple_choice' ? (
          <MultipleChoiceQuestion
            question={question}
            studentAnswer={studentAnswer}
            onAnswerChange={onAnswerChange}
          />
        ) : (
          <Textarea
            placeholder="Enter your answer here..."
            value={studentAnswer}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            disabled={isMarking}
          />
        )}
        
        <div className="flex justify-center">
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
