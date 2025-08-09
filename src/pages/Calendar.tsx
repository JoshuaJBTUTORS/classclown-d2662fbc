
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import { useCalendarData } from '@/hooks/useCalendarData';
import PageTitle from '@/components/ui/PageTitle';
import CalendarFilters from '@/components/calendar/CalendarFilters';

interface CalendarFilters {
  selectedStudents: string[];
  selectedTutors: string[];
  selectedSubjects: string[];
  selectedAdminDemos: string[];
  selectedLessonType: string;
}

const Calendar = () => {
  const { user, userRole } = useAuth();
  const [viewInfo, setViewInfo] = useState<{
    start: Date;
    end: Date;
    view: string;
  } | null>(null);
  
  // Filter state management
  const [filters, setFilters] = useState<CalendarFilters>({
    selectedStudents: [],
    selectedTutors: [],
    selectedSubjects: [],
    selectedAdminDemos: [],
    selectedLessonType: 'All Lessons'
  });
  
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { events, isLoading, fetchLessons, refreshData } = useCalendarData(filters);

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user, fetchLessons]);

  const handleViewChange = (newViewInfo: { start: Date; end: Date; view: string }) => {
    console.log('View changed:', newViewInfo);
    setViewInfo(newViewInfo);
    fetchLessons(newViewInfo.start, newViewInfo.end);
  };

  const handleLessonsUpdated = () => {
    console.log('Lessons updated, refreshing calendar data');
    refreshData();
  };

  const handleFiltersChange = () => {
    console.log('Filters changed:', filters);
    refreshData();
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  // Filter handler functions
  const handleStudentFilterChange = (studentIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedStudents: studentIds }));
  };

  const handleTutorFilterChange = (tutorIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedTutors: tutorIds }));
  };

  const handleSubjectFilterChange = (subjects: string[]) => {
    setFilters(prev => ({ ...prev, selectedSubjects: subjects }));
  };

  const handleAdminDemoFilterChange = (adminIds: string[]) => {
    setFilters(prev => ({ ...prev, selectedAdminDemos: adminIds }));
  };

  const handleLessonTypeFilterChange = (lessonType: string) => {
    setFilters(prev => ({ ...prev, selectedLessonType: lessonType }));
  };

  const handleClearFilters = () => {
    setFilters({
      selectedStudents: [],
      selectedTutors: [],
      selectedSubjects: [],
      selectedAdminDemos: [],
      selectedLessonType: 'All Lessons'
    });
  };

  // Trigger refresh when filters change
  useEffect(() => {
    if (user) {
      handleFiltersChange();
    }
  }, [filters, user]);

  const canUseFilters = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="flex flex-col h-screen">
      <PageTitle 
        title="Calendar" 
        subtitle="View and manage your lessons and schedules"
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Filters Sidebar */}
        {filtersOpen && canUseFilters && (
          <div className="w-80 border-r border-border bg-background overflow-y-auto">
            <div className="p-4">
              <CalendarFilters
                selectedStudents={filters.selectedStudents}
                selectedTutors={filters.selectedTutors}
                selectedSubjects={filters.selectedSubjects}
                selectedAdminDemos={filters.selectedAdminDemos}
                selectedLessonType={filters.selectedLessonType}
                onStudentFilterChange={handleStudentFilterChange}
                onTutorFilterChange={handleTutorFilterChange}
                onSubjectFilterChange={handleSubjectFilterChange}
                onAdminDemoFilterChange={handleAdminDemoFilterChange}
                onLessonTypeFilterChange={handleLessonTypeFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>
        )}

        {/* Main Calendar Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border">
            <CalendarHeader 
              onRefresh={refreshData}
              userRole={userRole}
              onToggleFilters={canUseFilters ? toggleFilters : undefined}
              filtersOpen={filtersOpen}
            />
          </div>
          
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
    </div>
  );
};

export default Calendar;
