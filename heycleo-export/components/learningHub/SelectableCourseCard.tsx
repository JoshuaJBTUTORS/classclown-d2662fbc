
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, CheckCircle, Globe } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subject: string;
}

interface SelectableCourseCardProps {
  course?: Course;
  isSelected: boolean;
  onClick: () => void;
  isAllCoursesCard?: boolean;
}

const SelectableCourseCard: React.FC<SelectableCourseCardProps> = ({
  course,
  isSelected,
  onClick,
  isAllCoursesCard = false,
}) => {
  const cardClasses = cn(
    'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-2 h-full',
    isSelected
      ? 'border-primary bg-primary/10 shadow-lg'
      : 'border-transparent bg-card hover:bg-card/90',
  );

  if (isAllCoursesCard) {
    return (
      <Card onClick={onClick} className={cardClasses}>
        <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center relative">
          <Globe className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-card-foreground">All Courses</h3>
          <p className="text-sm text-muted-foreground">View aggregate data</p>
          {isSelected && (
            <CheckCircle className="h-5 w-5 text-primary absolute top-3 right-3" />
          )}
        </CardContent>
      </Card>
    );
  }

  if (!course) return null;

  return (
    <Card onClick={onClick} className={cardClasses}>
      <CardContent className="p-4 flex flex-col h-full relative">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
              <h3 className="font-semibold text-card-foreground leading-tight line-clamp-2">{course.title}</h3>
              <p className="text-sm text-muted-foreground">{course.subject}</p>
          </div>
        </div>
        {isSelected && (
          <CheckCircle className="h-5 w-5 text-primary absolute top-3 right-3" />
        )}
      </CardContent>
    </Card>
  );
};

export default SelectableCourseCard;
