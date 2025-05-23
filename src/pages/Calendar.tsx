
import React, { useState } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAuth } from '@/contexts/AuthContext';

const CalendarPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, userRole } = useAuth();
  
  const { events, isLoading } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          {/* Custom CSS for recurring events */}
          <style>
            {`
              .fc .fc-toolbar {
                margin-bottom: 1.5rem;
              }
              
              .fc .fc-toolbar-title {
                font-size: 1.25rem;
                font-weight: 600;
              }
              
              .fc .fc-button {
                border-radius: 0.375rem;
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.15s ease;
              }
              
              .fc .fc-button-primary {
                background-color: #e94b7f;
                border-color: #e94b7f;
                color: #fff;
              }
              
              .fc .fc-button-primary:hover {
                background-color: rgba(233, 75, 127, 0.9);
                border-color: rgba(233, 75, 127, 0.9);
              }
              
              .fc .fc-daygrid-day-top {
                padding: 0.25rem;
                justify-content: center;
              }
              
              .fc .fc-col-header-cell-cushion {
                font-weight: 500;
                padding: 0.75rem 0;
              }
              
              .fc-theme-standard .fc-scrollgrid {
                border-radius: 0.5rem;
                overflow: hidden;
                border-color: rgba(233, 75, 127, 0.3);
              }
              
              .fc-theme-standard td, .fc-theme-standard th {
                border-color: rgba(233, 75, 127, 0.3);
              }
              
              .fc .fc-daygrid-day.fc-day-today {
                background-color: rgba(233, 75, 127, 0.1);
              }
              
              .calendar-event {
                margin: 2px 0;
                border: none !important;
                padding: 2px;
              }
              
              .fc-event-main {
                padding: 2px 4px;
              }
              
              .recurring-event {
                border-left-color: #e94b7f !important;
              }
              
              .recurring-instance {
                border-left-color: #f8c833 !important;
                opacity: 0.85;
                border-left-style: dashed !important;
              }
              
              .fc .fc-daygrid-day-number,
              .fc .fc-col-header-cell-cushion {
                color: hsl(var(--foreground));
                text-decoration: none !important;
              }
            `}
          </style>
          
          <CalendarHeader />
          <CalendarDisplay isLoading={isLoading} events={events} />
        </main>
      </div>
    </div>
  );
};

export default CalendarPage;
