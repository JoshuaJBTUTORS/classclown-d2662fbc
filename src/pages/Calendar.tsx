
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addDays, subDays, startOfWeek, endOfWeek, isValid } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/react';

import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import { Lesson } from '@/types/lesson';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Filter, Check } from 'lucide-react';
import ViewOptions from '@/components/calendar/ViewOptions';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Checkbox
} from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CalendarPage = () => {
  // State variables
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
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudentId, setFilteredStudentId] = useState<string | null>(null);
  const [filteredParentId, setFilteredParentId] = useState<string | null>(null);
  const [parentsList, setParentsList] = useState<{id: string, name: string}[]>([]);
  const [showRecurringLessons, setShowRecurringLessons] = useState(true);
  
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  // Safety function for date formatting
  const safeFormatDate = (date: Date | string, formatString: string): string => {
    try {
      let dateObj: Date;
      
      if (typeof date === 'string') {
        dateObj = parseISO(date);
      } else {
        dateObj = date;
      }
      
      if (!isValid(dateObj)) {
        console.error("Invalid date object:", date);
        return "Invalid date";
      }
      
      return format(dateObj, formatString);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Error formatting date";
    }
  };

  // Set a loading timeout to exit loading state after a reasonable time
  useEffect(() => {
    if (isLoading) {
      console.log("Calendar - Setting up loading timeout");
      loadingTimeoutRef.current = window.setTimeout(() => {
        console.log("Calendar - Loading timeout triggered");
        setIsLoading(false);
        setLoadingError("Loading timed out. Please try refreshing the page.");
        toast.error("Calendar loading timed out. Please try refreshing the page.");
      }, 8000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [isLoading]);

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

  // Main function to fetch lessons data
  const fetchLessons = useCallback(async (start: Date, end: Date) => {
    console.log("Calendar - fetchLessons called with:", { 
      start: start.toISOString(), 
      end: end.toISOString() 
    });
    
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      if (!isValid(start) || !isValid(end)) {
        throw new Error("Invalid date range provided to fetchLessons");
      }
      
      const startDate = safeFormatDate(start, "yyyy-MM-dd");
      const endDate = safeFormatDate(end, "yyyy-MM-dd");
      
      console.log("Calendar - Fetching lessons from", startDate, "to", endDate);

      // Main query for scheduled lessons
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, parent_first_name, parent_last_name)
          )
        `)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`);

      if (error) throw error;
      
      // Transform the data for FullCalendar
      const events = (data || []).map(lesson => {
        try {
          const students = lesson.lesson_students?.map((ls: any) => ls.student) || [];
          
          const studentNames = students
            .map((student: any) => `${student?.first_name || ''} ${student?.last_name || ''}`)
            .filter(name => name.trim() !== '')
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
        } catch (eventError) {
          console.error("Error transforming lesson to event:", eventError, lesson);
          return null;
        }
      }).filter(event => event !== null);

      setLessons(events);
      
      // Clear the loading timeout if data loaded successfully
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Calendar - Error fetching lessons:', error);
      toast.error('Failed to load lessons');
      setLoadingError('Failed to load lessons. Please refresh the page.');
      setIsLoading(false);
    }
  }, [filteredStudentId, filteredParentId]);

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

  // Get a formatted display for the current date based on the view
  const getDateDisplay = () => {
    try {
      if (calendarView === 'dayGridMonth') {
        return safeFormatDate(currentDate, 'MMMM yyyy');
      } else if (calendarView === 'timeGridWeek') {
        // Start of the week that contains the current date
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start week on Monday (1)
        return `Week of ${safeFormatDate(weekStart, 'MMMM d, yyyy')}`;
      } else {
        // For day view
        return safeFormatDate(currentDate, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error("Error formatting date display:", error);
      return "Error displaying date";
    }
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
      } catch (error) {
        console.error("Calendar - Error using calendar API:", error);
        
        // Fallback method if API fails
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          const currentView = api.view;
          fetchLessons(currentView.activeStart, currentView.activeEnd);
        }
      }
    }
  }, [fetchLessons]);

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
    
    fetchLessons(start, end);
  }, [fetchLessons]);

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
    
    fetchLessons(start, end);
  }, [fetchLessons]);

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
    setIsCompleteSessionOpen(false);
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

  const handleFilterReset = () => {
    setFilteredStudentId(null);
    setFilteredParentId(null);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center mr-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2" size="sm">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Filter Options</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="student-filter">Filter by Student</Label>
                        <Select
                          value={filteredStudentId || "none"}
                          onValueChange={(value) => {
                            setFilteredStudentId(value === "none" ? null : value);
                          }}
                        >
                          <SelectTrigger id="student-filter">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">All Students</SelectItem>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.first_name} {student.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parent-filter">Filter by Parent</Label>
                        <Select
                          value={filteredParentId || "none"}
                          onValueChange={(value) => {
                            setFilteredParentId(value === "none" ? null : value);
                          }}
                        >
                          <SelectTrigger id="parent-filter">
                            <SelectValue placeholder="Select a parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">All Parents</SelectItem>
                            {parentsList.map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                {parent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={handleFilterReset} variant="outline" size="sm">
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <ViewOptions currentView={calendarView} onViewChange={handleViewChange} />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNavigatePrevious}
                  title={`Previous ${calendarView === 'dayGridMonth' ? 'Month' : calendarView === 'timeGridWeek' ? 'Week' : 'Day'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateToToday}
                  className="text-xs"
                >
                  Today
                </Button>
                <div className="text-sm font-medium min-w-[140px] text-center">
                  {getDateDisplay()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNavigateNext}
                  title={`Next ${calendarView === 'dayGridMonth' ? 'Month' : calendarView === 'timeGridWeek' ? 'Week' : 'Day'}`}
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
              ) : loadingError ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <p className="text-red-500 mb-2">{loadingError}</p>
                    <Button 
                      onClick={() => {
                        setIsLoading(true);
                        setLoadingError(null);
                        forceCalendarRefresh();
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-[600px] relative">
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
                    datesSet={handleCalendarDatesSet}
                    height="100%"
                    allDaySlot={false}
                    slotDuration="00:30:00"
                    slotLabelInterval="01:00"
                    expandRows={true}
                    stickyHeaderDates={true}
                    nowIndicator={true}
                    firstDay={1} 
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
