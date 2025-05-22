import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, addDays, addWeeks, eachDayOfInterval, subDays, subWeeks, subMonths, startOfWeek, endOfWeek } from 'date-fns';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Checkbox
} from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const CalendarPage = () => {
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
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudentId, setFilteredStudentId] = useState<string | null>(null);
  const [filteredParentId, setFilteredParentId] = useState<string | null>(null);
  const [parentsList, setParentsList] = useState<{id: string, name: string}[]>([]);
  const [showRecurringLessons, setShowRecurringLessons] = useState(true);
  const [visibleDateRange, setVisibleDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(),
    end: new Date()
  });
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendarComponent | null>(null);

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

  const fetchLessons = useCallback(async (start: Date, end: Date) => {
    console.log("Calendar - fetchLessons called with:", { 
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd")
    });
    
    setIsLoading(true);
    try {
      const startDate = format(start, "yyyy-MM-dd");
      const endDate = format(end, "yyyy-MM-dd");
      
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
      
      console.log("Calendar - Fetched lessons:", data?.length);

      // Also fetch recurring lessons that might extend beyond the current view
      const { data: recurringData, error: recurringError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name, parent_first_name, parent_last_name)
          )
        `)
        .eq('is_recurring', true)
        .gte('start_time', `${format(new Date(start.getFullYear(), start.getMonth() - 1, 1), "yyyy-MM-dd")}T00:00:00`);
        
      if (recurringError) throw recurringError;
      
      // Combine regular and recurring lessons
      let allLessons = (data || []) as Lesson[];
      
      // If showRecurringLessons is true, add recurring instances
      if (showRecurringLessons && recurringData) {
        const recurringLessons = (recurringData.filter(lesson => {
          // Filter out recurring lessons that are in the past or have ended
          if (!lesson.is_recurring || lesson.status === 'cancelled') return false;
          
          // Check if this recurring lesson's end date is in the future or null
          if (lesson.recurrence_end_date) {
            const endDateParsed = parseISO(lesson.recurrence_end_date);
            if (endDateParsed < start) return false;
          }
          
          return true;
        })) as Lesson[];
        
        // Generate instances for each recurring lesson
        recurringLessons.forEach(lesson => {
          if (!lesson.recurrence_interval) return;
          
          // Generate instances based on recurrence_interval
          const interval = lesson.recurrence_interval;
          const startDateOriginal = parseISO(lesson.start_time);
          const endDateOriginal = parseISO(lesson.end_time);
          const durationMs = endDateOriginal.getTime() - startDateOriginal.getTime();
          
          // Get all dates in the current calendar view
          const datesInView = eachDayOfInterval({ start, end });
          
          datesInView.forEach(date => {
            // For weekly recurrence, check if this is the correct day of week
            if (interval === 'weekly') {
              if (date.getDay() !== startDateOriginal.getDay()) return;
            } 
            // For biweekly (fortnightly) recurrence
            else if (interval === 'biweekly') {
              if (date.getDay() !== startDateOriginal.getDay()) return;
              
              // Check if this is the correct biweekly cadence
              const weeksDiff = Math.floor((date.getTime() - startDateOriginal.getTime()) / (7 * 24 * 60 * 60 * 1000));
              if (weeksDiff % 2 !== 0) return;
            }
            // For monthly recurrence, check if this is the correct day of month
            else if (interval === 'monthly') {
              if (date.getDate() !== startDateOriginal.getDate()) return;
            }
            
            // Skip dates that are before the original start date
            if (date < startDateOriginal) return;
            
            // Skip if we've passed the recurrence end date
            if (lesson.recurrence_end_date && date > parseISO(lesson.recurrence_end_date)) return;
            
            // Check if this date already exists in regular lessons (to avoid duplicates)
            const formattedDate = format(date, 'yyyy-MM-dd');
            const exists = data.some(l => 
              format(parseISO(l.start_time), 'yyyy-MM-dd') === formattedDate && 
              l.title === lesson.title
            );
            
            if (!exists) {
              // Create a new instance with the correct date but keeping the original time
              const newStartDate = new Date(date);
              newStartDate.setHours(startDateOriginal.getHours());
              newStartDate.setMinutes(startDateOriginal.getMinutes());
              newStartDate.setSeconds(0);
              
              const newEndDate = new Date(newStartDate.getTime() + durationMs);
              
              // Create a unique ID for this recurring instance
              const instanceId = `${lesson.id}-${format(date, 'yyyy-MM-dd')}`;
              
              const recurringInstance = {
                ...lesson,
                id: instanceId,
                start_time: format(newStartDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
                end_time: format(newEndDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
                is_recurring_instance: true
              } as Lesson;
              
              allLessons.push(recurringInstance);
            }
          });
        });
      }
      
      // Apply student filter if set
      if (filteredStudentId) {
        allLessons = allLessons.filter(lesson => 
          lesson.lesson_students?.some((ls: any) => ls.student.id.toString() === filteredStudentId)
        );
      }
      
      // Apply parent filter if set
      if (filteredParentId) {
        allLessons = allLessons.filter(lesson => 
          lesson.lesson_students?.some((ls: any) => {
            const student = ls.student;
            if (student && student.parent_first_name && student.parent_last_name) {
              const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
              return parentId === filteredParentId;
            }
            return false;
          })
        );
      }

      // Transform the data for FullCalendar
      const events = allLessons.map(lesson => {
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

        if (lesson.is_recurring || lesson.is_recurring_instance) {
          borderColor = 'rgb(168, 85, 247)';
          if (lesson.is_recurring_instance) {
            backgroundColor = 'rgba(168, 85, 247, 0.15)';
          }
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
            isRecurring: lesson.is_recurring,
            isRecurringInstance: lesson.is_recurring_instance
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
  }, [filteredStudentId, filteredParentId, showRecurringLessons]);

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
  
  const handleDatesSet = (info: DatesSetArg) => {
    const newVisibleRange = {
      start: info.start,
      end: info.end
    };
    
    console.log("Calendar - DatesSet event triggered:", {
      view: info.view.type,
      start: format(info.start, "yyyy-MM-dd"),
      end: format(info.end, "yyyy-MM-dd"),
      currentDate: format(info.view.currentStart, "yyyy-MM-dd")
    });
    
    // Update current date from the calendar's view
    setCurrentDate(info.view.currentStart);
    
    // Update visible date range
    setVisibleDateRange(newVisibleRange);
    
    // Fetch lessons for the new date range
    fetchLessons(info.start, info.end);
  };

  // Get a formatted display for the current date based on the view
  const getDateDisplay = () => {
    if (calendarView === 'dayGridMonth') {
      return format(currentDate, 'MMMM yyyy');
    } else if (calendarView === 'timeGridWeek') {
      // Start of the week that contains the current date
      const weekStart = startOfWeek(currentDate);
      return `Week of ${format(weekStart, 'MMMM d, yyyy')}`;
    } else {
      // For day view
      return format(currentDate, 'MMMM d, yyyy');
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
      }
    }
  };

  const handleViewChange = (view: string) => {
    // Get the current date before changing the view
    const dateToKeep = currentDate;
    
    setCalendarView(view);
    
    // When changing view, ensure the calendar stays on the current date
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        apiInstance.changeView(view);
        apiInstance.gotoDate(dateToKeep);
      } catch (error) {
        console.error("Error changing calendar view:", error);
      }
    }
  };

  const forceCalendarRefresh = useCallback(() => {
    console.log("Calendar - forceCalendarRefresh called");
    
    // Refresh via calendar API if available
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        console.log("Calendar - Refreshing events via calendar API");
        apiInstance.refetchEvents();
        
        // Get the visible range directly from the calendar
        const view = apiInstance.view;
        const visibleStart = view.activeStart;
        const visibleEnd = view.activeEnd;
        
        // Fetch lessons for the current visible range
        fetchLessons(visibleStart, visibleEnd);
      } catch (error) {
        console.error("Calendar - Error using calendar API:", error);
        
        // Fallback to the current visible range
        fetchLessons(visibleDateRange.start, visibleDateRange.end);
      }
    }
  }, [fetchLessons, visibleDateRange]);

  const handleAddLessonSuccess = () => {
    console.log("Calendar - Lesson added successfully");
    setIsAddingLesson(false);
    setSelectedTimeSlot(null);
    
    // Force refresh calendar events
    setTimeout(() => {
      forceCalendarRefresh();
      toast.success('Lesson added successfully!');
    }, 500);
  };

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

  const handleFilterReset = () => {
    setFilteredStudentId(null);
    setFilteredParentId(null);
    forceCalendarRefresh();
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
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="showRecurring" 
                          checked={showRecurringLessons}
                          onCheckedChange={(checked) => {
                            setShowRecurringLessons(checked === true);
                          }}
                        />
                        <Label htmlFor="showRecurring">Show recurring lessons</Label>
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
                    datesSet={handleDatesSet}
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
