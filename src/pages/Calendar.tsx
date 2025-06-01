
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import { useCalendarData } from '@/hooks/useCalendarData';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user } = useAuth();
  const { openBookingModal } = useTrialBooking();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({
    selectedStudents: [],
    selectedTutors: []
  });

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

  const { events, isLoading } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    refreshKey,
    filters
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CalendarHeader 
          onRefresh={handleRefresh}
          userRole={userRole}
        />
        
        {(userRole === 'admin' || userRole === 'owner') && (
          <div className="mb-6">
            <CalendarFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}
        
        <CalendarDisplay 
          events={events}
          isLoading={isLoading}
          userRole={userRole}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default Calendar;
