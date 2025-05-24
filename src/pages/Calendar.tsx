
import React, { useState, useCallback } from 'react';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import ViewOptions from '@/components/calendar/ViewOptions';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarData } from '@/hooks/useCalendarData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Calendar = () => {
  const { user, userRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonDetailsOpen, setIsLessonDetailsOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isCompleteSessionOpen, setIsCompleteSessionOpen] = useState(false);
  const [isAssignHomeworkOpen, setIsAssignHomeworkOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [homeworkLessonData, setHomeworkLessonData] = useState<any>(null);

  const { events, isLoading } = useCalendarData({ 
    userRole, 
    userEmail: user?.email || null, 
    isAuthenticated: !!user,
    refreshKey 
  });

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleEventClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string, deleteAllFuture = false) => {
    try {
      if (deleteAllFuture) {
        // Delete the main lesson (this will cascade to all instances due to recurrence)
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
        toast.success('Recurring lesson series deleted successfully');
      } else {
        // Delete just this lesson
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CalendarHeader 
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAddLesson={() => setIsAddLessonOpen(true)}
        userRole={userRole}
      />
      
      <ViewOptions 
        view={view} 
        onViewChange={setView} 
      />
      
      <CalendarDisplay
        events={events}
        currentDate={currentDate}
        view={view}
        onEventClick={handleEventClick}
        isLoading={isLoading}
      />

      <LessonDetailsDialog
        isOpen={isLessonDetailsOpen}
        onClose={() => {
          setIsLessonDetailsOpen(false);
          setSelectedLessonId(null);
        }}
        lessonId={selectedLessonId}
        onDelete={handleDeleteLesson}
        onCompleteSession={handleCompleteSession}
        onAssignHomework={handleAssignHomework}
        onRefresh={handleRefresh}
      />

      <AddLessonForm
        isOpen={isAddLessonOpen}
        onClose={() => setIsAddLessonOpen(false)}
        onSuccess={handleLessonAdded}
      />

      <CompleteSessionDialog
        isOpen={isCompleteSessionOpen}
        onClose={() => setIsCompleteSessionOpen(false)}
        lessonId={selectedLessonId}
        onSuccess={handleSessionCompleted}
      />

      <AssignHomeworkDialog
        isOpen={isAssignHomeworkOpen}
        onClose={() => {
          setIsAssignHomeworkOpen(false);
          setHomeworkLessonData(null);
        }}
        lessonId={selectedLessonId}
        lessonData={homeworkLessonData}
        onSuccess={handleHomeworkAssigned}
      />
    </div>
  );
};

export default Calendar;
