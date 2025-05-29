
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentCompletionProps {
  onComplete: () => void;
  isLoading?: boolean;
  className?: string;
}

const AssessmentCompletion: React.FC<AssessmentCompletionProps> = ({
  onComplete,
  isLoading = false,
  className = ""
}) => {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-sm text-muted-foreground mb-3">
        Ready to submit your assessment?
      </p>
      <Button 
        onClick={onComplete}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
        size="default"
      >
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Completing...
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
