
import React, { useState, useCallback } from 'react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import ViewOptions from '@/components/calendar/ViewOptions';
import CalendarRefreshButton from '@/components/calendar/CalendarRefreshButton';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useStudentLessonUpdates } from '@/hooks/useStudentLessonUpdates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Calendar = () => {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonDetailsOpen, setIsLessonDetailsOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isCompleteSessionOpen, setIsCompleteSessionOpen] = useState(false);
  const [isAssignHomeworkOpen, setIsAssignHomeworkOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [homeworkLessonData, setHomeworkLessonData] = useState<any>(null);

  // Check if user is a student
  const isStudent = userRole === 'student';

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const { events, isLoading } = useCalendarData({ 
    userRole, 
    userEmail: user?.email || null, 
    isAuthenticated: !!user,
    refreshKey 
  });

  // Initialize student lesson updates system
  const {
    isUpdating,
    lastUpdateTime,
    refreshStudentCalendar,
    updateStudentLessonStatus,
    syncLessonSpaceUrls
  } = useStudentLessonUpdates({
    userRole,
    userEmail: user?.email || null,
    isAuthenticated: !!user,
    onLessonUpdate: handleRefresh
  });

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleEventClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string, deleteAllFuture = false) => {
    try {
      if (deleteAllFuture) {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
        toast.success('Recurring lesson series deleted successfully');
      } else {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
        toast.success('Lesson deleted successfully');
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleCompleteSession = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsCompleteSessionOpen(true);
  };

  const handleAssignHomework = (lessonId: string, lessonData: any) => {
    setSelectedLessonId(lessonId);
    setHomeworkLessonData(lessonData);
    setIsAssignHomeworkOpen(true);
  };

  const handleSessionCompleted = () => {
    setIsCompleteSessionOpen(false);
    handleRefresh();
    toast.success('Session completed successfully');
  };

  const handleHomeworkAssigned = () => {
    setIsAssignHomeworkOpen(false);
    setHomeworkLessonData(null);
    handleRefresh();
    toast.success('Homework assigned successfully');
  };

  const handleLessonAdded = () => {
    setIsAddLessonOpen(false);
    handleRefresh();
    toast.success('Lesson added successfully');
  };

  // Convert view to FullCalendar view format
  const getFullCalendarView = (view: 'month' | 'week' | 'day') => {
    switch (view) {
      case 'month':
        return 'dayGridMonth';
      case 'week':
        return 'timeGridWeek';
      case 'day':
        return 'timeGridDay';
      default:
        return 'dayGridMonth';
    }
  };

  const handleViewChange = (newView: string) => {
    switch (newView) {
      case 'dayGridMonth':
        setView('month');
        break;
      case 'timeGridWeek':
        setView('week');
        break;
      case 'timeGridDay':
        setView('day');
        break;
    }
  };

  // Enhanced refresh function that uses the student updates system
  const handleCalendarRefresh = async () => {
    if (userRole === 'student') {
      await refreshStudentCalendar();
    } else {
      handleRefresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-0">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Calendar" 
            subtitle="Manage your lessons and sessions."
          />
          
          <div className="space-y-6">
            <CalendarHeader />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ViewOptions 
                currentView={getFullCalendarView(view)} 
                onViewChange={handleViewChange}
              />
              
              <CalendarRefreshButton
                onRefresh={handleCalendarRefresh}
                isRefreshing={isUpdating || isLoading}
                lastUpdateTime={lastUpdateTime}
                userRole={userRole || 'student'}
              />
            </div>
            
            <CalendarDisplay
              events={events}
              isLoading={isLoading}
            />

            <LessonDetailsDialog
              isOpen={isLessonDetailsOpen}
              onClose={() => {
                setIsLessonDetailsOpen(false);
                setSelectedLessonId(null);
              }}
              lessonId={selectedLessonId}
              onDelete={!isStudent ? handleDeleteLesson : undefined}
              onCompleteSession={!isStudent ? handleCompleteSession : undefined}
              onAssignHomework={!isStudent ? handleAssignHomework : undefined}
              onRefresh={handleRefresh}
            />

            {/* Only show Add Lesson form for non-students */}
            {!isStudent && (
              <AddLessonForm
                isOpen={isAddLessonOpen}
                onClose={() => setIsAddLessonOpen(false)}
                onSuccess={handleLessonAdded}
              />
            )}

            {/* Only show Complete Session dialog for non-students */}
            {!isStudent && (
              <CompleteSessionDialog
                isOpen={isCompleteSessionOpen}
                onClose={() => setIsCompleteSessionOpen(false)}
                lessonId={selectedLessonId}
                onSuccess={handleSessionCompleted}
              />
            )}

            {/* Only show Assign Homework dialog for non-students */}
            {!isStudent && (
              <AssignHomeworkDialog
                isOpen={isAssignHomeworkOpen}
                onClose={() => {
                  setIsAssignHomeworkOpen(false);
                  setHomeworkLessonData(null);
                }}
                preSelectedLessonId={selectedLessonId}
                preloadedLessonData={homeworkLessonData}
                onSuccess={handleHomeworkAssigned}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calendar;
