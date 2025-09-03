import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { createUKDateTime, convertUKToUTC, convertUTCToUK } from '@/utils/timezone';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Loader2, CheckCircle, Repeat, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Lesson } from '@/types/lesson';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { useStudentData } from '@/hooks/useStudentData';
import AvailabilityStatus from './AvailabilityStatus';
import RecurringEditConfirmation from './RecurringEditConfirmation';
import MultiSelectStudents from './MultiSelectStudents';
import { 
  EditScope, 
  updateSingleRecurringInstance, 
  updateAllFutureLessons, 
  getAffectedLessonsCount 
} from '@/services/recurringLessonEditService';

interface EditLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lessonId: string | null;
}

const EditLessonForm: React.FC<EditLessonFormProps> = ({ 
  isOpen, 
  onClose,
  onSuccess,
  lessonId
}) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  // Store raw lesson data for accessing database fields
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [rawLessonData, setRawLessonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [editScope, setEditScope] = useState<EditScope>(EditScope.THIS_LESSON_ONLY);
  const [affectedLessonsCount, setAffectedLessonsCount] = useState<number>(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRecurringLesson, setIsRecurringLesson] = useState(false);
  
  // Use shared student data hook
  const { students, isLoading: studentsLoading } = useStudentData();
  
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    subject: z.string().min(1, { message: "Subject is required" }),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
  }).refine(data => {
    return !data.isGroup || (data.isGroup && selectedStudents.length > 0);
  }, {
    message: "Select at least one student for group sessions",
    path: ["studentIds"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      tutorId: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      isGroup: false,
    },
  });

  // Availability checking integration
  const { checkAvailability, isChecking, checkResult, resetCheckResult } = useAvailabilityCheck();

  // Fetch lesson details when the modal is opened
  useEffect(() => {
    if (isOpen && lessonId) {
      fetchLessonDetails();
      fetchTutors();
    }
  }, [isOpen, lessonId]);

  // Update affected lessons count when edit scope changes
  useEffect(() => {
    if (lessonId && isRecurringLesson) {
      updateAffectedLessonsCount();
    }
  }, [editScope, lessonId, isRecurringLesson]);

  const updateAffectedLessonsCount = async () => {
    if (!lessonId) return;
    
    try {
      const count = await getAffectedLessonsCount(lessonId, editScope);
      setAffectedLessonsCount(count);
    } catch (error) {
      console.error('Error getting affected lessons count:', error);
      setAffectedLessonsCount(1);
    }
  };

  // Fetch lesson details
  const fetchLessonDetails = async () => {
    if (!lessonId) return;
    
    setIsLoading(true);
    setLoadingStep('Loading lesson details...');
    
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student_id,
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();
      
      if (error) throw error;
      
      // Check if this is a recurring lesson (parent or instance)
      const isRecurring = data.is_recurring || data.is_recurring_instance;
      setIsRecurringLesson(isRecurring);
      
      // Set default edit scope based on lesson type
      if (data.is_recurring_instance) {
        setEditScope(EditScope.THIS_LESSON_ONLY);
      } else if (data.is_recurring) {
        setEditScope(EditScope.ALL_FUTURE_LESSONS);
      }
      
      // Process students data - ensure consistent ID handling
      const students = data.lesson_students.map((ls: any) => ls.student);
      const processedStudents = students.map(student => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name
      }));

      const lessonStudentsData = data.lesson_students.map((ls: any) => ({
        student: {
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name
        }
      }));
      
      // Simplified lesson data
      const processedLesson: Lesson = {
        ...data,
        lesson_type: (data.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular',
        students: processedStudents,
        lesson_students: lessonStudentsData
      };
      
      setLesson(processedLesson);
      setRawLessonData(data);
      
      // Parse dates for the form
      const startDate = parseISO(data.start_time);
      const startHours = format(startDate, 'HH:mm');
      
      const endDate = parseISO(data.end_time);
      const endHours = format(endDate, 'HH:mm');
      
      // Get student IDs from lesson_students - ensure consistent ID handling
      const studentIds = data.lesson_students.map((ls: any) => {
        const studentId = ls.student_id;
        // Convert to number if it's a string, otherwise use as-is
        return typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
      });
      
      console.log('Setting selected students from lesson data:', studentIds);
      
      // Set selected students for the multi-select
      setSelectedStudents(studentIds);
      
      // Set form values
      form.reset({
        title: data.title,
        description: data.description || '',
        subject: data.subject || '',
        tutorId: data.tutor_id,
        date: startDate,
        startTime: startHours,
        endTime: endHours,
        isGroup: data.is_group,
      });
      
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTutors = async () => {
    setIsFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors');
    } finally {
      setIsFetchingData(false);
    }
  };

  // Handler functions for MultiSelectStudents
  const handleStudentSelect = (studentId: number) => {
    console.log('Selecting student:', studentId);
    setSelectedStudents(prev => {
      const newSelection = [...prev, studentId];
      console.log('New student selection:', newSelection);
      return newSelection;
    });
  };

  const handleStudentRemove = (studentId: number) => {
    console.log('Removing student:', studentId);
    setSelectedStudents(prev => {
      const newSelection = prev.filter(id => id !== studentId);
      console.log('New student selection:', newSelection);
      return newSelection;
    });
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lessonId || !lesson) return;
    
    // Show confirmation dialog for bulk changes
    if (isRecurringLesson && (editScope === EditScope.ALL_FUTURE_LESSONS || affectedLessonsCount > 1)) {
      setShowConfirmation(true);
      return;
    }
    
    // Proceed with single lesson update
    await performUpdate(values);
  };

  const performUpdate = async (values: z.infer<typeof formSchema>) => {
    if (!lessonId || !lesson) return;
    
    try {
      setIsLoading(true);
      setLoadingStep(`Updating ${affectedLessonsCount} lesson${affectedLessonsCount !== 1 ? 's' : ''}...`);
      
      // Create UK local time and convert to UTC for storage (same as AddLessonForm)
      const ukStartTime = createUKDateTime(values.date, values.startTime);
      const ukEndTime = createUKDateTime(values.date, values.endTime);
      
      const startTime = convertUKToUTC(ukStartTime);
      const endTime = convertUKToUTC(ukEndTime);

      const updateData = {
        title: values.title,
        description: values.description || '',
        subject: values.subject,
        tutor_id: values.tutorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_group: values.isGroup,
        selectedStudents
      };

      if (isRecurringLesson && editScope === EditScope.ALL_FUTURE_LESSONS) {
        // Update all future lessons - use actual lesson start time as boundary to ensure current lesson is included
        const fromDateTime = rawLessonData?.instance_date 
          ? rawLessonData.instance_date
          : rawLessonData?.start_time;
        
        const updatedCount = await updateAllFutureLessons(lessonId, updateData, fromDateTime);
        toast.success(`Successfully updated ${updatedCount} lessons`);
      } else {
        // Update single lesson
        await updateSingleRecurringInstance(lessonId, updateData);
        toast.success('Lesson updated successfully');
      }
      
      setIsLoading(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
      setIsLoading(false);
    }
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmation(false);
    const values = form.getValues();
    await performUpdate(values);
  };

  // Manual availability check
  const handleManualAvailabilityCheck = async () => {
    const values = form.getValues();
    
    if (!values.tutorId || !values.date || !values.startTime || !values.endTime) {
      toast.error('Please fill in tutor, date, and time fields first');
      return;
    }

    try {
      const startTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':');
      startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));

      const endTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':');
      endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));

      await checkAvailability({
        tutorId: values.tutorId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        studentIds: selectedStudents.length > 0 ? selectedStudents : undefined,
        excludeLessonId: lessonId || undefined
      });
    } catch (error) {
      console.error('Error performing availability check:', error);
    }
  };

  // Handle alternative tutor selection
  const handleSelectAlternativeTutor = (tutorId: string, tutorName: string) => {
    form.setValue('tutorId', tutorId);
    resetCheckResult();
    toast.success(`Switched to ${tutorName}`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Edit Lesson
              {isRecurringLesson && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Repeat className="h-4 w-4" />
                  Recurring
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              Update the lesson details below.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading && !form.formState.isSubmitting ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">{loadingStep}</span>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Recurring Lesson Edit Options */}
                {isRecurringLesson && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recurring Lesson Options
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Choose how you want to apply your changes to this recurring lesson series.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <RadioGroup value={editScope} onValueChange={(value) => setEditScope(value as EditScope)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={EditScope.THIS_LESSON_ONLY} id="single" />
                          <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                            <Clock className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Edit this lesson only</div>
                              <div className="text-xs text-muted-foreground">
                                Changes will only apply to this specific lesson instance
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={EditScope.ALL_FUTURE_LESSONS} id="future" />
                          <Label htmlFor="future" className="flex items-center gap-2 cursor-pointer">
                            <Repeat className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Edit all future lessons</div>
                              <div className="text-xs text-muted-foreground">
                                Changes will apply to this lesson and all future instances ({affectedLessonsCount} lessons)
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Math Tutoring Session" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LESSON_SUBJECTS.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about the tutoring session" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tutorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tutor</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tutor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tutors.map((tutor) => (
                              <SelectItem key={tutor.id} value={tutor.id}>
                                {tutor.first_name} {tutor.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isGroup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end justify-between space-x-2 space-y-0 rounded-md border p-3 h-[42px]">
                        <FormLabel>Group Session</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Student Selection using MultiSelectStudents */}
                <FormField
                  control={form.control}
                  name="isGroup"
                  render={() => (
                    <FormItem>
                      <FormLabel>Students</FormLabel>
                      <FormControl>
                        <MultiSelectStudents
                          students={students}
                          selectedStudents={selectedStudents}
                          onStudentSelect={handleStudentSelect}
                          onStudentRemove={handleStudentRemove}
                          placeholder={studentsLoading ? "Loading students..." : "Select students..."}
                          disabled={studentsLoading}
                        />
                      </FormControl>
                      {selectedStudents.length === 0 && form.getValues('isGroup') && (
                        <p className="text-sm font-medium text-destructive">Select at least one student for group sessions</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal w-full"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Manual Availability Check Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Availability Check</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleManualAvailabilityCheck}
                      disabled={isChecking}
                      className="flex items-center gap-2"
                    >
                      {isChecking ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Check Availability
                    </Button>
                  </div>
                  
                  <AvailabilityStatus
                    isChecking={isChecking}
                    checkResult={checkResult}
                    onSelectAlternativeTutor={handleSelectAlternativeTutor}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingStep}
                      </>
                    ) : (
                      <>
                        Update {isRecurringLesson && editScope === EditScope.ALL_FUTURE_LESSONS 
                          ? `${affectedLessonsCount} Lessons` 
                          : 'Lesson'
                        }
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <RecurringEditConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmUpdate}
        editScope={editScope}
        affectedLessonsCount={affectedLessonsCount}
        lessonTitle={lesson?.title || ''}
        isLoading={isLoading}
      />
    </>
  );
};

export default EditLessonForm;
