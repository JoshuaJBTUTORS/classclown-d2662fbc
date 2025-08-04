
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
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
        className="px-6 py-3 text-base font-medium rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
      >
        <ChevronLeft className="mr-2 h-5 w-5" />
        Previous
      </Button>
      
      <div className="text-center">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
      </div>
      
      <Button
        onClick={onNext}
        disabled={currentQuestionIndex === totalQuestions - 1}
        className="px-6 py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        Next
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

export default AssessmentNavigation;
