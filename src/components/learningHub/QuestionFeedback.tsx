
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FeedbackData {
  marks: number;
  maxMarks: number;
  feedback: string;
  confidence: number;
}

interface QuestionFeedbackProps {
  feedback: FeedbackData | null;
  isLoading?: boolean;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({ 
  feedback, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center py-8 animate-fade-in">
        <img 
          src="/lovable-uploads/2bf5a4ae-12dc-41d1-ab88-34bf93d9798d.png" 
          alt="Pawfessor is thinking" 
          className="w-48 h-auto animate-bounce"
        />
        <p className="mt-4 text-muted-foreground text-sm font-medium">
          Pawfessor is thinking...
        </p>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  const percentage = Math.round((feedback.marks / feedback.maxMarks) * 100);
  const isCorrect = feedback.marks === feedback.maxMarks;
  const isPartiallyCorrect = feedback.marks > 0 && feedback.marks < feedback.maxMarks;

  let cardClass = "mt-4 ";
  let icon = null;
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";

  if (isCorrect) {
    cardClass += "border-green-200 bg-green-50";
    icon = <CheckCircle className="h-5 w-5 text-green-600" />;
    badgeVariant = "default";
  } else if (isPartiallyCorrect) {
    cardClass += "border-yellow-200 bg-yellow-50";
    icon = <AlertCircle className="h-5 w-5 text-yellow-600" />;
    badgeVariant = "secondary";
  } else {
    cardClass += "border-red-200 bg-red-50";
    icon = <XCircle className="h-5 w-5 text-red-600" />;
    badgeVariant = "destructive";
  }

  return (
    <Card className={cardClass}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">
              {isCorrect ? 'Correct!' : isPartiallyCorrect ? 'Partially Correct' : 'Incorrect'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant}>
              {feedback.marks}/{feedback.maxMarks} marks
            </Badge>
            <Badge variant="outline">
              {percentage}%
            </Badge>
          </div>
        </div>
        
        <div className="text-sm text-gray-700">
          {feedback.feedback}
        </div>
        
        {feedback.confidence < 0.8 && (
          <div className="mt-2 text-xs text-gray-500 italic">
            Note: This automated marking has moderate confidence ({Math.round(feedback.confidence * 100)}%). 
            Your tutor may review this answer.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionFeedback;
