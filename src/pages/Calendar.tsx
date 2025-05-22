import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, addDays, addWeeks, eachDayOfInterval, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, isValid, isSameDay, isAfter, isWithinInterval } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, DateSelectArg, DatesSetArg } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/react';
import Sidebar from '@/components/navigation/Sidebar';
import Navbar from '@/components/navigation/Navbar';
import { toast } from "sonner";
import { Lesson, CalendarEvent } from '@/types/lesson';

// Additional imports that seem to be used in the file
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';

// Component imports for lesson management
import AddLessonForm from '@/components/lessons/AddLessonForm';
import EditLessonForm from '@/components/lessons/EditLessonForm';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import ViewOptions from '@/components/calendar/ViewOptions';

// Set a maximum date range for recurring events to avoid performance issues
const MAX_RECURRING_INSTANCES = 15; // REDUCED from 30 to improve performance
const MAX_RECURRING_MONTHS = 3; // REDUCED from 6 to improve performance
const LOADING_TIMEOUT = 12000; // INCREASED from 8s to 12s to allow more time for computation
const CALCULATION_BATCH_SIZE = 5; // New constant for batch processing

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  parent_first_name?: string;
  parent_last_name?: string;
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
  const calendarRef = useRef<FullCalendarComponent | null>(null);
  const calendarKey = useRef(`calendar-${Date.now()}`).current;
  
  // Cache for recurring events to avoid redundant calculations
  const recurringEventsCache = useRef<Map<string, CalendarEvent[]>>(new Map());
  // New: Track ongoing calculations
  const calculationInProgressRef = useRef<boolean>(false);
  // New: Track cancelled operations
  const calculationCancelledRef = useRef<boolean>(false);
  // New: Worker for calculations (simulate worker with setTimeout batches)
  const calculationQueue = useRef<Array<Lesson>>([]);

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
        
        // Mark any ongoing calculations as cancelled
        calculationCancelledRef.current = true;
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

  // Optimized function to calculate recurring instances efficiently with batching
  const calculateRecurringInstancesBatched = useCallback((
    lessons: Lesson[], 
    viewStart: Date, 
    viewEnd: Date,
    onComplete: (events: CalendarEvent[]) => void
  ): void => {
    // Reset cancellation flag
    calculationCancelledRef.current = false;
    calculationInProgressRef.current = true;
    
    // First, check which lessons actually need calculation (not cached)
    const lessonsToCalculate: Lesson[] = [];
    const cachedEvents: CalendarEvent[] = [];
    
    // Reset calculation queue
    calculationQueue.current = [];
    
    for (const lesson of lessons) {
      const cacheKey = `${lesson.id}-${viewStart.toISOString()}-${viewEnd.toISOString()}`;
      
      if (recurringEventsCache.current.has(cacheKey)) {
        // Use cached results if available
        const cachedResult = recurringEventsCache.current.get(cacheKey) || [];
        cachedEvents.push(...cachedResult);
      } else {
        // Add to calculation queue
        calculationQueue.current.push(lesson);
      }
    }
    
    console.log(`Calendar - Using ${cachedEvents.length} cached events, calculating ${calculationQueue.current.length} lessons`);
    
    // If we have nothing to calculate, return immediately
    if (calculationQueue.current.length === 0) {
      calculationInProgressRef.current = false;
      onComplete(cachedEvents);
      return;
    }
    
    // Process lessons in batches to avoid locking the UI
    const allCalculatedEvents: CalendarEvent[] = [...cachedEvents];
    
    const processBatch = () => {
      // Check if calculation was cancelled
      if (calculationCancelledRef.current) {
        console.log('Calendar - Calculation cancelled');
        calculationInProgressRef.current = false;
        onComplete(allCalculatedEvents);
        return;
      }
      
      // Get next batch
      const batch = calculationQueue.current.splice(0, CALCULATION_BATCH_SIZE);
      
      if (batch.length === 0) {
        // All batches processed
        calculationInProgressRef.current = false;
        onComplete(allCalculatedEvents);
        return;
      }
      
      // Process this batch
      for (const lesson of batch) {
        const events = calculateRecurringInstances(lesson, viewStart, viewEnd);
        allCalculatedEvents.push(...events);
      }
      
      // Schedule next batch with a small delay to let UI breathe
      setTimeout(processBatch, 10);
    };
    
    // Start processing
    processBatch();
  }, []);

  // Improved recurring instance calculator (single lesson)
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

      // IMPROVED: Use a more strict end date calculation
      // First determine the maximum date we'll consider
      const maxEndDate = addMonths(new Date(), MAX_RECURRING_MONTHS);
      // Then pick the earliest of: view end, max months from now, or recurrence end date
      let effectiveEndDate = isAfter(maxEndDate, viewEnd) ? viewEnd : maxEndDate;
      if (recurrenceEndDate && isAfter(effectiveEndDate, recurrenceEndDate)) {
        effectiveEndDate = recurrenceEndDate;
      }
      
      if (effectiveEndDate < viewStart) {
        return instances; // No need to calculate if the effective end date is before view start
      }
      
      const durationMs = endDateOriginal.getTime() - startDateOriginal.getTime();
      const interval = lesson.recurrence_interval;
      let instanceCount = 0;
      
      // NEW: Skip calculation if we know there are too many instances
      // This prevents excessive calculations that would time out
      const estimatedInstances = estimateInstanceCount(
        startDateOriginal,
        viewStart,
        effectiveEndDate,
        interval
      );
      
      if (estimatedInstances > MAX_RECURRING_INSTANCES * 1.5) {
        console.warn(`Calendar - Too many estimated instances (${estimatedInstances}) for lesson ${lesson.id}, limiting to ${MAX_RECURRING_INSTANCES}`);
      }
      
      // IMPROVED: More efficient recurring dates generation
      const recurringDates = generateOptimizedRecurringDates(
        startDateOriginal,
        viewStart,
        effectiveEndDate,
        interval,
        MAX_RECURRING_INSTANCES
      );
      
      // Create event instances for each date (create fewer events for better performance)
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
        const studentNames = students.length <= 2 ? 
          students.map((student: any) => `${student.first_name} ${student.last_name}`).join(', ') :
          `${students.length} students`; // For many students, just show count to save rendering
        
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
            isRecurringInstance: true,
            sourceId: lesson.id
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
  }, [safeParseISO]);
  
  // NEW: Helper function to estimate instance count before calculation
  const estimateInstanceCount = (
    startDate: Date,
    viewStart: Date,
    viewEnd: Date,
    recurrenceInterval: string
  ): number => {
    let intervalDays: number;
    
    switch (recurrenceInterval) {
      case 'weekly':
        intervalDays = 7;
        break;
      case 'biweekly':
        intervalDays = 14;
        break;
      case 'monthly':
        // Approximate
        intervalDays = 30;
        break;
      default:
        intervalDays = 7;
    }
    
    // Calculate total days in view range
    const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Estimate instances based on interval
    return Math.ceil(totalDays / intervalDays);
  };
  
  // NEW: Optimized recurring date generation function
  const generateOptimizedRecurringDates = (
    startDateOriginal: Date,
    viewStart: Date,
    viewEnd: Date,
    interval: string,
    maxInstances: number
  ): Date[] => {
    const dates: Date[] = [];
    let currentDate: Date;
    let instanceCount = 0;
    
    // Start from the original start date or view start, whichever is later
    if (startDateOriginal > viewStart) {
      currentDate = new Date(startDateOriginal);
    } else {
      // If the original date is before the view start, jump ahead efficiently
      currentDate = new Date(startDateOriginal);
      
      // For weekly/biweekly recurrence, jump to correct day in view efficiently
      if (interval === 'weekly' || interval === 'biweekly') {
        const dayOfWeek = startDateOriginal.getDay();
        const daysToAdd = Math.ceil((viewStart.getTime() - startDateOriginal.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate weeks to add
        let weeksToAdd = Math.floor(daysToAdd / 7);
        
        // For biweekly, ensure we land on correct week
        if (interval === 'biweekly') {
          weeksToAdd = Math.floor(weeksToAdd / 2) * 2;
        }
        
        // Add weeks efficiently instead of adding days in a loop
        currentDate = addWeeks(currentDate, weeksToAdd);
        
        // Then adjust to get to the right day of week
        while (currentDate < viewStart || currentDate.getDay() !== dayOfWeek) {
          currentDate = addDays(currentDate, 1);
        }
      }
      // For monthly recurrence, jump to first occurrence in view range
      else if (interval === 'monthly') {
        const dayOfMonth = startDateOriginal.getDate();
        const monthsToAdd = 
          (viewStart.getFullYear() - startDateOriginal.getFullYear()) * 12 + 
          (viewStart.getMonth() - startDateOriginal.getMonth());
        
        // Jump ahead by months
        currentDate = addMonths(startDateOriginal, monthsToAdd);
        
        // Set to the same day of month
        currentDate = new Date(
          currentDate.getFullYear(), 
          currentDate.getMonth(), 
          dayOfMonth
        );
        
        // If we've already passed this day in the current month, move to next month
        if (currentDate < viewStart) {
          currentDate = new Date(
            currentDate.getFullYear(), 
            currentDate.getMonth() + 1, 
            dayOfMonth
          );
        }
      }
    }
    
    // Generate only dates within the view range, with limit
    while (currentDate <= viewEnd && instanceCount < maxInstances) {
      dates.push(new Date(currentDate));
      instanceCount++;
      
      // Move to next occurrence based on interval
      if (interval === 'weekly') {
        currentDate = addWeeks(currentDate, 1);
      } else if (interval === 'biweekly') {
        currentDate = addWeeks(currentDate, 2);
      } else if (interval === 'monthly') {
        // Handle edge case for months with different lengths more efficiently
        const currentDay = currentDate.getDate();
        currentDate = addMonths(currentDate, 1);
        
        // Adjust if day of month doesn't exist in the next month
        if (currentDate.getDate() !== currentDay) {
          // Set to last day of previous month
          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        }
      }
    }
    
    return dates;
  };

  // Optimized lesson fetching with better error handling
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
    
    // Cancel any ongoing request and calculations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Mark any ongoing calculations as cancelled
    calculationCancelledRef.current = true;
    
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
        // Add restriction on the query to only fetch recurring lessons with start dates within the MAX_RECURRING_MONTHS
        const reducedMonthsAgo = format(subMonths(new Date(), 1), "yyyy-MM-dd");
        
        // IMPROVED: More focused query that will return fewer recurring lessons
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
          .gte('start_time', reducedMonthsAgo) // Only get recurring lessons from the last month
          .or(`recurrence_end_date.gte.${startDate},recurrence_end_date.is.null`)
          .order('start_time', { ascending: true })
          .limit(50); // ADDED: limit to prevent fetching too many lessons
          
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
          // Transform regular lessons to events more efficiently
          const regularEvents = data.map((lesson: Lesson): CalendarEvent | null => {
            try {
              // Skip if required fields are missing
              if (!lesson.start_time || !lesson.end_time) return null;
              
              const students = lesson.lesson_students?.map((ls: any) => ls.student) || [];
              
              const studentNames = students.length <= 2 ?
                students.map((student: any) => `${student.first_name} ${student.last_name}`).join(', ') :
                `${students.length} students`; // For many students, just show count
              
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
      
      // Process recurring lessons with batching instead of all at once
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
          
          // NEW: Use batched calculation instead of processing all at once
          calculateRecurringInstancesBatched(activeRecurringLessons, start, end, (recurringInstances) => {
            console.log("Calendar - Recurring instances calculation complete:", recurringInstances.length);
            
            // Filter out duplicate recurring events
            const existingIds = new Set(events.map(e => e.id));
            const uniqueRecurringEvents = recurringInstances.filter(event => 
              !existingIds.has(event.id)
            );
            
            // Apply filters to newly-calculated recurring events
            let filteredRecurringEvents = uniqueRecurringEvents;
            
            if (filteredStudentId) {
              filteredRecurringEvents = filteredRecurringEvents.filter(event => 
                event.extendedProps.students?.some((student: any) => 
                  student.id?.toString() === filteredStudentId
                )
              );
            }
            
            if (filteredParentId) {
              filteredRecurringEvents = filteredRecurringEvents.filter(event => 
                event.extendedProps.students?.some((student: any) => {
                  if (student.parent_first_name && student.parent_last_name) {
                    const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
                    return parentId === filteredParentId;
                  }
                  return false;
                })
              );
            }
            
            // Now merge the existing events with new recurring events
            const combinedEvents = [...events, ...filteredRecurringEvents];
            
            console.log("Calendar - Final total events:", combinedEvents.length);
            
            // Update state with processed events
            setLessons(combinedEvents);
            setIsLoading(false);
            setLoadingError(null);
            setLoadingProgress(100);
          });
          
          // Apply filters to non-recurring events immediately
          if (filteredStudentId || filteredParentId) {
            if (filteredStudentId) {
              events = events.filter(event => 
                event.extendedProps.students?.some((student: any) => 
                  student.id?.toString() === filteredStudentId
                )
              );
            }
            
            if (filteredParentId) {
              events = events.filter(event => 
                event.extendedProps.students?.some((student: any) => {
                  if (student.parent_first_name && student.parent_last_name) {
                    const parentId = `${student.parent_first_name}_${student.parent_last_name}`.toLowerCase();
                    return parentId === filteredParentId;
                  }
                  return false;
                })
              );
            }
            
            // Update state with filtered non-recurring events while recurring ones are being calculated
            setLessons(events);
          }
        } catch (recurringError) {
          console.error("Calendar - Error processing recurring lessons:", recurringError);
          // Continue with regular events if we hit an error
          
          // Apply filters to events
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
          
          // Update state with processed events
          setLessons(filteredEvents);
          setIsLoading(false);
          setLoadingError('Some recurring lessons could not be processed.');
          setLoadingProgress(100);
        }
      } else {
        // No recurring lessons processing, just filter and set the regular events
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
      }
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
  }, [filteredStudentId, filteredParentId, showRecurringLessons, calculateRecurringInstancesBatched, safeParseISO]);

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

  // Enhanced refresh function with better caching and cancellation
  const forceCalendarRefresh = useCallback(() => {
    console.log("Calendar - forceCalendarRefresh called");
    setLoadingError(null);
    setRetryCount(prev => prev + 1);
    
    // Cancel any ongoing calculations
    calculationCancelledRef.current = true;
    
    // Selectively clear cache on forced refresh
    // Instead of clearing all cache entries, we can be selective
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    
    // Clear only entries that include dates more than a week old
    // This helps keep useful cache while removing outdated entries
    recurringEventsCache.current.forEach((value, key) => {
      const parts = key.split('-');
      if (parts.length >= 3) {
        try {
          const dateStr = parts[1]; // The start date part of the key
          const cacheDate = parseISO(dateStr);
          if (cacheDate < oneWeekAgo) {
            recurringEventsCache.current.delete(key);
          }
        } catch (e) {
          // If we can't parse the date, just keep the cache entry
        }
      }
    });
    
    console.log(`Calendar - Cache size after selective clearing: ${recurringEventsCache.current.size} entries`);
    
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
    
    // Only clear relevant cache entries on filter reset
    const filterKeys = Array.from(recurringEventsCache.current.keys()).filter(key => 
      key.includes(filteredStudentId || '') || key.includes(filteredParentId || '')
    );
    
    filterKeys.forEach(key => recurringEventsCache.current.delete(key));
    
    forceCalendarRefresh();
  };

  const handleRetry = () => {
    setLoadingError(null);
    setRetryCount(prev => prev + 1);
    
    // Clear cache for the current visible range only, not all cache
    const cacheKey = `*-${visibleDateRange.start.toISOString()}-${visibleDateRange.end.toISOString()}`;
    Array.from(recurringEventsCache.current.keys()).forEach(key => {
      if (key.includes(visibleDateRange.start.toISOString()) || 
          key.includes(visibleDateRange.end.toISOString())) {
        recurringEventsCache.current.delete(key);
      }
    });
    
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
                    dayMaxEvents={true}
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
