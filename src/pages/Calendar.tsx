
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/react';

import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarDisplay from '@/components/calendar/CalendarDisplay';
import { Lesson } from '@/types/lesson';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useAuth } from '@/contexts/AuthContext';

const CalendarPage = () => {
  // State for sidebar and UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  
  // State for lesson management
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
  
  // State for filters
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudentId, setFilteredStudentId] = useState<string | null>(null);
  const [filteredParentId, setFilteredParentId] = useState<string | null>(null);
  const [parentsList, setParentsList] = useState<{id: string, name: string}[]>([]);
  
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  
  // Use the custom hook for calendar data
  const { 
    lessons, 
    isLoading, 
    loadingError, 
    setIsLoading, 
    setLoadingError,
    fetchLessons 
  } = useCalendarData();

  // Fetch students for filters
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('first_name', { ascending: true });

        if (error) throw error;
        setStudents(data || []);
        
        // Extract unique parents for the parent filter
        const parents: {id: string, name: string}[] = [];
        const parentSet = new Set();
        
        data?.forEach(student => {
          if (student.parent_first_name && student.parent_last_name) {
            const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
            if (!parentSet.has(parentId)) {
              parentSet.add(parentId);
              parents.push({
                id: parentId,
                name: `${student.parent_first_name} ${student.parent_last_name}`
              });
            }
          }
        });
        
        setParentsList(parents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      }
    };

    fetchStudents();
  }, []);

  // Handle date selection
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedTimeSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setIsAddingLesson(true);
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedLessonId(clickInfo.event.id);
    setIsLessonDetailsOpen(true);
  };

  // Navigate backward (previous day, week, or month)
  const handleNavigatePrevious = () => {
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.prev();
      } catch (error) {
        console.error("Error navigating backward:", error);
        toast.error("Error navigating calendar");
      }
    }
  };

  // Navigate forward (next day, week, or month)
  const handleNavigateNext = () => {
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.next();
      } catch (error) {
        console.error("Error navigating forward:", error);
        toast.error("Error navigating calendar");
      }
    }
  };

  // Navigate to today
  const handleNavigateToToday = () => {
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.today();
      } catch (error) {
        console.error("Error navigating to today:", error);
        toast.error("Error navigating calendar");
      }
    }
  };

  // Handle view change
  const handleViewChange = (view: string) => {
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.changeView(view);
        setCalendarView(view);
      } catch (error) {
        console.error("Error changing calendar view:", error);
        toast.error("Error changing calendar view");
      }
    } else {
      setCalendarView(view);
    }
  };

  // Force calendar refresh
  const forceCalendarRefresh = useCallback(() => {
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.refetchEvents();
        
        // Also refetch the data
        const view = apiInstance.view;
        fetchLessons(view.activeStart, view.activeEnd, filteredStudentId, filteredParentId);
      } catch (error) {
        console.error("Calendar - Error using calendar API:", error);
        
        // Fallback method if API fails
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          const currentView = api.view;
          fetchLessons(currentView.activeStart, currentView.activeEnd, filteredStudentId, filteredParentId);
        }
      }
    }
  }, [fetchLessons, filteredStudentId, filteredParentId]);

  // Handle filter changes
  const handleFilterChange = (studentId: string | null, parentId: string | null) => {
    setFilteredStudentId(studentId);
    setFilteredParentId(parentId);
    
    // Refresh calendar with new filters
    setTimeout(() => {
      forceCalendarRefresh();
    }, 100);
  };

  // Handle filter reset
  const handleFilterReset = () => {
    setFilteredStudentId(null);
    setFilteredParentId(null);
    setTimeout(() => {
      forceCalendarRefresh();
    }, 100);
  };

  // Handle calendar initialization and datesSet event
  const handleCalendarDatesSet = useCallback((arg: DatesSetArg) => {
    console.log("Calendar - datesSet event triggered", {
      viewType: arg.view.type,
      start: arg.start,
      end: arg.end
    });
    
    // Update our state to match the calendar's current date
    setCurrentDate(arg.start);
    setCalendarView(arg.view.type);
    
    // Calculate the appropriate date range based on the current view
    let start: Date, end: Date;
    
    if (arg.view.type === 'dayGridMonth') {
      start = startOfMonth(arg.start);
      end = endOfMonth(arg.end);
    } else if (arg.view.type === 'timeGridWeek') {
      // For week view, get the start and end with buffer
      start = subDays(arg.start, 7); 
      end = addDays(arg.end, 7);
    } else {
      // For day view
      start = subDays(arg.start, 1);
      end = addDays(arg.end, 1);
    }
    
    // Fetch lessons with current filters
    fetchLessons(start, end, filteredStudentId, filteredParentId);
  }, [fetchLessons, filteredStudentId, filteredParentId]);

  // Initial load of calendar data
  useEffect(() => {
    const now = new Date();
    let start: Date, end: Date;
    
    if (calendarView === 'dayGridMonth') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else if (calendarView === 'timeGridWeek') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      // Day view - just use today
      start = now;
      end = now;
    }
    
    // Add buffer days to ensure we get enough data
    start = subDays(start, 7);
    end = addDays(end, 7);
    
    console.log("Calendar - Initial data load", { 
      start: start.toISOString(), 
      end: end.toISOString() 
    });
    
    fetchLessons(start, end, filteredStudentId, filteredParentId);
  }, [fetchLessons, filteredStudentId, filteredParentId]);

  // Event handlers for lesson management
  const handleAddLessonSuccess = () => {
    setIsAddingLesson(false);
    setSelectedTimeSlot(null);
    
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Lesson added successfully!');
    }, 500);
  };

  const handleEditLessonSuccess = () => {
    setIsEditingLesson(false);
    setSelectedLessonId(null);
    
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Lesson updated successfully!');
    }, 300);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setSelectedLessonId(null);
      setIsLessonDetailsOpen(false);
      
      forceCalendarRefresh();
      toast.success('Lesson deleted successfully');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setIsLessonDetailsOpen(false);
    setIsEditingLesson(true);
  };

  const handleCompleteSession = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(false);
    setIsSettingHomework(true);
  };

  const handleHomeworkSuccess = () => {
    setIsSettingHomework(false);
    setIsCompleteSessionOpen(true);
  };

  const handleCompleteSessionSuccess = () => {
    setIsCompleteSessionOpen(false);
    setSelectedLessonId(null);
    
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Session completed successfully!');
    }, 300);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setLoadingError(null);
    forceCalendarRefresh();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <CalendarHeader 
            currentDate={currentDate}
            calendarView={calendarView}
            onViewChange={handleViewChange}
            onNavigatePrevious={handleNavigatePrevious}
            onNavigateNext={handleNavigateNext}
            onNavigateToday={handleNavigateToToday}
            onAddLesson={() => setIsAddingLesson(true)}
            students={students}
            filteredStudentId={filteredStudentId}
            filteredParentId={filteredParentId}
            parentsList={parentsList}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
          />

          <CalendarDisplay 
            isLoading={isLoading}
            loadingError={loadingError}
            calendarView={calendarView}
            lessons={lessons}
            onSelectDate={handleDateSelect}
            onEventClick={handleEventClick}
            onDatesSet={handleCalendarDatesSet}
            onRetry={handleRetry}
            calendarRef={calendarRef}
          />
        </main>
      </div>

      {/* Add Lesson Form */}
      <AddLessonForm
        isOpen={isAddingLesson}
        onClose={() => setIsAddingLesson(false)}
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

export default CalendarPage;
