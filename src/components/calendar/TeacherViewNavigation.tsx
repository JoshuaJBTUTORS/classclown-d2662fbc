import React from 'react';
import { format, addDays, addWeeks, subDays, subWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface TeacherViewNavigationProps {
  currentDate: Date;
  viewType: 'teacherWeek' | 'teacherDay';
  onDateChange: (date: Date) => void;
}

const TeacherViewNavigation: React.FC<TeacherViewNavigationProps> = ({
  currentDate,
  viewType,
  onDateChange
}) => {
  const handlePrevious = () => {
    if (viewType === 'teacherDay') {
      onDateChange(subDays(currentDate, 1));
    } else {
      onDateChange(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewType === 'teacherDay') {
      onDateChange(addDays(currentDate, 1));
    } else {
      onDateChange(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateDisplay = () => {
    if (viewType === 'teacherDay') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else {
      // For week view, show the week range
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="ml-2"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Today
        </Button>
      </div>
      
      <div className="text-lg font-semibold text-foreground">
        {getDateDisplay()}
      </div>
      
      <div className="w-32" /> {/* Spacer for centering */}
    </div>
  );
};

export default TeacherViewNavigation;