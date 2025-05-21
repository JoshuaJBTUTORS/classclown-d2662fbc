
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { Lesson } from '@/types/lesson';
import { useOrganization } from '@/contexts/OrganizationContext';

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
  const [students, setStudents] = useState<Student[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
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
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tutorId: "",
      studentIds: [],
      date: new Date(),
      startTime: "",
      endTime: "",
      isGroup: false,
    },
  });

  const fetchLessonDetails = async () => {
    if (!lessonId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();
      
      if (error) throw error;
      
      setLesson(data);
      
      // Parse dates for the form
      const startDate = parseISO(data.start_time);
      const startHours = format(startDate, 'HH:mm');
      
      const endDate = parseISO(data.end_time);
      const endHours = format(endDate, 'HH:mm');
      
      // Get student IDs and ensure they are numbers
      const studentIds = data.lesson_students.map((ls: any) => {
        // Convert string IDs to numbers
        return typeof ls.student.id === 'string' ? parseInt(ls.student.id, 10) : ls.student.id;
      });
      
      // Set form values
      form.reset({
        title: data.title,
        description: data.description || '',
        tutorId: data.tutor_id,
        studentIds: studentIds,
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
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('organization_id', organization?.id)
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
        .eq('organization_id', organization?.id)
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
      if (lessonId) {
        fetchLessonDetails();
      }
    }
  }, [isOpen, lessonId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lessonId) return;
    
    try {
      setIsLoading(true);
      setLoadingMessage('Updating lesson...');
      
      // Format the date and times into ISO strings
      const startTime = new Date(values.date);
      const [startHours, startMinutes] = values.startTime.split(':');
      startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));

      const endTime = new Date(values.date);
      const [endHours, endMinutes] = values.endTime.split(':');
      endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10));

      // Update the lesson data
      const lessonData = {
        title: values.title,
        description: values.description || '',
        tutor_id: values.tutorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_group: values.isGroup,
        organization_id: organization?.id || null
      };
      
      // Update the lesson
      const { error: lessonError } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId);
      
      if (lessonError) throw lessonError;
      
      setLoadingMessage('Updating students...');
      
      // Delete existing lesson_students entries
      const { error: deleteError } = await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lessonId);
      
      if (deleteError) throw deleteError;
      
      // Add updated students to the lesson
      const lessonStudentsData = values.studentIds.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
        attendance_status: 'pending',
        organization_id: organization?.id || null
      }));
      
      const { error: studentsError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentsData);
      
      if (studentsError) throw studentsError;
      
      setIsLoading(false);
      toast.success('Lesson updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
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
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Update the lesson details below.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && !form.formState.isSubmitting ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading lesson details...</span>
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
                        students.map((student) => {
                          // Convert ID to number for comparison
                          const studentId = typeof student.id === 'string' 
                            ? parseInt(student.id, 10) 
                            : student.id;
                            
                          return (
                            <div
                              key={student.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                              onClick={() => handleMultiSelect(studentId)}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center
                                ${form.getValues('studentIds').includes(studentId) ? 'bg-primary border-primary' : 'border-gray-300'}`}
                              >
                                {form.getValues('studentIds').includes(studentId) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span>{student.first_name} {student.last_name}</span>
                            </div>
                          );
                        })
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? loadingMessage : 'Update Lesson'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditLessonForm;
