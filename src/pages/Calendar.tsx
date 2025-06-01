
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import { useCalendarData } from '@/hooks/useCalendarData';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user } = useAuth();
  const { openBookingModal } = useTrialBooking();
  
  // State for calendar functionality
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <LockedFeature
        featureName="Calendar & Scheduling"
        featureIcon={<CalendarIcon className="h-16 w-16 text-gray-300" />}
        description="Access your lesson calendar, book sessions, and manage your tutoring schedule."
        onBookTrial={openBookingModal}
      />
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

  // Check if user can see filters (admin/owner only)
  const canUseFilters = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="container mx-auto p-4 space-y-6">
      <CalendarHeader />
      
      {canUseFilters && (
        <CalendarFilters
          selectedStudents={selectedStudents}
          selectedTutors={selectedTutors}
          onStudentFilterChange={handleStudentFilterChange}
          onTutorFilterChange={handleTutorFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}
      
      <CalendarDisplay
        isLoading={isLoading}
        events={events}
      />
    </div>
  );
};

export default Calendar;
