import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LockedFeature from '@/components/common/LockedFeature';
import { useTrialBooking } from '@/hooks/useTrialBooking';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import TeacherCalendarView from '@/components/calendar/TeacherCalendarView';
import ViewOptions from '@/components/calendar/ViewOptions';
import CollapsibleFilters from '@/components/calendar/CollapsibleFilters';
import { useCalendarData } from '@/hooks/useCalendarData';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Info, Filter } from 'lucide-react';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import { TopicRequestDialog } from '@/components/calendar/TopicRequestDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Calendar = () => {
  const { isLearningHubOnly, userRole, user, isStudent, isParent } = useAuth();
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
  const [topicRequestDialogOpen, setTopicRequestDialogOpen] = useState(false);

  // State for teacher view
  const [viewType, setViewType] = useState<'teacherWeek' | 'teacherDay'>('teacherWeek');
  const [currentDate, setCurrentDate] = useState(new Date());

  const {
    events,
    isLoading,
  } = useCalendarData({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    refreshKey,
  });

  const canScheduleLessons = userRole === 'admin' || userRole === 'tutor';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const closeFilters = () => {
    setFiltersOpen(false);
  };

  const openAddLessonDialog = () => {
    setShowAddLessonDialog(true);
  };

  const closeAddLessonDialog = () => {
    setShowAddLessonDialog(false);
  };

  const handleLessonAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLessonsUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const openTopicRequestDialog = () => setTopicRequestDialogOpen(true);
  const closeTopicRequestDialog = () => setTopicRequestDialogOpen(false);

  const handleTopicRequestSuccess = () => {
    closeTopicRequestDialog();
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <div className="flex flex-col flex-1 w-full">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
          {/* Header with title and controls */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <PageTitle title="Calendar" />
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Button 
                  onClick={toggleFilters}
                  variant={filtersOpen ? "default" : "outline"}
                  size="sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>

                {canScheduleLessons && (
                  <Button onClick={openAddLessonDialog} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Lesson
                  </Button>
                )}
                {(isStudent || isParent) && (
                  <Button onClick={openTopicRequestDialog} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Topic
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="calendar" className="flex flex-col flex-1 h-full">
            <TabsList className="m-4">
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              {canScheduleLessons && (
                <TabsTrigger value="teacher">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Teacher View
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="calendar" className="h-full p-4">
                <CalendarDisplay
                  events={events}
                  isLoading={isLoading}
                  onLessonsUpdated={handleLessonsUpdated}
                />
              </TabsContent>
              {canScheduleLessons && (
                <TabsContent value="teacher" className="h-full p-4">
                  <TeacherCalendarView
                    events={events}
                    isLoading={isLoading}
                    viewType={viewType}
                    currentDate={currentDate}
                    onLessonsUpdated={handleLessonsUpdated}
                    onDateChange={setCurrentDate}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </main>
      </div>


      {canScheduleLessons && (
        <AddLessonForm 
          isOpen={showAddLessonDialog} 
          onClose={closeAddLessonDialog}
          onSuccess={handleLessonAdded}
        />
      )}

      <TopicRequestDialog
        open={topicRequestDialogOpen}
        onOpenChange={setTopicRequestDialogOpen}
        onSuccess={handleTopicRequestSuccess}
      />
    </>
  );
};

export default Calendar;
