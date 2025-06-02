
import React, { useState, useEffect, useCallback } from 'react';
import { format, addHours } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Check, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { useLessonSpace } from '@/hooks/useLessonSpace';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import AvailabilityStatus from './AvailabilityStatus';

interface AddLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedTime?: {
    start: Date;
    end: Date;
  } | null;
}

const AddLessonForm: React.FC<AddLessonFormProps> = ({ 
  isOpen, 
  onClose,
  onSuccess, 
  preselectedTime = null
}) => {
  // Consolidated state
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isGroupSession, setIsGroupSession] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Lesson Space integration
  const { createRoom, isCreatingRoom } = useLessonSpace();
  
  // Availability checking integration - manual only
  const { checkAvailability, isChecking, checkResult, resetCheckResult } = useAvailabilityCheck();
  
  // Form schema
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    subject: z.string().min(1, { message: "Subject is required" }),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    studentId: z.number().or(z.string().transform(s => parseInt(s, 10))).optional(),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    recurrenceEndDate: z.date().optional(),
  }).refine(data => {
    return !data.isGroup || (data.isGroup && selectedStudents.length > 0);
  }, {
    message: "Select at least one student for group sessions",
    path: ["studentId"]
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      tutorId: "",
      studentId: undefined,
      date: new Date(),
      startTime: format(new Date().setMinutes(0), "HH:mm"),
      endTime: format(addHours(new Date().setMinutes(0), 1), "HH:mm"),
      isGroup: false,
      isRecurring: false,
      recurrenceInterval: 'weekly',
    },
  });

  // Fetch data once when dialog opens
  const fetchData = useCallback(async () => {
    if (!isOpen || tutors.length > 0) return; // Only fetch if we don't have data
    
    setIsDataLoading(true);
    try {
      // Fetch tutors and students in parallel
      const [tutorsResponse, studentsResponse] = await Promise.all([
        supabase
          .from('tutors')
          .select('*')
          .eq('status', 'active')
          .order('last_name', { ascending: true }),
        supabase
          .from('students')
          .select('*')
          .eq('status', 'active')
          .order('last_name', { ascending: true })
      ]);

      if (tutorsResponse.error) {
        console.error('Error fetching tutors:', tutorsResponse.error);
      } else {
        setTutors(tutorsResponse.data || []);
      }

      if (studentsResponse.error) {
        console.error('Error fetching students:', studentsResponse.error);
      } else {
        setStudents(studentsResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, [isOpen, tutors.length]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: "",
        description: "",
        subject: "",
        tutorId: "",
        studentId: undefined,
        date: preselectedTime ? preselectedTime.start : new Date(),
        startTime: preselectedTime 
          ? format(preselectedTime.start, "HH:mm") 
          : format(new Date().setMinutes(0), "HH:mm"),
        endTime: preselectedTime 
          ? format(preselectedTime.end, "HH:mm") 
          : format(addHours(new Date().setMinutes(0), 1), "HH:mm"),
        isGroup: false,
        isRecurring: false,
        recurrenceInterval: 'weekly',
      });
      
      setSelectedStudents([]);
      setIsGroupSession(false);
      setIsRecurring(false);
      resetCheckResult();
      fetchData();
    }
  }, [isOpen, preselectedTime, form, resetCheckResult, fetchData]);

  // Watch for form field changes (simplified)
  const watchedIsGroup = form.watch('isGroup');
  const watchedIsRecurring = form.watch('isRecurring');

  useEffect(() => {
    setIsGroupSession(!!watchedIsGroup);
    if (!watchedIsGroup) {
      setSelectedStudents([]);
    }
  }, [watchedIsGroup]);

  useEffect(() => {
    setIsRecurring(!!watchedIsRecurring);
  }, [watchedIsRecurring]);

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

      let studentIds: number[] = [];
      if (isGroupSession) {
        studentIds = selectedStudents;
      } else if (values.studentId) {
        studentIds = [values.studentId];
      }

      await checkAvailability({
        tutorId: values.tutorId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        studentIds: studentIds.length > 0 ? studentIds : undefined
      });
    } catch (error) {
      console.error('Error performing availability check:', error);
    }
  };

  // Handle selecting multiple students for group sessions
  const handleStudentSelect = (studentId: number) => {
    if (isGroupSession) {
      setSelectedStudents(prev => {
        if (prev.includes(studentId)) {
          return prev.filter(id => id !== studentId);
        } else {
          return [...prev, studentId];
        }
      });
    } else {
      form.setValue('studentId', studentId);
    }
  };

  // Form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      const startTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':');
      startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));

      const endTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':');
      endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));
      
      // Create the lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: values.title,
          description: values.description || '',
          subject: values.subject,
          tutor_id: values.tutorId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          is_group: values.isGroup,
          is_recurring: values.isRecurring,
          recurrence_interval: values.isRecurring ? values.recurrenceInterval : null,
          recurrence_end_date: values.isRecurring && values.recurrenceEndDate 
            ? values.recurrenceEndDate.toISOString() 
            : null
        })
        .select('id')
        .single();
      
      if (lessonError) throw lessonError;

      // Create Lesson Space room
      const duration = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      const roomResult = await createRoom({
        lessonId: lesson.id,
        title: values.title,
        startTime: startTime.toISOString(),
        duration: duration
      });

      if (!roomResult) {
        console.warn("Failed to create Lesson Space room");
      }
      
      // Add students
      if (values.isGroup && selectedStudents.length > 0) {
        const lessonStudentsData = selectedStudents.map(studentId => ({
          lesson_id: lesson.id,
          student_id: studentId
        }));
        
        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);
        
        if (studentsError) throw studentsError;
      } else if (values.studentId) {
        const { error: studentError } = await supabase
          .from('lesson_students')
          .insert({
            lesson_id: lesson.id,
            student_id: values.studentId
          });
        
        if (studentError) throw studentError;
      }
      
      toast.success('Lesson created successfully!');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Lesson</DialogTitle>
          <DialogDescription>
            Create a new tutoring session. An online room will be created automatically.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      value={field.value || ""}
                      disabled={isDataLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isDataLoading ? "Loading..." : "Select a tutor"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isDataLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading tutors...</span>
                          </div>
                        ) : tutors.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">No tutors available</div>
                        ) : (
                          tutors.map((tutor) => (
                            <SelectItem key={tutor.id} value={tutor.id}>
                              {tutor.first_name} {tutor.last_name}
                            </SelectItem>
                          ))
                        )}
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
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 space-x-2 space-y-0">
                    <div>
                      <FormLabel className="cursor-pointer">Group Session</FormLabel>
                      <p className="text-xs text-muted-foreground">Enable to select multiple students</p>
                    </div>
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
            
            {isGroupSession ? (
              <FormField
                control={form.control}
                name="studentId"
                render={() => (
                  <FormItem>
                    <FormLabel>Students (select multiple)</FormLabel>
                    <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto bg-white">
                      {isDataLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading students...</span>
                        </div>
                      ) : students.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No students available</div>
                      ) : (
                        students.map((student) => {
                          const studentId = typeof student.id === 'string' 
                            ? parseInt(student.id, 10) 
                            : student.id;
                            
                          return (
                            <div 
                              key={studentId} 
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer mb-1 ${
                                selectedStudents.includes(studentId) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-100'
                              }`}
                              onClick={() => handleStudentSelect(studentId)}
                            >
                              <span>{student.first_name} {student.last_name}</span>
                              {selectedStudents.includes(studentId) && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {selectedStudents.length === 0 && form.formState.errors.studentId && (
                      <p className="text-sm font-medium text-destructive mt-2">
                        Select at least one student for group sessions
                      </p>
                    )}
                    {selectedStudents.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value, 10))} 
                      value={field.value ? field.value.toString() : ""}
                      disabled={isDataLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isDataLoading ? "Loading..." : "Select a student"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isDataLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading students...</span>
                          </div>
                        ) : students.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">No students available</div>
                        ) : (
                          students.map((student) => {
                            const studentId = typeof student.id === 'string' 
                              ? parseInt(student.id, 10) 
                              : student.id;
                              
                            return (
                              <SelectItem key={studentId} value={studentId.toString()}>
                                {student.first_name} {student.last_name}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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
              />
            </div>
            
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-3">
                  <div>
                    <FormLabel>Recurring Lesson</FormLabel>
                    <p className="text-sm text-muted-foreground">Set up a repeating schedule for this lesson</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <div className="space-y-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="recurrenceInterval"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Repeat</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daily" id="daily" />
                            <FormLabel htmlFor="daily" className="font-normal cursor-pointer">Daily</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="weekly" id="weekly" />
                            <FormLabel htmlFor="weekly" className="font-normal cursor-pointer">Weekly</FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly" />
                            <FormLabel htmlFor="monthly" className="font-normal cursor-pointer">Monthly</FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading || isCreatingRoom}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || isDataLoading || isCreatingRoom}
              >
                {isLoading || isCreatingRoom ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingRoom ? 'Creating room...' : 'Creating lesson...'}
                  </>
                ) : (
                  'Create Lesson'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonForm;
