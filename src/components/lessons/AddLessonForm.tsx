
import React, { useState, useEffect } from 'react';
import { format, addHours, parseISO } from 'date-fns';
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
import { CalendarIcon, Check } from 'lucide-react';
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
  const [isRecurring, setIsRecurring] = useState(false);
  const { organization } = useOrganization();
  
  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    tutorId: z.string().min(1, { message: "Tutor is required" }),
    studentIds: z.array(z.number()).min(1, { message: "At least one student is required" }),
    date: z.date({ required_error: "Date is required" }),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    isGroup: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceInterval: z.enum(['daily', 'weekly', 'monthly']).optional(),
    recurrenceEndDate: z.date().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tutorId: "",
      studentIds: [],
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

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
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
        .select('*')
        .eq('status', 'active');
        
      if (error) throw error;
      
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTutors();
      fetchStudents();
    }
  }, [isOpen]);

  useEffect(() => {
    const recurring = form.watch('isRecurring');
    setIsRecurring(recurring);
  }, [form.watch('isRecurring')]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Creating lesson...');
      
      // Format the date and times into ISO strings
      const startTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':');
      startTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':');
      endTime.setHours(parseInt(endHours), parseInt(endMinutes));

      // Add the organization_id to the lesson data
      const lessonData = {
        title: values.title,
        description: values.description || '',
        tutor_id: values.tutorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        is_group: values.isGroup,
        is_recurring: values.isRecurring,
        organization_id: organization?.id || null
      };

      // Add recurrence fields if this is a recurring lesson
      if (values.isRecurring) {
        Object.assign(lessonData, {
          recurrence_interval: values.recurrenceInterval,
          recurrence_end_date: values.recurrenceEndDate ? values.recurrenceEndDate.toISOString() : null,
        });
      }
      
      // Create the lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select('id')
        .single();
      
      if (lessonError) throw lessonError;
      
      setLoadingMessage('Adding students to lesson...');
      
      // Add students to the lesson
      const lessonStudentsData = values.studentIds.map(studentId => ({
        lesson_id: lesson.id,
        student_id: studentId,
        attendance_status: 'pending'
      }));
      
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentsData);
      
      if (studentsError) throw studentsError;
      
      setIsLoading(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
      setIsLoading(false);
    }
  };
  
  const handleMultiSelect = (selectedId: number) => {
    const currentSelectedIds = form.getValues('studentIds');
    let newSelectedIds;
    
    if (currentSelectedIds.includes(selectedId)) {
      // Remove the ID if it's already selected
      newSelectedIds = currentSelectedIds.filter(id => id !== selectedId);
    } else {
      // Add the ID if it's not selected
      newSelectedIds = [...currentSelectedIds, selectedId];
    }
    
    form.setValue('studentIds', newSelectedIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
          <DialogDescription>
            Create a new tutoring session by filling out the details below.
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
                      defaultValue={field.value}
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
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Students</FormLabel>
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 px-1">No students available</p>
                    ) : (
                      students.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => handleMultiSelect(student.id)}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center
                            ${form.getValues('studentIds').includes(student.id) ? 'bg-primary border-primary' : 'border-gray-300'}`}
                          >
                            {form.getValues('studentIds').includes(student.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span>{student.first_name} {student.last_name}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {form.formState.errors.studentIds && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.studentIds.message}</p>
                  )}
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
                          defaultValue={field.value}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? loadingMessage : 'Create Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonForm;
