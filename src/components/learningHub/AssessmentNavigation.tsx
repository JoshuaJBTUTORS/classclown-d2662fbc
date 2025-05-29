
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
}

const AssessmentNavigation: React.FC<AssessmentNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  onPrevious,
  onNext
}) => {
  return (
    <div className="flex justify-between mt-4">
      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      <Button
        onClick={onNext}
        disabled={currentQuestionIndex === totalQuestions - 1}
      >
        Next
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default AssessmentNavigation;
