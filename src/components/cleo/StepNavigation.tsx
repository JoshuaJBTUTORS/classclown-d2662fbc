import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  stepTitle?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  stepTitle
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 bg-gradient-to-r from-primary/5 to-primary/10 border-t border-border gap-4 w-full">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="w-full sm:w-auto px-6 py-3 text-base font-medium rounded-xl border-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
      >
        <ChevronLeft className="mr-2 h-5 w-5" />
        Previous Step
      </Button>
      
      <div className="text-center order-first sm:order-none">
        <span className="text-sm font-bold text-primary uppercase tracking-wide">
          Step {currentStep + 1} of {totalSteps}
        </span>
        {stepTitle && (
          <div className="text-xs text-muted-foreground mt-1 font-medium">{stepTitle}</div>
        )}
      </div>
      
      <Button
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
        className="w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        Next Step
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};
