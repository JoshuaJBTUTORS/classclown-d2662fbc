
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarHeaderProps {
  onAddLesson: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onAddLesson
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center mb-4 md:mb-0">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
      </div>
      <div className="flex items-center">
        <Button className="flex items-center gap-2" onClick={onAddLesson}>
          <Plus className="h-4 w-4" />
          New Lesson
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
