
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Define interfaces for data types
interface Tutor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialities?: string[];
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subjects?: string;
}

interface AddLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().optional(),
  tutor_id: z.string({ required_error: "Please select a tutor." }),
  students: z.array(z.number()).min(1, { message: "Please select at least one student." }),
  date: z.date({ required_error: "Please select a date." }),
  start_time: z.string({ required_error: "Please select a start time." }),
  end_time: z.string({ required_error: "Please select an end time." }),
  is_group: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const AddLessonForm: React.FC<AddLessonFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tutor_id: "",
      students: [],
      date: undefined,
      start_time: "09:00",
      end_time: "10:00",
      is_group: false,
    },
  });

  // Fetch tutors and students on component mount
  useEffect(() => {
    const fetchTutorsAndStudents = async () => {
      try {
        const { data: tutorsData, error: tutorsError } = await supabase
          .from('tutors')
          .select('id, first_name, last_name, email, specialities')
          .eq('status', 'active');

        if (tutorsError) throw tutorsError;
        setTutors(tutorsData || []);

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, first_name, last_name, email, subjects')
          .eq('status', 'active');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data. Please try again.');
      }
    };

    if (isOpen) {
      fetchTutorsAndStudents();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSelectedStudents([]);
      setIsGroup(false);
      setCommandOpen(false);
      setIsPopoverOpen(false);
    }
  }, [isOpen, form]);

  // Watch for changes to the is_group field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'is_group') {
        setIsGroup(value.is_group || false);
        if (!value.is_group && selectedStudents.length > 1) {
          // If switching from group to individual and multiple students are selected
          const firstStudent = selectedStudents[0];
          setSelectedStudents([firstStudent]);
          form.setValue('students', [firstStudent.id]);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, selectedStudents]);

  const handleStudentSelect = (student: Student) => {
    if (!isGroup && selectedStudents.length > 0) {
      // For individual lessons, replace the current student
      setSelectedStudents([student]);
      form.setValue('students', [student.id]);
    } else {
      const isAlreadySelected = selectedStudents.some(s => s.id === student.id);
      
      if (isAlreadySelected) {
        // Remove student if already selected
        const updatedStudents = selectedStudents.filter(s => s.id !== student.id);
        setSelectedStudents(updatedStudents);
        form.setValue('students', updatedStudents.map(s => s.id));
      } else {
        // Add student
        const updatedStudents = [...selectedStudents, student];
        setSelectedStudents(updatedStudents);
        form.setValue('students', updatedStudents.map(s => s.id));
      }
    }
  };

  const removeStudent = (studentId: number) => {
    const updatedStudents = selectedStudents.filter(s => s.id !== studentId);
    setSelectedStudents(updatedStudents);
    form.setValue('students', updatedStudents.map(s => s.id));
  };

  const onSubmit = async (data: FormData) => {
    // Create the ISO datetime strings for start and end time
    const startDateTime = new Date(
      data.date.getFullYear(),
      data.date.getMonth(),
      data.date.getDate(),
      parseInt(data.start_time.split(':')[0]),
      parseInt(data.start_time.split(':')[1])
    ).toISOString();

    const endDateTime = new Date(
      data.date.getFullYear(),
      data.date.getMonth(),
      data.date.getDate(),
      parseInt(data.end_time.split(':')[0]),
      parseInt(data.end_time.split(':')[1])
    ).toISOString();

    setLoading(true);

    try {
      // Create the lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: data.title,
          description: data.description || null,
          tutor_id: data.tutor_id,
          start_time: startDateTime,
          end_time: endDateTime,
          is_group: data.is_group,
          status: 'scheduled'
        })
        .select('id')
        .single();

      if (lessonError) throw lessonError;

      // Create the lesson-student relationships
      const lessonStudentRelations = data.students.map(studentId => ({
        lesson_id: lessonData.id,
        student_id: studentId,
        attendance_status: 'pending'
      }));

      const { error: relationError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentRelations);

      if (relationError) throw relationError;

      toast.success('Lesson created successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setCommandOpen(false);
      onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Lesson</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Math Fundamentals" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Lesson details and curriculum..." 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_group"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Group Lesson</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow multiple students in the lesson
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

              <FormField
                control={form.control}
                name="tutor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tutor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <FormField
              control={form.control}
              name="students"
              render={() => (
                <FormItem>
                  <FormLabel>Students {isGroup ? '(Multiple)' : '(One only)'}</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedStudents.map((student) => (
                      <Badge 
                        key={student.id} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {student.first_name} {student.last_name}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeStudent(student.id)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <Popover 
                    open={isPopoverOpen} 
                    onOpenChange={(open) => {
                      setIsPopoverOpen(open);
                      // Only set commandOpen when popover is open
                      if (open) {
                        setCommandOpen(true);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between w-full"
                          disabled={!isGroup && selectedStudents.length > 0}
                          onClick={() => setIsPopoverOpen(true)}
                        >
                          {isGroup ? "Add students" : (selectedStudents.length === 0 ? "Select student" : "Change student")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]" side="bottom" align="start">
                      <Command>
                        <CommandInput placeholder="Search students..." />
                        <CommandEmpty>No students found.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {students && students.length > 0 ? students.map((student) => {
                            const isSelected = selectedStudents.some(s => s.id === student.id);
                            return (
                              <CommandItem
                                key={student.id}
                                value={student.id.toString()}
                                onSelect={() => {
                                  handleStudentSelect(student);
                                  if (!isGroup) {
                                    setIsPopoverOpen(false);
                                  }
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {student.first_name} {student.last_name}
                              </CommandItem>
                            );
                          }) : (
                            <div className="py-2 px-2 text-sm">Loading students...</div>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.students?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.students.message}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="pl-3 text-left font-normal"
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

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="start_time"
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
                  name="end_time"
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonForm;
