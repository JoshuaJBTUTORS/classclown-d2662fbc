
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import TeacherCalendarView from '@/components/calendar/TeacherCalendarView';
import ViewOptions from '@/components/calendar/ViewOptions';
import CollapsibleFilters from '@/components/calendar/CollapsibleFilters';
import { useCalendarData } from '@/hooks/useCalendarData';
import Sidebar from '@/components/navigation/Sidebar';
import MobileMenuButton from '@/components/navigation/MobileMenuButton';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info, Filter, MessageSquare, Users } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicRequestDialog } from '@/components/calendar/TopicRequestDialog';
import { ReferFriendDialog } from '@/components/calendar/ReferFriendDialog';
import CalendarHero from '@/components/calendar/CalendarHero';


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
  const [selectedParents, setSelectedParents] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLessonType, setSelectedLessonType] = useState<string>('All Lessons');
  const [showAddLessonDialog, setShowAddLessonDialog] = useState(false);
  const [showTopicRequestDialog, setShowTopicRequestDialog] = useState(false);
  const [showReferFriendDialog, setShowReferFriendDialog] = useState(false);

  // New state for view-based date range
  const [currentStartDate, setCurrentStartDate] = useState<Date | undefined>(undefined);
  const [currentEndDate, setCurrentEndDate] = useState<Date | undefined>(undefined);
  const [currentViewType, setCurrentViewType] = useState<string>('timeGridWeek');
  const [teacherViewType, setTeacherViewType] = useState<string>('teacherWeek');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('calendar');

  // Memoize filters to prevent infinite loop - only recreate when dependencies change
  const filters = useMemo(() => ({
    selectedStudents,
    selectedTutors,
    selectedParents,
    selectedSubjects,
    selectedLessonType
  }), [selectedStudents, selectedTutors, selectedParents, selectedSubjects, selectedLessonType]);

  // Helper function to update date ranges for teacher view
  const updateTeacherViewDateRanges = (viewType: string, date: Date) => {
    if (viewType === 'teacherDay') {
      // For day view, use the single day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      setCurrentStartDate(startOfDay);
      setCurrentEndDate(endOfDay);
    } else if (viewType === 'teacherWeek') {
      // For week view, use the entire week
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start on Monday
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      setCurrentStartDate(startOfWeek);
      setCurrentEndDate(endOfWeek);
    }
  };

  // Determine the active view type based on current tab
  const activeViewType = activeTab === 'teacher' ? teacherViewType : currentViewType;

  // Initialize teacher view date ranges when switching to teacher tab
  useEffect(() => {
    if (activeTab === 'teacher') {
      updateTeacherViewDateRanges(teacherViewType, currentDate);
    }
  }, [activeTab, teacherViewType]);

  // Fetch calendar data using the hook with date range
  const { events, isLoading } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    refreshKey,
    startDate: currentStartDate,
    endDate: currentEndDate,
    viewType: activeViewType,
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

  const handleSubjectFilterChange = (subjects: string[]) => {
    setSelectedSubjects(subjects);
  };

  const handleLessonTypeFilterChange = (lessonType: string) => {
    setSelectedLessonType(lessonType);
  };

  const handleClearFilters = () => {
    setSelectedStudents([]);
    setSelectedTutors([]);
    setSelectedParents([]);
    setSelectedSubjects([]);
    setSelectedLessonType('All Lessons');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle view change from calendar
  const handleViewChange = (viewInfo: { start: Date; end: Date; view: string }) => {
    setCurrentStartDate(viewInfo.start);
    setCurrentEndDate(viewInfo.end);
    setCurrentViewType(viewInfo.view);
    setCurrentDate(viewInfo.start);
  };

  // Handle view type change from ViewOptions
  const handleViewTypeChange = (viewType: string) => {
    if (activeTab === 'teacher') {
      setTeacherViewType(viewType);
      // Update date ranges for teacher view
      updateTeacherViewDateRanges(viewType, currentDate);
    } else {
      setCurrentViewType(viewType);
    }
  };

  // Check if user can see filters (admin/owner only for full filters)
  const canUseFilters = userRole === 'admin' || userRole === 'owner';

  // Only allow admins and owners to schedule lessons and see teacher view
  const canScheduleLessons = userRole === 'admin' || userRole === 'owner';
  const canUseTeacherView = userRole === 'admin' || userRole === 'owner';
  
  // Check user roles for topic request button
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';

  const openAddLessonDialog = () => {
    setShowAddLessonDialog(true);
  };

  const closeAddLessonDialog = () => {
    setShowAddLessonDialog(false);
  };

  const handleLessonAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle date navigation for teacher view
  const handleTeacherDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    updateTeacherViewDateRanges(teacherViewType, newDate);
  };

  // If user has learning_hub_only role, show locked feature
  if (isLearningHubOnly) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex flex-col flex-1 w-full">
          <MobileMenuButton toggleSidebar={toggleSidebar} />
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
        <MobileMenuButton toggleSidebar={toggleSidebar} />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-background">
          {/* Hero header */}
          <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4">
            <CalendarHero
              canUseFilters={canUseFilters}
              filtersOpen={filtersOpen}
              onToggleFilters={toggleFilters}
              canScheduleLessons={canScheduleLessons}
              onSchedule={openAddLessonDialog}
              showFamilyActions={!canUseFilters && (isStudent || isParent)}
              onRequestTopic={() => setShowTopicRequestDialog(true)}
              onReferFriend={() => setShowReferFriendDialog(true)}
            />
          </div>
          
          {/* Tabbed Calendar Interface */}
          <div className="flex-1 overflow-hidden px-4 md:px-8 pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <TabsList className="h-12 rounded-full bg-card p-1 shadow-[var(--shadow-soft)]">
                  <TabsTrigger
                    value="calendar"
                    className="rounded-full px-5 h-10 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                  >
                    Calendar view
                  </TabsTrigger>
                  {canUseTeacherView && (
                    <TabsTrigger
                      value="teacher"
                      className="rounded-full px-5 h-10 text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                    >
                      Teacher view
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {/* View Options for active tab */}
                <ViewOptions 
                  currentView={activeTab === 'teacher' ? teacherViewType : currentViewType}
                  onViewChange={handleViewTypeChange}
                  showTeacherView={false}
                />
              </div>


              <TabsContent value="calendar" className="flex-1 mt-0 min-w-0">
                <CalendarDisplay 
                  isLoading={isLoading} 
                  events={events} 
                  onLessonsUpdated={handleRefresh}
                  onViewChange={handleViewChange}
                  viewType={currentViewType}
                />

              </TabsContent>

              {canUseTeacherView && (
                <TabsContent value="teacher" className="flex-1 mt-0 min-w-0 overflow-hidden">
                  <TeacherCalendarView
                    events={events}
                    viewType={teacherViewType as 'teacherWeek' | 'teacherDay'}
                    currentDate={currentDate}
                    isLoading={isLoading}
                    onLessonsUpdated={handleRefresh}
                    onDateChange={handleTeacherDateChange}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>

      {/* Fixed Positioned Filters Sidebar */}
      <CollapsibleFilters
            selectedStudents={selectedStudents}
            selectedTutors={selectedTutors}
            selectedParents={selectedParents}
            selectedSubjects={selectedSubjects}
            selectedLessonType={selectedLessonType}
            onStudentFilterChange={handleStudentFilterChange}
            onTutorFilterChange={handleTutorFilterChange}
            onParentFilterChange={setSelectedParents}
            onSubjectFilterChange={handleSubjectFilterChange}
            onLessonTypeFilterChange={handleLessonTypeFilterChange}
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

      {/* Topic Request Dialog for students and parents */}
      <TopicRequestDialog
        open={showTopicRequestDialog}
        onOpenChange={setShowTopicRequestDialog}
      />

      {/* Refer Friend Dialog for students and parents */}
      <ReferFriendDialog
        open={showReferFriendDialog}
        onOpenChange={setShowReferFriendDialog}
      />
    </>
  );
};

export default Calendar;
