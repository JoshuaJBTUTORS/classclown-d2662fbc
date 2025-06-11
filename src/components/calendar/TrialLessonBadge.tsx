
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';

interface TrialLessonBadgeProps {
  className?: string;
}

const TrialLessonBadge: React.FC<TrialLessonBadgeProps> = ({ className = '' }) => {
  return (
    <Badge 
      variant="outline" 
      className={`bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 ${className}`}
    >
      <GraduationCap className="mr-1 h-3 w-3" />
      Trial
    </Badge>
  );
};

export default TrialLessonBadge;
