
import React, { useState, useMemo } from 'react';
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
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user } = useAuth();
  const { openBookingModal } = useTrialBooking();
  const { open: sidebarOpen, toggleSidebar, setOpen } = useSidebar();
  
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // State for calendar functionality
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);

  // Memoize filters to prevent infinite loop - only recreate when dependencies change
  const filters = useMemo(() => ({
    selectedStudents,
    selectedTutors
  }), [selectedStudents, selectedTutors]);

  // Fetch calendar data using the hook (always call hooks)
  const { events, isLoading } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    refreshKey,
    filters
  });

  const closeSidebar = () => {
    setOpen(false);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

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

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <LockedFeature
              featureName="Calendar & Scheduling"
              featureIcon={<CalendarIcon className="h-16 w-16 text-gray-300" />}
              description="Access your lesson calendar, book sessions, and manage your tutoring schedule."
            />
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
          {/* Header - Fixed height */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-gray-200">
            <CalendarHeader 
              onToggleFilters={toggleFilters}
              filtersOpen={filtersOpen}
            />
          </div>
          
          {/* Calendar Display - Full height */}
          <div className="flex-1 overflow-hidden p-4">
            <CalendarDisplay
              isLoading={isLoading}
              events={events}
            />
          </div>
        </main>
      </div>

      {/* Fixed Positioned Filters Sidebar */}
      <CollapsibleFilters
        selectedStudents={selectedStudents}
        selectedTutors={selectedTutors}
        onStudentFilterChange={handleStudentFilterChange}
        onTutorFilterChange={handleTutorFilterChange}
        onClearFilters={handleClearFilters}
        canUseFilters={canUseFilters}
        isOpen={filtersOpen}
        onToggle={toggleFilters}
        sidebarOpen={sidebarOpen}
      />
    </>
  );
};

export default Calendar;
