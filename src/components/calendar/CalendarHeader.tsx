import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info, Filter } from 'lucide-react';
import AddLessonDialog from '@/components/lessons/AddLessonDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';

interface CalendarHeaderProps {
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onToggleFilters, filtersOpen }) => {
  const { userRole } = useAuth();
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);

  // Only allow admins and owners to schedule lessons
  const canScheduleLessons = userRole === 'admin' || userRole === 'owner';

  const handleLessonAdded = () => {
    // This will trigger a refresh of the calendar data
    window.location.reload();
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center mb-4 md:mb-0">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="p-2 max-w-xs">
                <p className="mb-2 text-sm font-medium">Calendar Legend:</p>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                  <span className="text-xs">Regular lessons</span>
                </div>
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 border-l-2 border-purple-600 pl-1 mr-2">🔄</div>
                  <span className="text-xs">Recurring lessons</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex gap-2">
        {/* Filter button - show to all users */}
        <Button 
          onClick={onToggleFilters}
          variant={filtersOpen ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>

        {/* Only show schedule lesson button for admins and owners */}
        {canScheduleLessons && (
          <Button 
            onClick={() => setShowAddLessonDialog(true)}
            className="flex items-center gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Lesson
          </Button>
        )}
      </div>

      {/* Only show dialogs for admins and owners */}
      {canScheduleLessons && (
        <AddLessonDialog
          open={showAddLessonDialog}
          onOpenChange={setShowAddLessonDialog}
          onSuccess={handleLessonAdded}
        />
      )}
    </div>
  );
};

export default CalendarHeader;
