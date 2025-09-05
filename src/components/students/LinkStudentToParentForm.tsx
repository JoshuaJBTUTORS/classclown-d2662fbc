import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Student } from '@/types/student';
import { Parent } from '@/types/parent';

interface LinkStudentToParentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  parentId: z.string().min(1, "Please select a parent"),
});

type FormData = z.infer<typeof formSchema>;

const LinkStudentToParentForm: React.FC<LinkStudentToParentFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [standaloneStudents, setStandaloneStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      parentId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchStandaloneStudents();
      fetchParents();
    }
  }, [isOpen]);

  const fetchStandaloneStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, email, status, parent_id')
        .is('parent_id', null)
        .order('last_name', { ascending: true });

      if (error) throw error;
      setStandaloneStudents(data || []);
    } catch (error) {
      console.error('Error fetching standalone students:', error);
      toast.error('Failed to load standalone students');
    }
  };

  const fetchParents = async () => {
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('id, first_name, last_name, email, user_id')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParents(data || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error('Failed to load parents');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Update the student's parent_id
      const { error } = await supabase
        .from('students')
        .update({ parent_id: data.parentId })
        .eq('id', parseInt(data.studentId));

      if (error) throw error;

      toast.success('Student successfully linked to parent');
      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error linking student to parent:', error);
      toast.error('Failed to link student to parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Existing Student to Parent</DialogTitle>
          <DialogDescription>
            Select a standalone student and link them to an existing parent account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a standalone student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {standaloneStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.first_name} {student.last_name} ({student.email})
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
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Parent</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a parent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.first_name} {parent.last_name} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Linking...' : 'Link Student'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkStudentToParentForm;