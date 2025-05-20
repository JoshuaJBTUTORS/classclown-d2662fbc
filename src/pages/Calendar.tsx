import React, { useState, useEffect } from 'react';
import { format, parseISO, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Users,
  Calendar as CalendarIcon,
  Check,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AddLessonForm from '@/components/lessons/AddLessonForm';
import LessonDetailsDialog from '@/components/calendar/LessonDetailsDialog';
import CompleteSessionDialog from '@/components/lessons/CompleteSessionDialog';
import AssignHomeworkDialog from '@/components/homework/AssignHomeworkDialog';
import { Lesson } from '@/types/lesson';

// Interfaces
interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
}

// Using the imported Lesson type from @/types/lesson

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

// Generate a consistent color based on lesson title
const getColorForLesson = (title: string) => {
  const colors = [
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-purple-100 border-purple-300 text-purple-800',
    'bg-green-100 border-green-300 text-green-800',
    'bg-yellow-100 border-yellow-300 text-yellow-800',
    'bg-pink-100 border-pink-300 text-pink-800',
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-teal-100 border-teal-300 text-teal-800',
    'bg-indigo-100 border-indigo-300 text-indigo-800',
  ];
  
  // Simple hash function to select a color based on the title
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const Calendar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isLessonDetailsOpen, setIsLessonDetailsOpen] = useState(false);
  const [isCompleteSessionOpen, setIsCompleteSessionOpen] = useState(false);
  const [isAssigningHomework, setIsAssigningHomework] = useState(false);
  const [isAssignHomeworkOpen, setIsAssignHomeworkOpen] = useState(false);
  const [tutorFilter, setTutorFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for tracking completion flow
  const [completionFlow, setCompletionFlow] = useState<{
    step: 'homework' | 'attendance' | 'final',
    lessonId: string | null
  } | null>(null);

  // Calculate week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // End on Sunday
  const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const currentWeekText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    fetchTutors();
    fetchStudents();
    fetchLessons();
  }, [currentDate, tutorFilter, studentFilter, sessionTypeFilter]);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('id, first_name, last_name')
        .eq('status', 'active');

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors');
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .neq('status', 'inactive');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(weekEnd, 'yyyy-MM-dd 23:59:59');
      const threeMonthsLater = format(addMonths(weekEnd, 3), 'yyyy-MM-dd 23:59:59');

      // Create a query to fetch lessons within the date range
      let query = supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name),
            attendance_status
          )
        `)
        .or(`start_time.gte.${startDate},recurrence_end_date.gte.${startDate}`)
        .lte('start_time', endDate);

      // Apply tutor filter if selected
      if (tutorFilter !== "all") {
        query = query.eq('tutor_id', tutorFilter);
      }

      // Apply session type filter
      if (sessionTypeFilter !== "all") {
        const isGroup = sessionTypeFilter === "group";
        query = query.eq('is_group', isGroup);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Start with the regular lessons
      let processedLessons = data ? [...data] : [];
      
      // Handle recurring lessons
      const recurringLessons = data ? data.filter(lesson => lesson.is_recurring) : [];
      for (const lesson of recurringLessons) {
        // Generate recurring instances for future weeks
        const originalDate = parseISO(lesson.start_time);
        const originalEndDate = parseISO(lesson.end_time);
        const duration = originalEndDate.getTime() - originalDate.getTime(); // in milliseconds
        
        // Create instances for the next 3 months
        let currentInstance = addWeeks(originalDate, 1); // Start from next week
        const recurrenceEndDate = lesson.recurrence_end_date 
          ? parseISO(lesson.recurrence_end_date) 
          : addMonths(originalDate, 3); // Default to 3 months

        while (currentInstance <= recurrenceEndDate) {
          // Check if this instance falls within our current view
          if (
            currentInstance >= weekStart && 
            currentInstance <= weekEnd
          ) {
            const instanceEndTime = new Date(currentInstance.getTime() + duration);
            
            // Create a copy of the lesson with updated dates
            // IMPORTANT: Use a consistent format for the instance ID
            const instanceId = `${lesson.id}-${format(currentInstance, 'yyyy-MM-dd')}`;
            
            const instanceLesson = {
              ...lesson,
              id: instanceId, // Create a unique ID
              start_time: format(currentInstance, "yyyy-MM-dd'T'HH:mm:ss"),
              end_time: format(instanceEndTime, "yyyy-MM-dd'T'HH:mm:ss"),
              is_recurring_instance: true, // Flag to identify as a generated instance
            };
            
            processedLessons.push(instanceLesson);
          }
          
          // Move to the next instance based on recurrence interval
          if (lesson.recurrence_interval === 'daily') {
            currentInstance = addWeeks(currentInstance, 1); // Daily within the same week structure
          } else if (lesson.recurrence_interval === 'weekly') {
            currentInstance = addWeeks(currentInstance, 1);
          } else if (lesson.recurrence_interval === 'biweekly') {
            currentInstance = addWeeks(currentInstance, 2);
          } else if (lesson.recurrence_interval === 'monthly') {
            currentInstance = addMonths(currentInstance, 1);
          } else {
            // Default to weekly if interval is not specified
            currentInstance = addWeeks(currentInstance, 1);
          }
        }
      }

      // Apply student filter if selected (need to filter after processing recurring lessons)
      if (studentFilter !== "all") {
        const studentId = parseInt(studentFilter);
        processedLessons = processedLessons.filter(lesson => {
          const students = lesson.lesson_students?.map((ls: any) => ls.student.id);
          return students?.includes(studentId);
        });
      }

      // Process the data to transform it into the format we need
      const finalLessons = processedLessons.map(lesson => {
        // Extract students from the nested structure
        const students = lesson.lesson_students?.map((ls: any) => ({
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name,
          attendance_status: ls.attendance_status || 'pending'
        })) || [];
        
        // Calculate the color based on the lesson title
        const color = getColorForLesson(lesson.title);

        return {
          ...lesson,
          students,
          color,
          // Remove the original nested structure
          lesson_students: undefined
        };
      });

      setLessons(finalLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLessonSuccess = () => {
    fetchLessons();
  };

  const handleCompleteSessionSuccess = () => {
    fetchLessons();
    toast.success('Session marked as completed');
    setCompletionFlow(null); // Reset the completion flow
    setIsCompleteSessionOpen(false); // Make sure to close the complete session dialog
  };

  const handleHomeworkAssigned = () => {
    // When homework is assigned, proceed to attendance tracking
    if (completionFlow?.lessonId) {
      setIsAssigningHomework(false);
      setIsCompleteSessionOpen(true);
    }
  };

  const openLessonDetails = (lessonId: string) => {
    console.log("Opening lesson details for:", lessonId);
    setSelectedLessonId(lessonId);
    setIsLessonDetailsOpen(true);
  };

  // Start the completion flow
  const startCompletionFlow = (lessonId: string) => {
    console.log("Starting completion flow for lesson:", lessonId);
    setSelectedLessonId(lessonId);
    setCompletionFlow({
      step: 'homework',
      lessonId
    });
    setIsAssigningHomework(true);
  };

  const openCompleteSession = (lessonId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation(); // Prevent opening the lesson details
    startCompletionFlow(lessonId);
  };

  const getDayFromDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'EEE');
  };

  const getLessonPosition = (lesson: Lesson) => {
    const startTime = parseISO(lesson.start_time);
    const endTime = parseISO(lesson.end_time);
    
    const hourStart = startTime.getHours() + startTime.getMinutes() / 60;
    const hourEnd = endTime.getHours() + endTime.getMinutes() / 60;
    
    const top = (hourStart - hours[0]) * 80;
    const height = (hourEnd - hourStart) * 80;
    
    return { top, height };
  };

  const getLessonsForDay = (day: string) => {
    return lessons.filter(lesson => getDayFromDate(lesson.start_time) === day);
  };

  const handleEditLesson = (lesson: Lesson) => {
    // Implement editing functionality
    setIsAddingLesson(true);
    // You would need to pass the lesson data to the form
  };

  // Update the handleDeleteLesson function to handle recurring lessons
  const handleDeleteLesson = async (lessonId: string, deleteAllFuture: boolean = false) => {
    try {
      // Check if the lesson is a recurring instance (has a dash in the ID)
      const isRecurringInstance = lessonId.includes('-');
      
      if (isRecurringInstance && !deleteAllFuture) {
        // For recurring instances without "delete all future", we just remove it visually
        // since it's just a visual representation
        setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        toast.success('Lesson instance removed');
        return;
      }
      
      if (deleteAllFuture) {
        // For "delete all future" on a recurring lesson
        const originalId = isRecurringInstance ? lessonId.split('-')[0] : lessonId;
        
        // Delete the lesson from the database
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', originalId);

        if (error) throw error;
        
        // Update the lessons state to remove the original and all its instances
        setLessons(prev => prev.filter(lesson => {
          // Remove the specific lesson and any of its recurring instances
          return !lesson.id.startsWith(`${originalId}`);
        }));
        
        toast.success('All future lessons deleted successfully');
      } else {
        // Regular delete for a non-recurring lesson
        const { error } = await supabase
          .from('lessons')
          .delete()
          .eq('id', lessonId);

        if (error) throw error;
        
        // Update the lessons state
        setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        toast.success('Lesson deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <PageTitle 
              title="Calendar" 
              subtitle="Manage and schedule tuition sessions"
              className="mb-4 md:mb-0"
            />
            <Button className="flex items-center gap-2" onClick={() => setIsAddingLesson(true)}>
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </div>
          
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-medium">{currentWeekText}</div>
                  <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Select value={tutorFilter} onValueChange={setTutorFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tutors</SelectItem>
                        {tutors.map((tutor) => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.first_name} {tutor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={studentFilter} onValueChange={setStudentFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sessions</SelectItem>
                        <SelectItem value="individual">1-on-1 Sessions</SelectItem>
                        <SelectItem value="group">Group Sessions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'day' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('day')}>
                      Day
                    </Button>
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'week' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('week')}>
                      Week
                    </Button>
                    <Button variant="ghost" className={`rounded-none px-3 h-9 ${currentView === 'month' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentView('month')}>
                      Month
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {/* Time labels */}
                <div className="flex">
                  <div className="w-16 flex-shrink-0"></div>
                  <div className="flex-grow grid grid-cols-7">
                    {weekDates.map((date, index) => (
                      <div 
                        key={index} 
                        className={`py-3 text-center font-medium border-b border-l ${
                          isSameDay(date, new Date()) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div>{format(date, 'EEE')}</div>
                        <div className="text-sm text-gray-500">{format(date, 'MMM d')}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Time slots */}
                <div className="flex">
                  {/* Time indicators */}
                  <div className="w-16 flex-shrink-0">
                    {hours.map((hour) => (
                      <div key={hour} className="h-20 border-b relative">
                        <span className="absolute -top-2.5 left-2 text-xs text-muted-foreground">
                          {hour % 12 === 0 ? 12 : hour % 12} {hour >= 12 ? 'PM' : 'AM'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="flex-grow grid grid-cols-7">
                    {weekDates.map((date, dateIndex) => (
                      <div key={dateIndex} className="relative">
                        {hours.map((hour) => (
                          <div 
                            key={hour} 
                            className={`h-20 border-b border-l relative ${
                              isSameDay(date, new Date()) ? 'bg-blue-50' : ''
                            }`}
                          ></div>
                        ))}
                        
                        {/* Lessons for this day */}
                        {getLessonsForDay(format(date, 'EEE')).map(lesson => {
                          const { top, height } = getLessonPosition(lesson);
                          const isRecurringInstance = lesson.is_recurring_instance;

                          return (
                            <div 
                              key={lesson.id}
                              className={`absolute left-1 right-1 rounded-md p-2 border ${lesson.color || 'bg-blue-100 border-blue-300 text-blue-800'} overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${isRecurringInstance ? 'border-dashed' : ''}`}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                              }}
                              onClick={() => openLessonDetails(lesson.id)}
                            >
                              <div className="font-medium text-sm truncate flex justify-between items-center">
                                <span>
                                  {lesson.title}
                                  {lesson.is_recurring && !isRecurringInstance && (
                                    <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1 rounded">
                                      Recurring
                                    </span>
                                  )}
                                  {isRecurringInstance && (
                                    <span className="ml-1 text-xs bg-blue-200 text-blue-800 px-1 rounded">
                                      Series
                                    </span>
                                  )}
                                </span>
                                {lesson.status === 'completed' ? (
                                  <Check className="h-4 w-4 text-green-600 bg-white rounded-full p-0.5" />
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 p-0.5 rounded-full bg-white hover:bg-green-50"
                                    onClick={(e) => openCompleteSession(lesson.id, e)}
                                    title="Complete Session"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs mt-1">
                                {lesson.is_group ? (
                                  <Users className="h-3 w-3" />
                                ) : (
                                  <span className="h-3 w-3">👤</span>
                                )}
                                <div className="truncate">
                                  {lesson.students && lesson.students.length > 1 
                                    ? `${lesson.students.length} Students` 
                                    : lesson.students && lesson.students[0]
                                      ? `${lesson.students[0].first_name} ${lesson.students[0].last_name}`
                                      : 'No students'}
                                </div>
                              </div>
                              <div className="text-xs">
                                {format(parseISO(lesson.start_time), 'h:mm a')} - 
                                {format(parseISO(lesson.end_time), 'h:mm a')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialogs */}
      <AddLessonForm 
        isOpen={isAddingLesson} 
        onClose={() => setIsAddingLesson(false)}
        onSuccess={handleAddLessonSuccess}
      />

      <LessonDetailsDialog
        lessonId={selectedLessonId}
        isOpen={isLessonDetailsOpen}
        onClose={() => setIsLessonDetailsOpen(false)}
        onCompleteSession={(lessonId) => {
          setIsLessonDetailsOpen(false);
          startCompletionFlow(lessonId);
        }}
        onSave={handleEditLesson}
        onDelete={handleDeleteLesson}
      />

      <AssignHomeworkDialog 
        isOpen={isAssigningHomework}
        onClose={() => {
          setIsAssigningHomework(false);
          setCompletionFlow(null);
        }}
        onSuccess={handleHomeworkAssigned}
        preSelectedLessonId={completionFlow?.lessonId || undefined}
      />

      <CompleteSessionDialog
        lessonId={completionFlow?.lessonId}
        isOpen={isCompleteSessionOpen}
        onClose={() => {
          setIsCompleteSessionOpen(false);
          setCompletionFlow(null);
        }}
        onSuccess={handleCompleteSessionSuccess}
        skipHomeworkStep={true} // Skip homework assignment as we're handling it separately
      />
    </div>
  );
};

export default Calendar;
