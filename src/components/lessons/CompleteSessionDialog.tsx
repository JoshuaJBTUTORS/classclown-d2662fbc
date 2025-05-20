
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { Check, UserCheck, UserX, Calendar, Book } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
}

// Define the form schema for homework and feedback
const formSchema = z.object({
  homeworkTitle: z.string().min(2, { message: "Homework title must be at least 2 characters." }),
  homeworkDescription: z.string().optional(),
  students: z.array(
    z.object({
      id: z.number(),
      first_name: z.string(),
      last_name: z.string(),
      attendance: z.enum(['attended', 'missed', 'cancelled']),
      feedback: z.string().optional(),
    })
  ),
});

type FormData = z.infer<typeof formSchema>;

const CompleteSessionDialog: React.FC<CompleteSessionDialogProps> = ({ 
  lessonId, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      homeworkTitle: '',
      homeworkDescription: '',
      students: [],
    },
  });

  // Fetch lesson details when dialog opens
  useEffect(() => {
    if (isOpen && lessonId) {
      fetchLessonDetails(lessonId);
    }
  }, [isOpen, lessonId]);

  // Initialize form values when lesson data is loaded
  useEffect(() => {
    if (lesson && lesson.students) {
      const studentData = lesson.students.map(student => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        attendance: student.attendance_status as 'attended' | 'missed' | 'cancelled' || 'attended',
        feedback: '',
      }));

      form.reset({
        homeworkTitle: '',
        homeworkDescription: '',
        students: studentData,
      });
    }
  }, [lesson, form]);

  const fetchLessonDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          tutor:tutors(id, first_name, last_name),
          lesson_students(
            student:students(id, first_name, last_name),
            attendance_status
          )
        `)
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;

      // Transform the data to match our Lesson interface
      const students = lessonData.lesson_students.map((ls: any) => ({
        id: ls.student.id,
        first_name: ls.student.first_name,
        last_name: ls.student.last_name,
        attendance_status: ls.attendance_status || 'pending'
      }));

      const transformedLesson: Lesson = {
        ...lessonData,
        students,
        // Remove the original nested structure from our state
        // We don't actually have lesson_students in our Lesson interface
      };

      setLesson(transformedLesson);
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
      // 1. Update the lesson status to completed
      const { error: lessonError } = await supabase
        .from('lessons')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString()
        })
        .eq('id', lessonId);
      
      if (lessonError) throw lessonError;

      // 2. Create homework for the lesson
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework')
        .insert({
          title: data.homeworkTitle,
          description: data.homeworkDescription || null,
          lesson_id: lessonId,
          due_date: null, // You can modify this to add a due date option
        })
        .select()
        .single();
      
      if (homeworkError) throw homeworkError;

      // 3. Update attendance status and feedback for all students
      const attendanceUpdates = data.students.map(async (student) => {
        const { error } = await supabase
          .from('lesson_students')
          .update({ 
            attendance_status: student.attendance 
          })
          .eq('lesson_id', lessonId)
          .eq('student_id', student.id);
        
        if (error) throw error;

        // Save feedback if provided
        if (student.feedback) {
          // In a real app, you might want to store feedback in a separate table
          // For simplicity, we'll just use console.log here
          console.log(`Feedback for student ${student.id}: ${student.feedback}`);
        }
      });

      await Promise.all(attendanceUpdates);

      toast.success('Session completed successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) {
    return null; // Or a loading state
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> 
            Complete Session: {lesson.title}
          </DialogTitle>
          <DialogDescription>
            {format(parseISO(lesson.start_time), 'MMMM d, yyyy • h:mm a')} - 
            {format(parseISO(lesson.end_time), 'h:mm a')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Homework Assignment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Assign Homework</h3>
              </div>
              <Separator />
              
              <FormField
                control={form.control}
                name="homeworkTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Homework Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Practice Problems Chapter 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="homeworkDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed homework instructions..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Student Attendance and Feedback Section */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Student Attendance & Feedback</h3>
              </div>
              <Separator />
              
              {form.getValues().students.map((student, index) => (
                <div key={student.id} className="p-4 border rounded-md space-y-3">
                  <h4 className="font-medium">{student.first_name} {student.last_name}</h4>
                  
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
                                <UserX className="h-4 w-4 text-red-500" />
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
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="gap-1" disabled={loading}>
                {loading ? 'Completing...' : (
                  <>
                    <Check className="h-4 w-4" />
                    Complete Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteSessionDialog;
