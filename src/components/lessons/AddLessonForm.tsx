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
    title: z.string().optional(),
    description: z.string().optional(),
    subject: z.string().optional(),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
    isReviewRoom: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.string().optional(),
    recurrenceEndDate: z.date().optional(),
    noEndDate: z.boolean().default(false),
  }).refine(data => {
    // Title and subject required only when NOT a review room session
    if (data.isReviewRoom) return true;
    return !!data.title && data.title.length > 0;
  }, {
    message: "Title is required",
    path: ["title"],
  }).refine(data => {
    if (data.isReviewRoom) return true;
    return !!data.subject && data.subject.length > 0;
  }, {
    message: "Subject is required",
    path: ["subject"],
  }).refine(data => {
    if (data.isReviewRoom) return true;
    return !data.isGroup || (data.isGroup && selectedStudents.length > 0);
  }, {
    message: "Select at least one student for group sessions",
    path: ["studentIds"],
  }).refine(data => {
    if (data.isReviewRoom) return true;
    return !data.isRecurring || (data.isRecurring && data.recurrenceInterval);
  }, {
    message: "Recurrence pattern is required for recurring lessons",
    path: ["recurrenceInterval"],
  }).refine(data => {
    if (data.isReviewRoom) return true;
    return !data.isRecurring || (data.isRecurring && (data.recurrenceEndDate || data.noEndDate));
  }, {
    message: "End date is required for recurring lessons (or select 'No End Date')",
    path: ["recurrenceEndDate"],
  }).refine(data => {
    if (data.isReviewRoom) return true;
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
      isReviewRoom: false,
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

      // Apply Review Room defaults / overrides
      const isReviewRoom = values.isReviewRoom;
      const effectiveTitle = isReviewRoom ? 'Review Room Session' : (values.title || '');
      const effectiveSubject = isReviewRoom ? 'Review Room' : (values.subject || '');
      const effectiveDescription = isReviewRoom
        ? 'Free GCSE revision session'
        : (values.description || '');
      const effectiveIsGroup = isReviewRoom ? true : values.isGroup;
      // Review Room is always recurring weekly with no end date
      const effectiveIsRecurring = isReviewRoom ? true : values.isRecurring;
      const effectiveRecurrenceInterval = isReviewRoom ? 'weekly' : values.recurrenceInterval;
      const effectiveNoEndDate = isReviewRoom ? true : values.noEndDate;
      const effectiveRecurrenceEndDate = isReviewRoom ? undefined : values.recurrenceEndDate;

      // Create UK local time and convert to UTC for storage
      const ukStartTime = createUKDateTime(values.date, values.startTime);
      const ukEndTime = createUKDateTime(values.date, values.endTime);

      const startTime = convertUKToUTC(ukStartTime);
      const endTime = convertUKToUTC(ukEndTime);

      // Get the day name for recurring lessons
      const dayName = values.date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Create the original lesson
      const REVIEW_ROOM_URL = 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84';
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([
          {
            title: effectiveTitle,
            description: effectiveDescription,
            subject: effectiveSubject,
            tutor_id: values.tutorId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_group: effectiveIsGroup,
            status: 'scheduled',
            is_recurring: effectiveIsRecurring,
            is_recurring_instance: false,
            parent_lesson_id: null,
            instance_date: null,
            recurrence_interval: effectiveIsRecurring ? effectiveRecurrenceInterval : null,
            recurrence_end_date: effectiveIsRecurring && effectiveRecurrenceEndDate && !effectiveNoEndDate ? effectiveRecurrenceEndDate.toISOString() : null,
            recurrence_day: effectiveIsRecurring ? dayName : null,
            ...(isReviewRoom
              ? { lesson_type: 'review_room', lesson_space_room_url: REVIEW_ROOM_URL }
              : {}),
          },
        ])
        .select()

      if (lessonError) throw lessonError;

      const newLessonId = lessonData?.[0]?.id;

      // Add students to the original lesson (skipped for Review Room — none selected)
      if (newLessonId && !isReviewRoom && selectedStudents.length > 0) {
        setLoadingStep('Adding students...');
        const lessonStudentsData = selectedStudents.map(studentId => ({
          lesson_id: newLessonId,
          student_id: studentId
        }));

        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);

        if (studentsError) throw studentsError;
      }

      // Automatically create LessonSpace room for the lesson (skipped for Review Room — uses shared link)
      if (newLessonId && !isReviewRoom) {
        try {
          setLoadingStep('Creating video room...');
          const roomData = await createLessonSpaceRoom(newLessonId, values.tutorId, effectiveIsGroup);
          console.log('Room created successfully:', roomData);
        } catch (roomError) {
          console.error('Room creation failed:', roomError);
          toast.error('Lesson created but video room creation failed. You can create it manually later.');
        }
      }

      // Generate recurring instances if this is a recurring lesson
      if (effectiveIsRecurring && newLessonId) {
        setLoadingStep('Generating recurring lessons...');

        const instancesGenerated = await generateRecurringLessonInstances({
          originalLessonId: newLessonId,
          title: effectiveTitle,
          description: effectiveDescription,
          subject: effectiveSubject,
          tutorId: values.tutorId,
          startTime,
          endTime,
          isGroup: effectiveIsGroup,
          recurrenceInterval: effectiveRecurrenceInterval as any,
          recurrenceEndDate: effectiveRecurrenceEndDate,
          isInfinite: effectiveNoEndDate,
          selectedStudents: isReviewRoom ? [] : selectedStudents
        });

        console.log(`Generated ${instancesGenerated} recurring lesson instances`);
      }

      setIsLoading(false);
      toast.success(
        isReviewRoom
          ? 'Review Room session created with recurring weekly instances'
          : `Lesson created successfully${effectiveIsRecurring ? ` with recurring instances` : ''}`
      );
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
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[var(--radius-soft)] border-0 p-4 sm:p-6 shadow-[var(--shadow-soft-lg)]">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight">
            {form.watch('isReviewRoom') ? 'Add Review Room Session' : 'Add New Lesson'}
          </DialogTitle>
          <DialogDescription>
            {form.watch('isReviewRoom')
              ? 'Free GCSE revision session — only tutor and time required. Recurs weekly with no end date. A video room is created automatically.'
              : 'Create a new tutoring session for your students. A video room will be created automatically.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && !form.formState.isSubmitting ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground/15 border-t-foreground"></div>
            <span className="ml-2 text-sm text-muted-foreground">{loadingStep}</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isReviewRoom"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-3 space-y-0 rounded-[var(--radius-soft)] bg-pastel-mint p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-heading font-bold text-pastel-mint-foreground">Review Room Session</FormLabel>
                      <div className="text-sm text-pastel-mint-foreground/70">
                        Free GCSE revision — only tutor & time needed. Auto-recurs weekly indefinitely.
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

              {!form.watch('isReviewRoom') && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Math Tutoring Session" className="h-11 rounded-full border-foreground/15 px-4" {...field} />
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
                            <SelectTrigger className="h-11 rounded-full border-foreground/15 px-4">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-foreground/10 shadow-[var(--shadow-soft)]">
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
                            className="resize-none rounded-2xl border-foreground/15 px-4 py-3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className={cn("grid gap-4", form.watch('isReviewRoom') ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
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
                          <SelectTrigger className="h-11 rounded-full border-foreground/15 px-4">
                            <SelectValue placeholder="Select a tutor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-foreground/10 shadow-[var(--shadow-soft)]">
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

                {!form.watch('isReviewRoom') && (
                  <FormField
                    control={form.control}
                    name="isGroup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-2 space-y-0 rounded-full bg-pastel-sky px-4 h-11">
                        <FormLabel className="text-pastel-sky-foreground font-medium">Group Session</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {!form.watch('isReviewRoom') && (
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
                          placeholder={form.watch('isGroup') ? "Select students for group lesson..." : "Select a student..."}
                          disabled={isFetchingData}
                        />
                      </FormControl>
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
                               className={cn(
                                 "px-4 text-left font-normal w-full h-11 rounded-full border-foreground/15 bg-transparent hover:bg-pastel-sky/50",
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
                        <PopoverContent className="w-auto p-0 rounded-[var(--radius-soft)] border-foreground/10 shadow-[var(--shadow-soft-lg)]" align="start">
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
                        <Input type="time" className="h-11 rounded-full border-foreground/15 px-4" {...field} />
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
                        <Input type="time" className="h-11 rounded-full border-foreground/15 px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!form.watch('isReviewRoom') && (
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
              )}

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
                  ) : (form.watch('isReviewRoom') ? 'Create Review Room Session' : 'Create Lesson')}
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
