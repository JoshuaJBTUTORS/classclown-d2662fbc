
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CollapsibleFilters from '@/components/calendar/CollapsibleFilters';
import { useCalendarData } from '@/hooks/useCalendarData';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user } = useAuth();
  const { openBookingModal } = useTrialBooking();
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // State for calendar functionality
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex flex-col flex-1 transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <LockedFeature
              featureName="Calendar & Scheduling"
              featureIcon={<CalendarIcon className="h-16 w-16 text-gray-300" />}
              description="Access your lesson calendar, book sessions, and manage your tutoring schedule."
              onBookTrial={openBookingModal}
            />
          </main>
        </div>
      </div>
    );
  }

  // Prepare filters for calendar data
  const filters = {
    selectedStudents,
    selectedTutors
  };

  // Fetch calendar data using the hook
  const { events, isLoading } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    refreshKey,
    filters
  });

  // Filter handlers
  const handleStudentFilterChange = (studentIds: string[]) => {
    setSelectedStudents(studentIds);
  };

  const handleTutorFilterChange = (tutorIds: string[]) => {
    setSelectedTutors(tutorIds);
  };

  const handleClearFilters = () => {
    setSelectedStudents([]);
    setSelectedTutors([]);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if user can see filters (admin/owner only for full filters)
  const canUseFilters = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex flex-col flex-1 transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-gray-200">
            <CalendarHeader 
              onToggleFilters={toggleFilters}
              filtersOpen={filtersOpen}
            />
          </div>
          
          {/* Calendar Area - Full height with optional filters */}
          <div className="flex-1 flex overflow-hidden">
            {/* Collapsible Filters Sidebar - only show when filters are open */}
            {filtersOpen && (
              <CollapsibleFilters
                selectedStudents={selectedStudents}
                selectedTutors={selectedTutors}
                onStudentFilterChange={handleStudentFilterChange}
                onTutorFilterChange={handleTutorFilterChange}
                onClearFilters={handleClearFilters}
                canUseFilters={canUseFilters}
              />
            )}
            
            {/* Calendar Display - Takes remaining space */}
            <div className="flex-1 overflow-hidden p-4">
              <CalendarDisplay
                isLoading={isLoading}
                events={events}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calendar;
