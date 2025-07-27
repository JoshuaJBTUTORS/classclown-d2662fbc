
import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CollapsibleFilters from '@/components/calendar/CollapsibleFilters';
import { useCalendarData } from '@/hooks/useCalendarData';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info, Filter } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user } = useAuth();
  const { openBookingModal } = useTrialBooking();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // State for calendar functionality
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
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

  // Only allow admins and owners to schedule lessons
  const canScheduleLessons = userRole === 'admin' || userRole === 'owner';

  const openAddLessonDialog = () => {
    setShowAddLessonDialog(true);
  };

  const closeAddLessonDialog = () => {
    setShowAddLessonDialog(false);
  };

  const handleLessonAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

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
          {/* Header with title and controls */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <PageTitle title="Calendar" className="mb-0" />
                
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
                {/* Filter button */}
                <Button 
                  onClick={toggleFilters}
                  variant={filtersOpen ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {filtersOpen ? 'Hide Filters' : 'Show Filters'}
                </Button>

                {/* Schedule lesson button for admins and owners */}
                {canScheduleLessons && (
                  <Button 
                    onClick={openAddLessonDialog}
                    className="flex items-center gap-2"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Schedule Lesson
                  </Button>
                )}
              </div>
            </div>
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

      {/* Add Lesson Dialog for admins and owners */}
      {canScheduleLessons && (
        <AddLessonForm 
          isOpen={showAddLessonDialog} 
          onClose={closeAddLessonDialog}
          onSuccess={handleLessonAdded}
        />
      )}
    </>
  );
};

export default Calendar;
