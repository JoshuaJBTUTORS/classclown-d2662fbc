import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  DialogClose
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
import { CalendarIcon, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isFetchingTutors, setIsFetchingTutors] = useState(false);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isGroupSession, setIsGroupSession] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { organization } = useOrganization();
  
  // Schema with validation for multiple students in group sessions
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    studentId: z.number().or(z.string().transform(s => parseInt(s, 10))).refine(val => !isGroupSession || val === 0, {
      message: "Individual student is only required for non-group sessions"
    }),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    recurrenceEndDate: z.date().optional(),
  }).refine((data) => {
    // For group sessions, require at least one selected student
    return !data.isGroup || (data.isGroup && selectedStudents.length > 0);
  }, {
    message: "Select at least one student for group sessions",
    path: ["studentId"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tutorId: "",
      studentId: 0,
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
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("AddLessonForm - Dialog opened, resetting form");
      
      // Initialize form with default values
      form.reset({
        title: "",
        description: "",
        tutorId: "",
        studentId: 0,
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
      
      // Clear any previously selected students
      setSelectedStudents([]);
      setIsGroupSession(false);
      
      // Fetch data
      fetchTutors();
      fetchStudents();
    }
  }, [isOpen, preselectedTime, form]);

  // Watch for changes to the isGroup field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'isGroup') {
        setIsGroupSession(!!value.isGroup);
        if (!value.isGroup) {
          setSelectedStudents([]);
        }
      }
      if (name === 'isRecurring') {
        setIsRecurring(!!value.isRecurring);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        throw error;
      }

      // Update the mapping to ensure compatibility with the Tutor type
      const formattedTutors: Tutor[] = data.map((tutor) => ({
        id: tutor.id,
        first_name: tutor.first_name,
        last_name: tutor.last_name,
        email: tutor.email,
        phone: tutor.phone,
        bio: tutor.bio,
        specialities: tutor.specialities || [],
        status: (tutor.status as 'active' | 'inactive' | 'pending'),
        title: tutor.title,
        rating: tutor.rating,
        education: tutor.education,
        joined_date: tutor.joined_date ? new Date(tutor.joined_date).toLocaleDateString() : undefined,
        created_at: tutor.created_at,
        organization_id: tutor.organization_id
      }));

      setTutors(formattedTutors);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors. Please try again.');
    }
  };

  const fetchStudents = async () => {
    setIsFetchingStudents(true);
    try {
      let query = supabase.from('students').select('*').eq('status', 'active');
      
      if (organization?.id) {
        query = query.eq('organization_id', organization.id);
      }
        
      const { data, error } = await query;
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsFetchingStudents(false);
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

  // Reset form function
  const resetForm = useCallback(() => {
    form.reset({
      title: "",
      description: "",
      tutorId: "",
      studentId: 0,
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
  }, [form, preselectedTime]);

  // Form submission with improved cleanup
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Creating lesson...');
      
      // Format the date and times into ISO strings
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
          tutor_id: values.tutorId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'scheduled',
          is_group: values.isGroup,
          is_recurring: values.isRecurring,
          recurrence_interval: values.isRecurring ? values.recurrenceInterval : null,
          recurrence_end_date: values.isRecurring && values.recurrenceEndDate 
            ? values.recurrenceEndDate.toISOString() 
            : null,
          organization_id: organization?.id || null
        })
        .select('id')
        .single();
      
      if (lessonError) throw lessonError;
      
      setLoadingMessage('Adding students to lesson...');
      
      // For group sessions, add multiple students
      if (values.isGroup && selectedStudents.length > 0) {
        // Create array of lesson_students objects
        const lessonStudentsData = selectedStudents.map(studentId => ({
          lesson_id: lesson.id,
          student_id: parseInt(studentId.toString(), 10),
          attendance_status: 'pending',
          organization_id: organization?.id || null
        }));
        
        // Insert all students at once
        const { error: studentsError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentsData);
        
        if (studentsError) throw studentsError;
      } else {
        // Add single student to the lesson
        const lessonStudentData = {
          lesson_id: lesson.id,
          student_id: parseInt(values.studentId.toString(), 10),
          attendance_status: 'pending',
          organization_id: organization?.id || null
        };
        
        const { error: studentError } = await supabase
          .from('lesson_students')
          .insert(lessonStudentData);
        
        if (studentError) throw studentError;
      }
      
      // Success! Close the dialog and reset form
      setIsLoading(false);
      toast.success('Lesson created successfully');
      
      // Use closeButtonRef to programmatically close the dialog
      resetForm();
      onClose(); // First call onClose to update parent component state
      
      // Give a small delay before calling onSuccess to ensure clean state
      setTimeout(() => {
        onSuccess(); // Then call onSuccess to trigger calendar refresh
      }, 100);
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
      setIsLoading(false);
    }
  };

  // Close handler with cleanup
  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing on outside click when loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>
            Create a new tutoring session by filling out the details below.
          </DialogDescription>
        </DialogHeader>
        
        <DialogClose ref={closeButtonRef} className="hidden" />
        
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
                          <SelectValue placeholder={isFetchingTutors ? "Loading tutors..." : "Select a tutor"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isFetchingTutors ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading tutors...</span>
                          </div>
                        ) : tutors.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">No tutors available</div>
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
                      {isFetchingStudents ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading students...</span>
                        </div>
                      ) : students.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">No students available</div>
                      ) : (
                        students.map((student) => {
                          // Convert student ID to number if it's a string
                          const studentId = typeof student.id === 'string' 
                            ? parseInt(student.id, 10) 
                            : student.id;
                            
                          return (
                            <div 
                              key={student.id} 
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isFetchingStudents ? "Loading students..." : "Select a student"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isFetchingStudents ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading students...</span>
                          </div>
                        ) : students.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">No students available</div>
                        ) : (
                          students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.first_name} {student.last_name}
                            </SelectItem>
                          ))
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
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                            disabled={(date) => date < new Date()}
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
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingMessage}
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
