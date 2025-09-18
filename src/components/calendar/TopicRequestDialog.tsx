import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentData } from '@/hooks/useStudentData';

const baseTopicRequestSchema = z.object({
  subject: z.string().min(1, 'Please select a subject'),
  requestedTopic: z.string().min(1, 'Please describe the topic you want to learn'),
});

const adminTopicRequestSchema = baseTopicRequestSchema.extend({
  studentId: z.string().min(1, 'Please select a student'),
});

type TopicRequestForm = z.infer<typeof baseTopicRequestSchema>;
type AdminTopicRequestForm = z.infer<typeof adminTopicRequestSchema>;

interface TopicRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Available subjects from the database
const SUBJECTS = [
  '11 Plus English', '11 Plus Maths', '11 Plus NVR', '11 Plus VR',
  'A-level Biology', 'A-level Chemistry', 'A-level Computer Science', 'A-level Maths', 'A-level Physics',
  'Early KS2 English', 'Early KS2 Maths',
  'GCSE Biology', 'GCSE Business', 'GCSE Chemistry', 'GCSE Combined Science', 'GCSE Computer Science', 'GCSE English', 'GCSE Maths', 'GCSE Physics',
  'KS2 English', 'KS2 Maths',
  'KS3 English', 'KS3 Maths', 'KS3 Science',
  'Sats English', 'Sats Maths',
  'Year 11 Biology', 'Year 11 Chemistry', 'Year 11 Combined Science', 'Year 11 English', 'Year 11 Maths Foundation', 'Year 11 Physics'
];

export const TopicRequestDialog: React.FC<TopicRequestDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, userRole } = useAuth();
  const { students, isLoading: studentsLoading } = useStudentData();
  
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';
  const schema = isAdminOrOwner ? adminTopicRequestSchema : baseTopicRequestSchema;

  const form = useForm<AdminTopicRequestForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: '',
      requestedTopic: '',
      ...(isAdminOrOwner && { studentId: '' }),
    },
  });

  const onSubmit = async (data: AdminTopicRequestForm) => {
    if (!user) {
      toast.error('You must be logged in to request a topic');
      return;
    }

    setIsSubmitting(true);

    try {
      let studentId = null;
      let parentId = null;

      if (isAdminOrOwner) {
        // Admin/Owner creating request on behalf of a student
        studentId = parseInt(data.studentId!);
        
        // Get the parent_id for the selected student
        const { data: studentData } = await supabase
          .from('students')
          .select('parent_id')
          .eq('id', studentId)
          .single();
        
        parentId = studentData?.parent_id;
      } else if (userRole === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', user.email)
          .single();
        
        studentId = studentData?.id;
      } else if (userRole === 'parent') {
        const { data: parentData } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        parentId = parentData?.id;
      }

      const { error } = await supabase
        .from('topic_requests')
        .insert({
          student_id: studentId,
          parent_id: parentId,
          requested_topic: `${data.subject}: ${data.requestedTopic}`,
          status: 'pending',
          lesson_id: '00000000-0000-0000-0000-000000000000'
        });

      if (error) throw error;

      toast.success('Topic request submitted successfully! Admins will review your request.');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting topic request:', error);
      toast.error('Failed to submit topic request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Request a Topic
          </DialogTitle>
          <DialogDescription>
            {isAdminOrOwner 
              ? 'Create a topic request on behalf of a student. Select the student and describe the topic they need help with.'
              : 'Request a specific topic you\'d like to cover in your lessons. Admins will review and approve your request.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isAdminOrOwner && (
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={studentsLoading ? "Loading students..." : "Select a student"} 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name}
                            {student.grade && ` (${student.grade})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
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
              name="requestedTopic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the specific topic or concept you'd like to learn about..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};