
import React, { useState, useEffect, useCallback } from 'react';
import { DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';

import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import { toast } from 'sonner';
import { useCalendarData } from '@/hooks/useCalendarData';

const CalendarPage = () => {
  // Simple UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  
  // Use simplified hook
  const { 
    events, 
    isLoading, 
    loadingError, 
    setIsLoading,
    fetchEvents 
  } = useCalendarData();

  // Initialize calendar with basic data
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    console.log("Calendar - Initial data load", { 
      start: start.toISOString(), 
      end: end.toISOString() 
    });
    
    fetchEvents(start, end);
  }, [fetchEvents]);

  // Basic event handlers
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedTimeSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsAddingLesson(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    toast.info(`Clicked on: ${clickInfo.event.title}`);
  };

  const handleCalendarDatesSet = useCallback((arg: DatesSetArg) => {
    console.log("Calendar - datesSet event triggered", {
      viewType: arg.view.type,
      start: arg.start,
      end: arg.end
    });
    
    setCalendarView(arg.view.type);
    fetchEvents(arg.start, arg.end);
  }, [fetchEvents]);

  const handleAddLessonSuccess = () => {
    setIsAddingLesson(false);
    setSelectedTimeSlot(null);
    toast.success('Lesson added successfully!');
    
    // Refresh calendar
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    fetchEvents(start, end);
  };

  const handleRetry = () => {
    setIsLoading(true);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    fetchEvents(start, end);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <CalendarHeader onAddLesson={() => setIsAddingLesson(true)} />

          <CalendarDisplay 
            isLoading={isLoading}
            loadingError={loadingError}
            calendarView={calendarView}
            events={events}
            onSelectDate={handleDateSelect}
            onEventClick={handleEventClick}
            onDatesSet={handleCalendarDatesSet}
            onRetry={handleRetry}
          />
        </main>
      </div>

      {/* Add Lesson Form */}
      <AddLessonForm
        isOpen={isAddingLesson}
        onClose={() => setIsAddingLesson(false)}
        onSuccess={handleAddLessonSuccess}
        preselectedTime={selectedTimeSlot}
      />
    </div>
  );
};

export default CalendarPage;
