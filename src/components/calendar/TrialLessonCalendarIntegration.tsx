
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Calendar, Clock, User } from 'lucide-react';
import { Lesson } from '@/types/lesson';
import TrialLessonBadge from './TrialLessonBadge';

interface TrialLessonCalendarIntegrationProps {
  lesson: Lesson;
  compact?: boolean;
}

const TrialLessonCalendarIntegration: React.FC<TrialLessonCalendarIntegrationProps> = ({ 
  lesson, 
  compact = false 
}) => {
  if (lesson.lesson_type !== 'trial') {
    return null;
  }

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'}`}>
      <TrialLessonBadge />
      
      {!compact && (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Trial Student</span>
          </div>
          {lesson.students && lesson.students.length > 0 && (
            <div className="mt-1">
              <span className="font-medium">
                {lesson.students[0].first_name} {lesson.students[0].last_name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrialLessonCalendarIntegration;
