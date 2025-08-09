
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarFilters from '@/components/calendar/CalendarFilters';
import { useCalendarData } from '@/hooks/useCalendarData';
import { PageTitle } from '@/components/ui/PageTitle';
import CollapsibleFilters from '@/components/calendar/CollapsibleFilters';

const Calendar = () => {
  const { user, userRole } = useAuth();
  const { events, isLoading, fetchLessons, refreshData } = useCalendarData();
  const [viewInfo, setViewInfo] = useState<{
    start: Date;
    end: Date;
    view: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user, fetchLessons]);

  const handleViewChange = (newViewInfo: { start: Date; end: Date; view: string }) => {
    console.log('View changed:', newViewInfo);
    setViewInfo(newViewInfo);
    // Optionally fetch lessons for the new date range
    fetchLessons(newViewInfo.start, newViewInfo.end);
  };

  const handleLessonsUpdated = () => {
    console.log('Lessons updated, refreshing calendar data');
    refreshData();
  };

  const handleFiltersChange = (filters: any) => {
    console.log('Filters changed:', filters);
    // Apply filters to the calendar events
    // This could involve re-fetching data with filters
    refreshData();
  };

  return (
    <div className="flex flex-col h-screen">
      <PageTitle 
        title="Calendar" 
        description="View and manage your lessons and schedules"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <CalendarHeader 
          onRefresh={refreshData}
          userRole={userRole}
        />
        
        <CollapsibleFilters 
          userRole={userRole}
          onFiltersChange={handleFiltersChange}
        />
        
        <div className="flex-1 p-6 overflow-hidden">
          <CalendarDisplay
            isLoading={isLoading}
            events={events}
            onLessonsUpdated={handleLessonsUpdated}
            onViewChange={handleViewChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
