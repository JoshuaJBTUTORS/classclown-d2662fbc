import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUKDateTime, convertUKToUTC } from '@/utils/timezone';
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
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Check, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import AvailabilityStatus from './AvailabilityStatus';
import MultiSelectStudents from './MultiSelectStudents';
import { cn } from '@/lib/utils';
import { generateRecurringLessonInstances } from '@/services/recurringLessonService';

interface AddLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddLessonForm: React.FC<AddLessonFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    subject: z.string().min(1, { message: "Subject is required" }),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.string().optional(),
    recurrenceEndDate: z.date().optional(),
    noEndDate: z.boolean().default(false),
  }).refine(data => {
    return !data.isGroup || (data.isGroup && selectedStudents.length > 0);
  }, {
    message: "Select at least one student for group sessions",
    path: ["studentIds"],
  }).refine(data => {
    return !data.isRecurring || (data.isRecurring && data.recurrenceInterval);
  }, {
    message: "Recurrence pattern is required for recurring lessons",
    path: ["recurrenceInterval"],
  }).refine(data => {
    return !data.isRecurring || (data.isRecurring && (data.recurrenceEndDate || data.noEndDate));
  }, {
    message: "End date is required for recurring lessons (or select 'No End Date')",
    path: ["recurrenceEndDate"],
  }).refine(data => {
    if (data.isRecurring && data.recurrenceEndDate && data.date && !data.noEndDate) {
      return data.recurrenceEndDate > data.date;
    }
    return true;
  }, {
    message: "End date must be after the lesson date",
    path: ["recurrenceEndDate"],
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
      isRecurring: false,
      recurrenceInterval: "",
      recurrenceEndDate: undefined,
      noEndDate: false,
    },
  });

  // Availability checking integration
  const { checkAvailability, isChecking, checkResult, resetCheckResult } = useAvailabilityCheck();

  useEffect(() => {
    if (isOpen) {
      fetchTutors();
      fetchStudents();
    }
  }, [isOpen]);

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

  const fetchStudents = async () => {
    setIsFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or('status.eq.active,status.is.null,status.eq.')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsFetchingData(false);
    }
  };

  const createLessonSpaceRoom = async (lessonId: string, tutorId: string, isGroup: boolean) => {
    try {
      console.log('Creating LessonSpace room for lesson:', lessonId);
      
      const { data, error } = await supabase.functions.invoke('lesson-space-integration', {
        body: {
          action: 'create-room',
          lessonId: lessonId,
          title: 'Lesson Room',
          startTime: new Date().toISOString(),
          duration: 60
        }
      });

      if (error) {
        console.error('Error creating LessonSpace room:', error);
        throw error;
      }

      if (data && data.success) {
        console.log('LessonSpace room created successfully:', data);
        return data;
      } else {
        throw new Error(data?.error || 'Failed to create LessonSpace room');
      }
    } catch (error) {
      console.error('Error in createLessonSpaceRoom:', error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLoadingStep('Creating lesson...');

      // Create UK local time and convert to UTC for storage
      const ukStartTime = createUKDateTime(values.date, values.startTime);
      const ukEndTime = createUKDateTime(values.date, values.endTime);
      
      const startTime = convertUKToUTC(ukStartTime);
      const endTime = convertUKToUTC(ukEndTime);

      // Get the day name for recurring lessons
      const dayName = values.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Create the original lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([
          {
            title: values.title,
            description: values.description || '',
            subject: values.subject,
            tutor_id: values.tutorId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_group: values.isGroup,
            status: 'scheduled',
            is_recurring: values.isRecurring,
            is_recurring_instance: false,
            parent_lesson_id: null,
            instance_date: null,
            recurrence_interval: values.isRecurring ? values.recurrenceInterval : null,
            recurrence_end_date: values.isRecurring && values.recurrenceEndDate && !values.noEndDate ? values.recurrenceEndDate.toISOString() : null,
            recurrence_day: values.isRecurring ? dayName : null,
          },
        ])
        .select()

      if (lessonError) throw lessonError;

      const newLessonId = lessonData?.[0]?.id;

      setLoadingStep('Adding students...');

      // Add students to the original lesson
      if (newLessonId && selectedStudents.length > 0) {
        const lessonStudentsData = selectedStudents.map(studentId => ({
          lesson_id: newLessonId,
          student_id: studentId
        }));

        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);

        if (studentsError) throw studentsError;
      }

      // Automatically create LessonSpace room for the lesson
      if (newLessonId) {
        try {
          setLoadingStep('Creating video room...');
          const roomData = await createLessonSpaceRoom(newLessonId, values.tutorId, values.isGroup);
          console.log('Room created successfully:', roomData);
        } catch (roomError) {
          console.error('Room creation failed:', roomError);
          // Don't fail the entire lesson creation if room creation fails
          toast.error('Lesson created but video room creation failed. You can create it manually later.');
        }
      }

      // Generate recurring instances if this is a recurring lesson
      if (values.isRecurring && newLessonId) {
        setLoadingStep('Generating recurring lessons...');
        
        const instancesGenerated = await generateRecurringLessonInstances({
          originalLessonId: newLessonId,
          title: values.title,
          description: values.description,
          subject: values.subject,
          tutorId: values.tutorId,
          startTime,
          endTime,
          isGroup: values.isGroup,
          recurrenceInterval: values.recurrenceInterval as any,
          recurrenceEndDate: values.recurrenceEndDate,
          isInfinite: values.noEndDate,
          selectedStudents
        });

        console.log(`Generated ${instancesGenerated} recurring lesson instances`);
      }

      setIsLoading(false);
      toast.success(`Lesson created successfully${values.isRecurring ? ` with recurring instances` : ''}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
      setIsLoading(false);
    }
  };

  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => [...prev, studentId]);
  };

  const handleStudentRemove = (studentId: number) => {
    setSelectedStudents(prev => prev.filter(id => id !== studentId));
  };

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
        studentIds: selectedStudents.length > 0 ? selectedStudents : undefined
      });
    } catch (error) {
      console.error('Error performing availability check:', error);
    }
  };

  const handleSelectAlternativeTutor = (tutorId: string, tutorName: string) => {
    form.setValue('tutorId', tutorId);
    resetCheckResult();
    toast.success(`Switched to ${tutorName}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>
            Create a new tutoring session for your students. A video room will be created automatically.
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
                        
                        placeholder={form.watch('isGroup') ? "Select students for group lesson..." : "Select a student..."}
                        disabled={isFetchingData}
                      />
                    </FormControl>
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
                              className={cn(
                                "pl-3 text-left font-normal w-full h-[42px]",
                                !field.value && "text-muted-foreground"
                              )}
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
                            className={cn("p-3 pointer-events-auto")}
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
                        <Input type="time" className="h-[42px]" {...field} />
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
                        <Input type="time" className="h-[42px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Recurring Lesson</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Create a series of lessons that repeat automatically
                        </div>
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

                {form.watch('isRecurring') && (
                  <div className="space-y-4 ml-4 border-l-2 border-gray-200 pl-4">
                    <FormField
                      control={form.control}
                      name="recurrenceInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurrence Pattern</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select how often to repeat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="noEndDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('recurrenceEndDate', undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">No End Date</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Lessons continue indefinitely
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!form.watch('noEndDate') && (
                      <FormField
                        control={form.control}
                        name="recurrenceEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
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
                                      <span>Pick end date</span>
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
                                  className={cn("p-3 pointer-events-auto")}
                                  disabled={(date) => date <= form.getValues('date')}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>

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
                  ) : 'Create Lesson'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonForm;
