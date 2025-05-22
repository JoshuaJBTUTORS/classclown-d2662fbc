
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';

const CalendarHeader: React.FC = () => {
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);

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
      </div>
      
      <div className="flex">
        <Button 
          onClick={openAddLessonDialog}
          className="flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Schedule Lesson
        </Button>
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonForm 
        isOpen={showAddLessonDialog} 
        onClose={closeAddLessonDialog}
        onSuccess={handleLessonAdded}
      />
    </div>
  );
};

export default CalendarHeader;
