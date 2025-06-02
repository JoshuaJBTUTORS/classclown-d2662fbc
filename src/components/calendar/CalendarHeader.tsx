
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';

const CalendarHeader: React.FC = () => {
  const { userRole } = useAuth();
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);

  // Check if user is a student or parent (both have read-only access)
  const isStudentOrParent = userRole === 'student' || userRole === 'parent';

  const openAddLessonDialog = () => {
    setShowAddLessonDialog(true);
  };

  const closeAddLessonDialog = () => {
    setShowAddLessonDialog(false);
  };

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
      
      {/* Only show buttons for tutors, admins, and owners */}
      {!isStudentOrParent && (
        <div className="flex gap-2">
          <Button 
            onClick={openAddLessonDialog}
            className="flex items-center gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Lesson
          </Button>
        </div>
      )}

      {/* Only show dialogs for tutors, admins, and owners */}
      {!isStudentOrParent && (
        <AddLessonForm 
          isOpen={showAddLessonDialog} 
          onClose={closeAddLessonDialog}
          onSuccess={handleLessonAdded}
        />
      )}
    </div>
  );
};

export default CalendarHeader;
