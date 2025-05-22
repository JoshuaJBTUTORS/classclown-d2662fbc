
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ViewOptions from '@/components/calendar/ViewOptions';
import FilterPopover from '@/components/calendar/FilterPopover';
import { Student } from '@/types/student';

interface CalendarHeaderProps {
  currentDate: Date;
  calendarView: string;
  onViewChange: (view: string) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onAddLesson: () => void;
  students: Student[];
  filteredStudentId: string | null;
  filteredParentId: string | null;
  parentsList: {id: string, name: string}[];
  onFilterChange: (studentId: string | null, parentId: string | null) => void;
  onFilterReset: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  calendarView,
  onViewChange,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  onAddLesson,
  students,
  filteredStudentId,
  filteredParentId,
  parentsList,
  onFilterChange,
  onFilterReset
}) => {
  // Get a formatted display for the current date based on the view
  const getDateDisplay = () => {
    try {
      if (calendarView === 'dayGridMonth') {
        return format(currentDate, 'MMMM yyyy');
      } else if (calendarView === 'timeGridWeek') {
        return `Week of ${format(currentDate, 'MMMM d, yyyy')}`;
      } else {
        // For day view
        return format(currentDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error("Error formatting date display:", error);
      return "Error displaying date";
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center mb-4 md:mb-0">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        <FilterPopover 
          students={students}
          filteredStudentId={filteredStudentId}
          filteredParentId={filteredParentId}
          parentsList={parentsList}
          onFilterChange={onFilterChange}
          onFilterReset={onFilterReset}
        />
        <ViewOptions currentView={calendarView} onViewChange={onViewChange} />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigatePrevious}
            title={`Previous ${calendarView === 'dayGridMonth' ? 'Month' : calendarView === 'timeGridWeek' ? 'Week' : 'Day'}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToday}
            className="text-xs"
          >
            Today
          </Button>
          <div className="text-sm font-medium min-w-[140px] text-center">
            {getDateDisplay()}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigateNext}
            title={`Next ${calendarView === 'dayGridMonth' ? 'Month' : calendarView === 'timeGridWeek' ? 'Week' : 'Day'}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button className="flex items-center gap-2" onClick={onAddLesson}>
          <Plus className="h-4 w-4" />
          New Lesson
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
