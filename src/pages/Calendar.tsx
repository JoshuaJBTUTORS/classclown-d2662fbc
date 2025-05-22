
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import { useCalendarData } from '@/hooks/useCalendarData';

const CalendarPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { events, isLoading } = useCalendarData();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          {/* Custom CSS for recurring events */}
          <style jsx>{`
            :global(.recurring-event) {
              border-left: 3px solid #9333ea !important;
            }
            :global(.recurring-instance) {
              border-left: 3px dashed #9333ea !important;
              opacity: 0.85;
            }
          `}</style>
          
          <CalendarHeader />
          <CalendarDisplay isLoading={isLoading} events={events} />
        </main>
      </div>
    </div>
  );
};

export default CalendarPage;
