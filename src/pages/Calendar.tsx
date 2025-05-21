import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/react';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import { Lesson } from '@/types/lesson';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import ViewOptions from '@/components/calendar/ViewOptions';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import { useOrganization } from '@/contexts/OrganizationContext';

const Calendar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isLessonDetailsOpen, setIsLessonDetailsOpen] = useState(false);
  const [isCompleteSessionOpen, setIsCompleteSessionOpen] = useState(false);
  const [isSettingHomework, setIsSettingHomework] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { organization } = useOrganization();
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  const justAddedLesson = useRef(false);

  const fetchLessons = useCallback(async (start: Date, end: Date) => {
    console.log("Calendar - fetchLessons called with:", { start, end });
    setIsLoading(true);
    try {
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");
      
      console.log("Calendar - Fetching lessons from", startDate, "to", endDate);

      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('organization_id', organization?.id)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

      if (error) throw error;
      
      console.log("Calendar - Fetched lessons:", data.length);

      // Transform the data for FullCalendar
      const events = data.map(lesson => {
        const students = lesson.lesson_students?.map((ls: any) => ls.student) || [];
        
        const studentNames = students
          .map((student: any) => `${student.first_name} ${student.last_name}`)
          .join(', ');
        
        const displayTitle = students.length > 0 
          ? `${lesson.title} - ${studentNames}`
          : lesson.title;
        
        let backgroundColor;
        let borderColor;
        
        switch (lesson.status) {
          case 'completed':
            backgroundColor = 'rgba(34, 197, 94, 0.2)';
            borderColor = 'rgb(34, 197, 94)';
            break;
          case 'cancelled':
            backgroundColor = 'rgba(239, 68, 68, 0.2)';
            borderColor = 'rgb(239, 68, 68)';
            break;
          default:
            backgroundColor = 'rgba(59, 130, 246, 0.2)';
            borderColor = 'rgb(59, 130, 246)';
        }

        if (lesson.is_recurring) {
          borderColor = 'rgb(168, 85, 247)';
        }
        
        return {
          id: lesson.id,
          title: displayTitle,
          start: lesson.start_time,
          end: lesson.end_time,
          backgroundColor,
          borderColor,
          textColor: 'black',
          extendedProps: {
            description: lesson.description,
            status: lesson.status,
            tutor: lesson.tutor,
            students,
            isRecurring: lesson.is_recurring
          }
        };
      });

      setLessons(events);
    } catch (error) {
      console.error('Calendar - Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedTimeSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsAddingLesson(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedLessonId(clickInfo.event.id);
    setIsLessonDetailsOpen(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const handleViewChange = (view: string) => {
    setCalendarView(view);
  };

  const forceCalendarRefresh = useCallback(() => {
    console.log("Calendar - forceCalendarRefresh called");
    
    try {
      // Try refreshing via the calendar ref API
      if (calendarRef.current) {
        const apiInstance = calendarRef.current.getApi();
        console.log("Calendar - Calendar API instance found, refreshing events");
        apiInstance.refetchEvents();
      } else {
        console.warn("Calendar - Calendar ref not available for refresh");
      }
    } catch (error) {
      console.error("Calendar - Error using calendar ref for refresh:", error);
    }
    
    // Always fetch new data as a backup, using a more comprehensive date range
    try {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      
      const end = new Date();
      end.setMonth(end.getMonth() + 3); // Extended time range for better coverage
      
      console.log("Calendar - Calling fetchLessons with extended date range");
      fetchLessons(start, end);
    } catch (error) {
      console.error("Calendar - Error in backup fetchLessons:", error);
      toast.error("Error refreshing calendar. Please try again.");
    }
  }, [fetchLessons]);

  const handleAddLessonSuccess = useCallback(() => {
    console.log("Calendar - handleAddLessonSuccess called - PROCESSING START");
    
    // Set the ref to indicate a lesson was just added
    justAddedLesson.current = true;
    
    // Reset all form-related state
    setIsAddingLesson(false);
    setSelectedTimeSlot(null);
    
    console.log("Calendar - Dialog states reset, scheduling calendar refresh");
    
    // Use a longer timeout to ensure database transaction completes
    setTimeout(() => {
      console.log("Calendar - Executing delayed calendar refresh");
      forceCalendarRefresh();
      toast.success('Lesson added successfully!');
      console.log("Calendar - handleAddLessonSuccess COMPLETE");
      
      // Reset the flag after using it
      setTimeout(() => {
        justAddedLesson.current = false;
      }, 500);
    }, 2000); // Increased timeout for better reliability
  }, [forceCalendarRefresh]);

  const handleEditLessonSuccess = () => {
    setIsEditingLesson(false);
    setSelectedLessonId(null);
    
    // Add a small delay to ensure that the database operation is complete
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Lesson updated successfully!');
    }, 300);
  };

  const handleDeleteLesson = async (lessonId: string, deleteAllFuture?: boolean) => {
    try {
      // Basic deletion for a single lesson
      if (!deleteAllFuture) {
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
      } 
      // Handle deleting a recurring lesson and all its future occurrences
      else {
        const { data: lessonData, error: fetchError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (fetchError) throw fetchError;
        
        if (lessonData?.is_recurring) {
          const { error: deleteError } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);
            
          if (deleteError) throw deleteError;
          
          toast.success('Recurring lesson deleted successfully');
        } else {
          const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);

          if (error) throw error;
        }
      }

      setSelectedLessonId(null);
      setIsLessonDetailsOpen(false);
      
      // Force refresh the calendar
      if (calendarRef.current) {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.refetchEvents();
      }
      
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      fetchLessons(start, end);
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleViewLessonDetails = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setIsLessonDetailsOpen(false);
    setIsEditingLesson(true);
  };

  const handleCompleteSession = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(false);
    // First set homework, then move to complete session
    setIsSettingHomework(true);
    setIsCompleteSessionOpen(false); // Make sure the attendance dialog is closed
  };

  const handleHomeworkSuccess = () => {
    console.log('Homework assigned successfully, moving to attendance step');
    // After setting homework, move to the attendance and feedback step
    setIsSettingHomework(false);
    setIsCompleteSessionOpen(true);
  };

  const handleCompleteSessionSuccess = () => {
    setIsCompleteSessionOpen(false);
    setSelectedLessonId(null);
    
    // Add a small delay to ensure that database operations complete
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Session completed successfully!');
    }, 300);
  };

  const handleAddLessonClose = useCallback(() => {
    console.log("Calendar - handleAddLessonClose called");
    
    // Only reset state if we're not in the success path (to avoid state conflicts)
    if (!justAddedLesson.current) {
      setIsAddingLesson(false);
      setSelectedTimeSlot(null);
    }
  }, []);

  useEffect(() => {
    const start = calendarView === 'dayGridMonth' 
      ? startOfMonth(currentDate)
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
    
    const end = calendarView === 'dayGridMonth'
      ? endOfMonth(currentDate)
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 14);

    console.log("Calendar - Initial fetchLessons called from useEffect", { start, end });
    fetchLessons(start, end);
  }, [fetchLessons, currentDate, calendarView, organization?.id]);

  useEffect(() => {
    console.log("Calendar - isAddingLesson state changed:", isAddingLesson);
  }, [isAddingLesson]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            </div>
            <div className="flex items-center gap-2">
              <ViewOptions currentView={calendarView} onViewChange={handleViewChange} />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-[100px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex items-center gap-2" onClick={() => setIsAddingLesson(true)}>
                <Plus className="h-4 w-4" />
                New Lesson
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Lessons Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2">Loading calendar...</p>
                  </div>
                </div>
              ) : (
                <div className="h-[600px]">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={false}
                    initialView={calendarView}
                    events={lessons}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={3}
                    weekends={true}
                    select={handleDateSelect}
                    eventClick={handleEventClick}
                    height="100%"
                    allDaySlot={false}
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00"
                    expandRows={true}
                    stickyHeaderDates={true}
                    nowIndicator={true}
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: 'short'
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Improved AddLessonForm implementation with better dialog control */}
      <AddLessonForm
        isOpen={isAddingLesson}
        onClose={handleAddLessonClose}
        onSuccess={handleAddLessonSuccess}
        preselectedTime={selectedTimeSlot}
      />

      {/* Edit Lesson Dialog */}
      <EditLessonForm
        isOpen={isEditingLesson}
        onClose={() => {
          setIsEditingLesson(false);
          setSelectedLessonId(null);
        }}
        lessonId={selectedLessonId}
        onSuccess={handleEditLessonSuccess}
      />

      {/* Lesson Details Dialog */}
      <LessonDetailsDialog
        lessonId={selectedLessonId}
        isOpen={isLessonDetailsOpen}
        onClose={() => setIsLessonDetailsOpen(false)}
        onDelete={handleDeleteLesson}
        onSave={handleEditLesson}
        onCompleteSession={handleCompleteSession}
      />

      {/* Set Homework Dialog (first step of completion flow) */}
      <CompleteSessionDialog
        lessonId={selectedLessonId}
        isOpen={isSettingHomework}
        onClose={() => setIsSettingHomework(false)}
        onSuccess={handleHomeworkSuccess}
        skipHomeworkStep={false}
      />

      {/* Complete Session Dialog (second step of completion flow) */}
      <CompleteSessionDialog
        lessonId={selectedLessonId}
        isOpen={isCompleteSessionOpen}
        onClose={() => setIsCompleteSessionOpen(false)}
        onSuccess={handleCompleteSessionSuccess}
        skipHomeworkStep={true}
      />
    </div>
  );
};

export default Calendar;
