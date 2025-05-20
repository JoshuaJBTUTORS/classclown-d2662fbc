
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
  FormDescription,
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
  CommandList,
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
  editingLesson?: {
    id: string;
    title: string;
    description?: string;
    tutor_id: string;
    students: { id: number }[];
    date: Date;
    start_time: string;
    end_time: string;
    is_group: boolean;
    is_recurring?: boolean;
    recurrence_interval?: string;
    recurrence_day?: string;
    recurrence_end_date?: Date;
  };
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
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.string().optional(),
  recurrence_day: z.string().optional(),
  recurrence_end_date: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddLessonForm: React.FC<AddLessonFormProps> = ({ isOpen, onClose, onSuccess, editingLesson }) => {
  // Initialize students as empty array to avoid undefined is not iterable error
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isEditing = Boolean(editingLesson);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingLesson?.title || "",
      description: editingLesson?.description || "",
      tutor_id: editingLesson?.tutor_id || "",
      students: editingLesson?.students?.map(s => s.id) || [],
      date: editingLesson?.date || undefined,
      start_time: editingLesson?.start_time || "09:00",
      end_time: editingLesson?.end_time || "10:00",
      is_group: editingLesson?.is_group || false,
      is_recurring: editingLesson?.is_recurring || false,
      recurrence_interval: editingLesson?.recurrence_interval || "weekly",
      recurrence_day: editingLesson?.recurrence_day || "",
      recurrence_end_date: editingLesson?.recurrence_end_date,
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

        // If editing, fetch the selected students
        if (editingLesson && editingLesson.students) {
          const studentIds = editingLesson.students.map(s => s.id);
          const selectedStuds = studentsData?.filter(s => studentIds.includes(s.id)) || [];
          setSelectedStudents(selectedStuds);
          setIsGroup(editingLesson.is_group);
          setIsRecurring(editingLesson.is_recurring || false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data. Please try again.');
      }
    };

    if (isOpen) {
      fetchTutorsAndStudents();
    }
  }, [isOpen, editingLesson]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !editingLesson) {
      form.reset();
      setSelectedStudents([]);
      setIsGroup(false);
      setIsRecurring(false);
      setIsPopoverOpen(false);
    }
  }, [isOpen, form, editingLesson]);

  // Watch for changes to the is_group field
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.is_group !== undefined) {
        setIsGroup(value.is_group);
        if (!value.is_group && selectedStudents.length > 1) {
          // If switching from group to individual and multiple students are selected
          const firstStudent = selectedStudents[0];
          setSelectedStudents([firstStudent]);
          form.setValue('students', [firstStudent.id]);
        }
      }
      
      if (value.is_recurring !== undefined) {
        setIsRecurring(value.is_recurring);
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
      // Create or update the lesson
      const lessonData = {
        title: data.title,
        description: data.description || null,
        tutor_id: data.tutor_id,
        start_time: startDateTime,
        end_time: endDateTime,
        is_group: data.is_group,
        is_recurring: data.is_recurring,
        recurrence_interval: data.is_recurring ? data.recurrence_interval : null,
        recurrence_day: data.is_recurring ? data.recurrence_day : null,
        recurrence_end_date: data.is_recurring && data.recurrence_end_date ? data.recurrence_end_date.toISOString() : null,
        status: 'scheduled'
      };

      let lessonId = '';

      if (isEditing && editingLesson) {
        // Update the existing lesson
        const { data: updatedLesson, error: updateError } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id)
          .select('id')
          .single();

        if (updateError) throw updateError;
        lessonId = updatedLesson.id;

        // Delete existing student relationships
        const { error: deleteError } = await supabase
          .from('lesson_students')
          .delete()
          .eq('lesson_id', lessonId);

        if (deleteError) throw deleteError;
      } else {
        // Create a new lesson
        const { data: newLesson, error: lessonError } = await supabase
          .from('lessons')
          .insert(lessonData)
          .select('id')
          .single();

        if (lessonError) throw lessonError;
        lessonId = newLesson.id;
      }

      // Create the lesson-student relationships
      const lessonStudentRelations = data.students.map(studentId => ({
        lesson_id: lessonId,
        student_id: studentId,
        attendance_status: 'pending'
      }));

      const { error: relationError } = await supabase
        .from('lesson_students')
        .insert(lessonStudentRelations);

      if (relationError) throw relationError;

      toast.success(isEditing ? 'Lesson updated successfully!' : 'Lesson created successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} lesson. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
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
                    onOpenChange={setIsPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="justify-between w-full"
                          disabled={!isGroup && selectedStudents.length > 0}
                        >
                          {isGroup ? "Add students" : (selectedStudents.length === 0 ? "Select student" : "Change student")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]" side="bottom" align="start">
                      <Command>
                        <CommandInput placeholder="Search students..." />
                        <CommandList>
                          <CommandEmpty>No students found.</CommandEmpty>
                          <CommandGroup className="max-h-48 overflow-auto">
                            {students.map((student) => {
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
                            })}
                          </CommandGroup>
                        </CommandList>
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

            {/* Recurring Session Options */}
            <FormField
              control={form.control}
              name="is_recurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Session</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Set up a repeating lesson schedule
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

            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurrence_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence Pattern</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || "weekly"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrence_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrence_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
                                <span>Pick an end date</span>
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
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When the recurring sessions should end
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Lesson" : "Create Lesson")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLessonForm;
