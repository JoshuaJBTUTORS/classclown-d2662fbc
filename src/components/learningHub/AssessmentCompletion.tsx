
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssessmentCompletionProps {
  onComplete: () => void;
  hasTimeLimit: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "premium";
  size?: "default" | "sm" | "lg" | "icon";
}

const AssessmentCompletion: React.FC<AssessmentCompletionProps> = ({
  onComplete,
  hasTimeLimit,
  className = "",
  variant = "destructive",
  size = "sm"
}) => {
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={onComplete}
      className={`flex items-center ${className}`}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      Complete Assessment
    </Button>
  );
};

export default AssessmentCompletion;
