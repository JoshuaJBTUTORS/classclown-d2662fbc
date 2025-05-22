import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, addDays, addWeeks, eachDayOfInterval, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, isValid, isSameDay } from 'date-fns';
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
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Filter, Check, RefreshCw } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_RECURRING_INSTANCES = 30; // Limit recurring instances to prevent timeouts
const LOADING_TIMEOUT = 8000; // 8 seconds timeout

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    description?: string;
    status: string;
    tutor?: any;
    students?: any[];
    isRecurring?: boolean;
    isRecurringInstance?: boolean;
  };
}

const CalendarPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const [lessons, setLessons] = useState<CalendarEvent[]>([]);
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudentId, setFilteredStudentId] = useState<string | null>(null);
  const [filteredParentId, setFilteredParentId] = useState<string | null>(null);
  const [parentsList, setParentsList] = useState<{id: string, name: string}[]>([]);
  const [showRecurringLessons, setShowRecurringLessons] = useState(true);
  const [visibleDateRange, setVisibleDateRange] = useState<{start: Date, end: Date}>({
    start: new Date(),
    end: new Date()
  });
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const loadingTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  const calendarKey = useRef(`calendar-${Date.now()}`).current;
  
  // Cache for recurring events to avoid redundant calculations
  const recurringEventsCache = useRef<Map<string, CalendarEvent[]>>(new Map());

  // Setup loading timeout to prevent infinite loading state
  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
      
      // Reset progress bar
      setLoadingProgress(0);
      
      // Create progress timer
      const progressTimer = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return newProgress;
        });
      }, LOADING_TIMEOUT / 10);
      
      // Set a new timeout that will reset the loading state after timeout
      loadingTimeoutRef.current = window.setTimeout(() => {
        console.error('Calendar - Loading timeout exceeded, forcing reset');
        setIsLoading(false);
        setLoadingProgress(100);
        setLoadingError('Calendar data loading timed out. Please try refreshing.');
        clearInterval(progressTimer);
        
        // Abort any ongoing fetch operations
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }, LOADING_TIMEOUT);
      
      return () => {
        // Clear timers on cleanup
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        clearInterval(progressTimer);
      };
    } else if (loadingTimeoutRef.current) {
      // If not loading, clear the timeout
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
      setLoadingProgress(100); // Complete the progress bar
    }
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

  // Safe date parser to handle invalid dates
  const safeParseISO = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : null;
    } catch (e) {
      console.error('Failed to parse date:', dateString, e);
      return null;
    }
  };

  // Function to calculate recurring instances efficiently
  const calculateRecurringInstances = useCallback((
    lesson: Lesson, 
    viewStart: Date, 
    viewEnd: Date
  ): CalendarEvent[] => {
    // Skip if not recurring or missing necessary data
    if (!lesson.is_recurring || !lesson.recurrence_interval) {
      return [];
    }
    
    // Check if we already cached this calculation
    const cacheKey = `${lesson.id}-${viewStart.toISOString()}-${viewEnd.toISOString()}`;
    if (recurringEventsCache.current.has(cacheKey)) {
      return recurringEventsCache.current.get(cacheKey) || [];
    }
    
    try {
      const instances: CalendarEvent[] = [];
      const startDateOriginal = safeParseISO(lesson.start_time);
      const endDateOriginal = safeParseISO(lesson.end_time);
      const recurrenceEndDate = safeParseISO(lesson.recurrence_end_date);
      
      // Return empty array if dates are invalid
      if (!startDateOriginal || !endDateOriginal) {
        console.error('Invalid lesson dates:', lesson.id);
        return instances;
      }
      
      // Check if recurrence has ended
      if (recurrenceEndDate && recurrenceEndDate < viewStart) {
        return instances;
      }
      
      const durationMs = endDateOriginal.getTime() - startDateOriginal.getTime();
      const interval = lesson.recurrence_interval;
      let instanceCount = 0;
      
      // Generate a limited set of dates based on recurrence pattern
      // This is more efficient than generating all dates in the interval
      const generateRecurringDates = (): Date[] => {
        const dates: Date[] = [];
        let currentDate: Date;
        
        // Start from the original start date or view start, whichever is later
        if (startDateOriginal > viewStart) {
          currentDate = new Date(startDateOriginal);
        } else {
          // If the original date is before the view start, need to jump ahead
          currentDate = new Date(startDateOriginal);
          
          // For weekly recurrence, jump to the right day in the view
          if (interval === 'weekly') {
            const dayOfWeek = startDateOriginal.getDay();
            let daysToAdd = 0;
            
            // Find the next occurrence of the same day of week after viewStart
            while (currentDate < viewStart || currentDate.getDay() !== dayOfWeek) {
              currentDate = addDays(currentDate, 1);
            }
          }
          // For biweekly recurrence
          else if (interval === 'biweekly') {
            const dayOfWeek = startDateOriginal.getDay();
            const originalWeekNumber = Math.floor(startDateOriginal.getTime() / (7 * 24 * 60 * 60 * 1000));
            
            // Jump to first occurrence of the same day in the view
            while (currentDate < viewStart || currentDate.getDay() !== dayOfWeek) {
              currentDate = addDays(currentDate, 1);
            }
            
            // Ensure it's on the correct biweekly cadence
            const currentWeekNumber = Math.floor(currentDate.getTime() / (7 * 24 * 60 * 60 * 1000));
            if ((currentWeekNumber - originalWeekNumber) % 2 !== 0) {
              // If not on the correct cadence, jump ahead one more week
              currentDate = addDays(currentDate, 7);
            }
          }
          // For monthly recurrence
          else if (interval === 'monthly') {
            const dayOfMonth = startDateOriginal.getDate();
            currentDate = new Date(viewStart.getFullYear(), viewStart.getMonth(), dayOfMonth);
            
            // If we've already passed this day in the current month, move to next month
            if (currentDate < viewStart) {
              currentDate = new Date(viewStart.getFullYear(), viewStart.getMonth() + 1, dayOfMonth);
            }
          }
        }
        
        // Generate dates based on pattern until end of view
        while (currentDate <= viewEnd && instanceCount < MAX_RECURRING_INSTANCES) {
          // Skip if we've passed the recurrence end date
          if (recurrenceEndDate && currentDate > recurrenceEndDate) {
            break;
          }
          
          dates.push(new Date(currentDate));
          instanceCount++;
          
          // Move to next occurrence based on interval
          if (interval === 'weekly') {
            currentDate = addWeeks(currentDate, 1);
          } else if (interval === 'biweekly') {
            currentDate = addWeeks(currentDate, 2);
          } else if (interval === 'monthly') {
            // Handle edge case for months with different lengths
            const currentDay = currentDate.getDate();
            currentDate = addMonths(currentDate, 1);
            
            // Adjust if day of month doesn't exist in the next month
            const nextMonth = new Date(currentDate);
            if (nextMonth.getDate() !== currentDay) {
              // Set to last day of the previous month
              currentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0);
            }
          }
        }
        
        return dates;
      };
      
      // Generate recurring dates
      const recurringDates = generateRecurringDates();
      
      // Create event instances for each date
      recurringDates.forEach(date => {
        // Skip if this is the original instance date (to avoid duplicates)
        if (isSameDay(date, startDateOriginal)) {
          return;
        }
        
        // Create a new instance with the correct date but keeping the original time
        const newStartDate = new Date(date);
        newStartDate.setHours(startDateOriginal.getHours());
        newStartDate.setMinutes(startDateOriginal.getMinutes());
        newStartDate.setSeconds(0);
        
        const newEndDate = new Date(newStartDate.getTime() + durationMs);
        
        // Create a unique ID for this recurring instance
        const instanceId = `${lesson.id}-${format(date, 'yyyy-MM-dd')}`;
        
        // Get student names for display
        const students = lesson.students || [];
        const studentNames = students
          .map((student: any) => `${student.first_name} ${student.last_name}`)
          .join(', ');
        
        const displayTitle = students.length > 0 
          ? `${lesson.title} - ${studentNames}`
          : lesson.title;
        
        // Create event instance
        const eventInstance: CalendarEvent = {
          id: instanceId,
          title: displayTitle,
          start: format(newStartDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
          end: format(newEndDate, 'yyyy-MM-dd\'T\'HH:mm:ss'),
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          borderColor: 'rgb(168, 85, 247)',
          textColor: 'black',
          extendedProps: {
            description: lesson.description,
            status: 'scheduled',
            tutor: lesson.tutor,
            students,
            isRecurring: true,
            isRecurringInstance: true
          }
        };
        
        instances.push(eventInstance);
      });
      
      // Store in cache for future reuse
      recurringEventsCache.current.set(cacheKey, instances);
      return instances;
    } catch (error) {
      console.error('Error calculating recurring instances:', error, lesson);
      return [];
    }
  }, []);

  const fetchLessons = useCallback(async (start: Date, end: Date) => {
    // Validate date inputs to prevent issues
    if (!start || !end || !isValid(start) || !isValid(end)) {
      console.error('Calendar - Invalid date range:', { start, end });
      setIsLoading(false);
      setLoadingError('Invalid date range. Please try refreshing.');
      return;
    }
    
    console.log("Calendar - fetchLessons called with:", { 
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd")
    });
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setLoadingError(null);
    
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

      if (error) {
        console.error("Calendar - Error fetching regular lessons:", error);
        throw error;
      }
      
      console.log("Calendar - Fetched regular lessons:", data?.length);
      
      // Also fetch recurring lessons - but limit to a smaller window
      let recurringData: Lesson[] = [];
      try {
        // Fetch only recurring lessons that haven't ended
        const { data: recData, error: recurringError } = await supabase
          .from('lessons')
          .select(`
            *,
            tutor:tutors(id, first_name, last_name),
            lesson_students(
              student:students(id, first_name, last_name, parent_first_name, parent_last_name)
            )
          `)
          .eq('is_recurring', true)
          .or(`recurrence_end_date.gte.${startDate},recurrence_end_date.is.null`)
          .order('start_time', { ascending: true });
          
        if (recurringError) {
          console.error("Calendar - Error fetching recurring lessons:", recurringError);
        } else {
          recurringData = recData || [];
          console.log("Calendar - Fetched recurring lessons:", recurringData.length);
        }
      } catch (recError) {
        console.error("Calendar - Exception in recurring lessons fetch:", recError);
      }
      
      // Initialize empty events array
      let events: CalendarEvent[] = [];
      
      // Process regular (non-recurring) lessons
      if (data && data.length > 0) {
        try {
          // Transform regular lessons to events
          const regularEvents = data.map((lesson: Lesson): CalendarEvent | null => {
            try {
              // Skip if required fields are missing
              if (!lesson.start_time || !lesson.end_time) return null;
              
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
            } catch (error) {
              console.error("Error processing lesson:", error, lesson);
              return null;
            }
          }).filter(Boolean) as CalendarEvent[];
          
          events = regularEvents;
        } catch (processingError) {
          console.error("Error processing regular lessons:", processingError);
        }
      }
      
      // Process recurring lessons
      if (showRecurringLessons && recurringData.length > 0) {
        try {
          // Filter out cancelled recurring lessons and those that have ended
          const activeRecurringLessons = recurringData.filter((lesson: Lesson) => {
            if (lesson.status === 'cancelled') return false;
            
            const recEndDate = safeParseISO(lesson.recurrence_end_date);
            if (recEndDate && recEndDate < start) return false;
            
            return true;
          });
          
          console.log("Calendar - Processing active recurring lessons:", activeRecurringLessons.length);
          
          // Generate recurring instances for each lesson
          let recurringInstances: CalendarEvent[] = [];
          
          // Process recurring lessons in batches to avoid timeout
          for (const lesson of activeRecurringLessons) {
            const instances = calculateRecurringInstances(lesson, start, end);
            recurringInstances = [...recurringInstances, ...instances];
            
            // Check if we need to abort due to timeout
            if (abortControllerRef.current?.signal.aborted) {
              console.log("Calendar - Processing aborted due to timeout");
              throw new Error("Processing aborted");
            }
          }
          
          // Filter out duplicate recurring events
          const existingIds = new Set(events.map(e => e.id));
          const uniqueRecurringEvents = recurringInstances.filter(event => 
            !existingIds.has(event.id)
          );
          
          // Add recurring events to the main events array
          events = [...events, ...uniqueRecurringEvents];
          
          console.log("Calendar - Added recurring instances:", uniqueRecurringEvents.length);
        } catch (recurringError) {
          console.error("Calendar - Error processing recurring lessons:", recurringError);
          // Continue with regular events if we hit an error
        }
      }
      
      // Apply filters
      let filteredEvents = events;
      
      // Apply student filter if set
      if (filteredStudentId) {
        filteredEvents = filteredEvents.filter(event => 
          event.extendedProps.students?.some((student: any) => 
            student.id?.toString() === filteredStudentId
          )
        );
      }
      
      // Apply parent filter if set
      if (filteredParentId) {
        filteredEvents = filteredEvents.filter(event => 
          event.extendedProps.students?.some((student: any) => {
            if (student.parent_first_name && student.parent_last_name) {
              const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
              return parentId === filteredParentId;
            }
            return false;
          })
        );
      }
      
      console.log("Calendar - Final events count:", filteredEvents.length);
      
      // Update state with processed events
      setLessons(filteredEvents);
      setIsLoading(false);
      setLoadingError(null);
      setLoadingProgress(100);
    } catch (error) {
      console.error('Calendar - Error fetching or processing lessons:', error);
      
      // Only update error state if not aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setLoadingError('Failed to load lessons. Please try refreshing.');
      }
      
      // Reset loading state
      setIsLoading(false);
      toast.error('Failed to load lessons');
    } finally {
      // Cleanup abort controller
      abortControllerRef.current = null;
    }
  }, [filteredStudentId, filteredParentId, showRecurringLessons, calculateRecurringInstances]);

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
    const eventId = clickInfo.event.id;
    
    // Check if this is a recurring instance
    const isRecurringInstance = clickInfo.event.extendedProps.isRecurringInstance;
    
    // For recurring instances, store the temporary ID
    setSelectedLessonId(eventId);
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
    try {
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
    } catch (error) {
      console.error("Error formatting date display:", error);
      return "Calendar View";
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
        toast.error("Navigation failed. Please try again.");
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
        toast.error("Navigation failed. Please try again.");
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
        toast.error("Navigation failed. Please try again.");
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
        toast.error("Failed to change view. Please try again.");
      }
    }
  };

  const forceCalendarRefresh = useCallback(() => {
    console.log("Calendar - forceCalendarRefresh called");
    setLoadingError(null);
    setRetryCount(prev => prev + 1);
    
    // Clear the recurring events cache on forced refresh
    recurringEventsCache.current.clear();
    
    // Refresh via calendar API if available
    if (calendarRef.current) {
      try {
        const apiInstance = calendarRef.current.getApi();
        console.log("Calendar - Refreshing events via calendar API");
        
        // Get the visible range directly from the calendar
        const view = apiInstance.view;
        const visibleStart = view.activeStart;
        const visibleEnd = view.activeEnd;
        
        // Validate dates before fetching
        if (isValid(visibleStart) && isValid(visibleEnd)) {
          // Fetch lessons for the current visible range
          fetchLessons(visibleStart, visibleEnd);
        } else {
          console.error("Calendar - Invalid visible range from API:", { visibleStart, visibleEnd });
          // Fallback to the current visible range
          fetchLessons(visibleDateRange.start, visibleDateRange.end);
        }
      } catch (error) {
        console.error("Calendar - Error using calendar API:", error);
        
        // Fallback to the current visible range
        fetchLessons(visibleDateRange.start, visibleDateRange.end);
      }
    } else {
      // If calendar ref isn't available, use the stored date range
      fetchLessons(visibleDateRange.start, visibleDateRange.end);
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
    recurringEventsCache.current.clear();
    forceCalendarRefresh();
  };

  const handleRetry = () => {
    setLoadingError(null);
    setRetryCount(prev => prev + 1);
    recurringEventsCache.current.clear();
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
                <div className="h-[600px] flex flex-col items-center justify-center">
                  <div className="text-center mb-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2">Loading calendar...</p>
                  </div>
                  <div className="w-64">
                    <Progress value={loadingProgress} className="h-2" />
                  </div>
                </div>
              ) : loadingError ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-md">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Loading Calendar</AlertTitle>
                      <AlertDescription>
                        {loadingError}
                      </AlertDescription>
                    </Alert>
                    <div className="flex justify-center mt-4">
                      <Button 
                        onClick={handleRetry} 
                        variant="outline" 
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry Loading
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[600px]">
                  <FullCalendar
                    key={`${calendarKey}-${retryCount}`}
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
