import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Check, UserCheck, BookOpen } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lesson } from '@/types/lesson';

interface CompleteSessionDialogProps {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  skipHomeworkStep?: boolean;
}

// Define the form schema for attendance and feedback
const formSchema = z.object({
  students: z.array(
    z.object({
      id: z.number(),
      first_name: z.string(),
      last_name: z.string(),
      attendance: z.enum(['attended', 'missed', 'cancelled']),
      feedback: z.string().optional(),
      homework: z.string().optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

const CompleteSessionDialog: React.FC<CompleteSessionDialogProps> = ({ 
  lessonId, 
  isOpen, 
  onClose, 
  onSuccess,
  skipHomeworkStep = false
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [homeworkData, setHomeworkData] = useState<FormData | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      students: [],
    },
  });

  // Set the dialog title and description based on the current step
  useEffect(() => {
    if (skipHomeworkStep) {
      setDialogTitle('Record Student Attendance & Feedback');
      setDialogDescription('Record attendance and provide feedback for this session');
    } else {
      setDialogTitle('Assign Homework');
      setDialogDescription('Assign homework for students after this session');
    }
  }, [skipHomeworkStep]);

  // Fetch lesson details when dialog opens
  useEffect(() => {
    if (isOpen && lessonId) {
      fetchLessonDetails(lessonId);
    }
  }, [isOpen, lessonId]);

  // Initialize form values when lesson data is loaded or when step changes
  useEffect(() => {
    if (lesson && lesson.students) {
      const studentData = lesson.students.map(student => {
        // If we have stored homework data and we're in the attendance step, use it
        const homeworkText = homeworkData?.students.find(s => s.id === student.id)?.homework || '';
        
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          attendance: 'attended' as 'attended' | 'missed' | 'cancelled',
          feedback: '',
          homework: homeworkText,
        };
      });

      form.reset({
        students: studentData,
      });
    }
  }, [lesson, form, homeworkData, skipHomeworkStep]);

  const fetchLessonDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;

      // Transform the data to match our Lesson interface
      const students = lessonData.lesson_students.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name
      }));

      const processedStudents = students.map(student => {
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          attendance: 'attended' as 'attended' | 'missed' | 'cancelled',
          feedback: '',
          homework: '',
        };
      });

      const lessonStudentsData = lessonData.lesson_students.map((ls: any) => ({
        student: {
          id: ls.student.id,
          first_name: ls.student.first_name,
          last_name: ls.student.last_name
        }
      }));

      // Simplified lesson data without removed video conference properties
      const processedLesson: Lesson = {
        ...lessonData,
        lesson_type: (lessonData.lesson_type as 'regular' | 'trial' | 'makeup') || 'regular',
        students: processedStudents,
        lesson_students: lessonStudentsData
      };

      setLesson(processedLesson);
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!lesson || !lessonId) return;
    
    setLoading(true);
    
    try {
      // If we're in the "Assign Homework" step (not skipping homework)
      if (!skipHomeworkStep) {
        console.log('Homework assigned:', data.students);
        
        // Store homework data for the next step
        setHomeworkData(data);
        
        toast.success('Homework assigned successfully!');
        
        // Call the onSuccess callback to move to the next step (attendance)
        if (onSuccess) {
          onSuccess();
        }
      } 
      // If we're in the "Record Attendance" step (skipping homework)
      else {
        console.log('Updating lesson status to completed');
        // 1. Update the lesson status to completed
        const { error: lessonError } = await supabase
          .from('lessons')
          .update({ 
            status: 'completed',
            completion_date: new Date().toISOString()
          })
          .eq('id', lessonId);
        
        if (lessonError) {
          console.error('Error updating lesson status:', lessonError);
          throw lessonError;
        }

        console.log('Processing student attendance and homework');
        // 2. Process each student's data
        const studentUpdates = data.students.map(async (student) => {
          console.log(`Processing student ${student.id}: ${student.attendance}`);

          // Add the homework to the homework table if it was provided
          if (student.homework) {
            try {
              const { error: homeworkError } = await supabase
                .from('homework')
                .insert({
                  lesson_id: lessonId,
                  title: `${lesson.title} Homework - ${student.first_name} ${student.last_name}`,
                  description: student.homework,
                });
              
              if (homeworkError) {
                console.error('Error adding homework:', homeworkError);
                throw homeworkError;
              }
            } catch (homeworkError) {
              console.error('Error saving homework:', homeworkError);
              // We don't want to fail the whole process if just the homework fails
            }
          }

          // Save feedback if provided (in a real app, you might want to store this in a separate table)
          if (student.feedback) {
            console.log(`Feedback for student ${student.id}: ${student.feedback}`);
          }
        });

        await Promise.all(studentUpdates);

        toast.success('Session completed successfully!');
        
        // Call the onSuccess callback to refresh the parent component
        if (onSuccess) {
          onSuccess();
        }
        
        // Force close the dialog by calling onClose directly
        onClose();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  // If dialog isn't open or no lesson data, don't render
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {skipHomeworkStep ? 
              <><UserCheck className="h-5 w-5" /> {dialogTitle}</> : 
              <><BookOpen className="h-5 w-5" /> {dialogTitle}</>
            }
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
            {lesson && lesson.start_time && (
              <div className="mt-1 text-sm">
                {`${format(parseISO(lesson.start_time), 'MMMM d, yyyy • h:mm a')} - 
                ${format(parseISO(lesson.end_time), 'h:mm a')}`}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {lesson ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Homework and Attendance Section */}
              <div className="space-y-4">
                <Separator />
                
                {form.getValues().students.map((student, index) => (
                  <div key={student.id} className="p-4 border rounded-md space-y-3">
                    <h4 className="font-medium">{student.first_name} {student.last_name}</h4>
                    
                    {skipHomeworkStep ? (
                      // Attendance and Feedback UI (second step)
                      <>
                        <FormField
                          control={form.control}
                          name={`students.${index}.attendance`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Attendance</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select attendance status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="attended">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="h-4 w-4 text-green-500" />
                                      <span>Attended</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="missed">
                                    <div className="flex items-center gap-2">
                                      <span className="h-4 w-4 text-red-500">✗</span>
                                      <span>Missed</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <span>Cancelled</span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`students.${index}.feedback`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Feedback (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief feedback for this student..."
                                  className="min-h-[60px]"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      // Homework UI (first step)
                      <FormField
                        control={form.control}
                        name={`students.${index}.homework`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Homework Assignment</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={`Enter homework details for ${lesson.title}...`}
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="gap-1" disabled={loading}>
                  {loading ? (skipHomeworkStep ? 'Completing...' : 'Assigning...') : (
                    <>
                      <Check className="h-4 w-4" />
                      {skipHomeworkStep ? 'Complete Session' : 'Assign & Continue'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center">Loading lesson details...</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompleteSessionDialog;
