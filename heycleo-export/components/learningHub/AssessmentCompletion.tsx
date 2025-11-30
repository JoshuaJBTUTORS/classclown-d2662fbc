
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentCompletionProps {
  onComplete: () => void;
  isLoading?: boolean;
  className?: string;
  hasAnsweredQuestions?: boolean;
}

const AssessmentCompletion: React.FC<AssessmentCompletionProps> = ({
  onComplete,
  isLoading = false,
  className = "",
  hasAnsweredQuestions = true
}) => {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm text-muted-foreground mb-3">
        {hasAnsweredQuestions 
          ? "Ready to submit your assessment and see your score?" 
          : "Complete some questions before submitting."
        }
      </p>
      <Button 
        onClick={onComplete}
        disabled={isLoading || !hasAnsweredQuestions}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
        size="default"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Processing Assessment...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Assessment
          </>
        )}
      </Button>
    </div>
  );
};

export default AssessmentCompletion;
