
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
import { CalendarIcon, Check, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tutor } from '@/types/tutor';
import { Student } from '@/types/student';
import { Lesson } from '@/types/lesson';
import { LESSON_SUBJECTS } from '@/constants/subjects';
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
import AvailabilityStatus from './AvailabilityStatus';

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
      fetchStudents();
    }
  }, [isOpen, lessonId]);

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
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', lessonId)
        .single();
      
      if (error) throw error;
      
      const processedLesson: Lesson = {
        ...data,
        lesson_type: (data.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular'
      };
      
      setLesson(processedLesson);
      
      // Parse dates for the form
      const startDate = parseISO(data.start_time);
      const startHours = format(startDate, 'HH:mm');
      
      const endDate = parseISO(data.end_time);
      const endHours = format(endDate, 'HH:mm');
      
      // Get student IDs from lesson_students
      const studentIds = data.lesson_students.map((ls: any) => {
        // Convert string IDs to numbers if needed
        return typeof ls.student.id === 'string' ? parseInt(ls.student.id, 10) : ls.student.id;
      });
      
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

  // Fetch tutors
  const fetchTutors = async () => {
    setIsFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('status', 'active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      // Now we have a more flexible status field in our Tutor type
      setTutors(data || []);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      toast.error('Failed to load tutors');
    } finally {
      setIsFetchingData(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    setIsFetchingData(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
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

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!lessonId) return;
    
    try {
      setIsLoading(true);
      setLoadingStep('Updating lesson...');
      
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
        subject: values.subject,
        tutor_id: values.tutorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_group: values.isGroup
      };
      
      // Update the lesson
      const { error: lessonError } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId);
      
      if (lessonError) throw lessonError;
      
      setLoadingStep('Updating students...');
      
      // Delete existing lesson_students entries
      const { error: deleteError } = await supabase
        .from('lesson_students')
        .delete()
        .eq('lesson_id', lessonId);
      
      if (deleteError) throw deleteError;
      
      // Add updated students to the lesson
      const lessonStudentsData = selectedStudents.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId
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
  
  // Handle student selection for multi-select
  const handleStudentSelect = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
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
                              onClick={() => handleStudentSelect(studentId)}
                            >
                              <div className={`w-4 h-4 border rounded flex items-center justify-center
                                ${selectedStudents.includes(studentId) ? 'bg-primary border-primary' : 'border-gray-300'}`}
                              >
                                {selectedStudents.includes(studentId) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <span>{student.first_name} {student.last_name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {selectedStudents.length === 0 && form.getValues('isGroup') && (
                      <p className="text-sm font-medium text-destructive">Select at least one student for group sessions</p>
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
                  ) : 'Update Lesson'}
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
