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

const topicRequestSchema = z.object({
  subject: z.string().min(1, 'Please select a subject'),
  requestedTopic: z.string().min(1, 'Please describe the topic you want to learn'),
});

type TopicRequestForm = z.infer<typeof topicRequestSchema>;

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
  
  const isAdmin = userRole === 'admin' || userRole === 'owner';
  const isParent = userRole === 'parent';
  const isStudent = userRole === 'student';

  const form = useForm<TopicRequestForm>({
    resolver: zodResolver(topicRequestSchema),
    defaultValues: {
      subject: '',
      requestedTopic: '',
    },
  });

  const onSubmit = async (data: TopicRequestForm) => {
    if (!user) {
      toast.error('You must be logged in to request a topic');
      return;
    }

    setIsSubmitting(true);

    try {
      let parentId = null;

      // If user is a parent, get their parent ID for tracking
      if (isParent) {
        const { data: parentData } = await supabase
          .from('parents')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        parentId = parentData?.id;
      } else if (isStudent) {
        // For students, get parent_id from their student record
        const { data: studentData } = await supabase
          .from('students')
          .select('parent_id')
          .eq('email', user.email)
          .single();
        
        parentId = studentData?.parent_id;
      }

      const { error } = await supabase
        .from('topic_requests')
        .insert({
          student_id: null, // No longer requiring student selection
          parent_id: parentId,
          requested_topic: `${data.subject}: ${data.requestedTopic}`,
          status: 'pending',
          lesson_id: '00000000-0000-0000-0000-000000000000' // Placeholder UUID
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
            {isAdmin 
              ? "Create a topic request on behalf of a student. Specify the topic they need help with."
              : isParent
              ? "Request a specific topic for your child. Describe what topic you'd like them to learn."
              : "Request a specific topic you'd like to cover in your lessons. Admins will review and approve your request."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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