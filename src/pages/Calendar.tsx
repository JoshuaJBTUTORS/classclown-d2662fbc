
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
import Navbar from '@/components/navigation/Navbar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info, Filter, MessageSquare, Users } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopicRequestDialog } from '@/components/calendar/TopicRequestDialog';
import { ReferFriendDialog } from '@/components/calendar/ReferFriendDialog';

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
    selectedSubjects,
    selectedLessonType
  }), [selectedStudents, selectedTutors, selectedSubjects, selectedLessonType]);

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
    setSelectedSubjects([]);
    setSelectedLessonType('All Lessons');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle view change from calendar
  const handleViewChange = (viewInfo: { start: Date; end: Date; view: string }) => {
    console.log('📅 View change received in Calendar:', viewInfo);
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
              
              <div className="flex flex-wrap gap-2 items-center">
                {/* Filter button - only show for admins and owners */}
                {canUseFilters && (
                  <Button 
                    onClick={toggleFilters}
                    variant={filtersOpen ? "default" : "outline"}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    size="sm"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{filtersOpen ? 'Hide Filters' : 'Show Filters'}</span>
                    <span className="sm:hidden">Filter</span>
                  </Button>
                )}

                {/* Topic Request button - only show for students and parents */}
                {!canUseFilters && (isStudent || isParent) && (
                  <>
                    <Button 
                      onClick={() => setShowTopicRequestDialog(true)}
                      variant="outline"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                      size="sm"
                    >
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Request Topic</span>
                      <span className="sm:hidden">Request</span>  
                    </Button>
                    
                    <Button 
                      onClick={() => setShowReferFriendDialog(true)}
                      variant="outline"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                      size="sm"
                    >
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Refer Friend £100</span>
                      <span className="sm:hidden">Refer £100</span>  
                    </Button>
                  </>
                )}

                {/* Schedule lesson button for admins and owners */}
                {canScheduleLessons && (
                  <Button 
                    onClick={openAddLessonDialog}
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    size="sm"
                  >
                    <CalendarPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Schedule Lesson</span>
                    <span className="sm:hidden">Schedule</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabbed Calendar Interface */}
          <div className="flex-1 overflow-hidden px-2 sm:px-4 pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  {canUseTeacherView && (
                    <TabsTrigger value="teacher">Teacher View</TabsTrigger>
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
        selectedSubjects={selectedSubjects}
        selectedLessonType={selectedLessonType}
        onStudentFilterChange={handleStudentFilterChange}
        onTutorFilterChange={handleTutorFilterChange}
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
