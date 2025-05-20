
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { supabase } from '@/integrations/supabase/client';

interface EditStudentFormProps {
  student: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: any) => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  parentFirstName: z.string().min(2, {
    message: "Parent's first name must be at least 2 characters.",
  }),
  parentLastName: z.string().min(2, {
    message: "Parent's last name must be at least 2 characters.",
  }),
  studentId: z.string().optional(),
  subjects: z.string().min(2, {
    message: "Subjects must be at least 2 characters.",
  }),
  status: z.enum(['active', 'inactive']),
});

const EditStudentForm: React.FC<EditStudentFormProps> = ({ student, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: student?.first_name || "",
      lastName: student?.last_name || "",
      email: student?.email || "",
      parentFirstName: student?.parent_first_name || "",
      parentLastName: student?.parent_last_name || "",
      studentId: student?.student_id || "",
      subjects: student?.subjects?.join(', ') || "",
      status: student?.status || "active",
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        firstName: student.first_name || "",
        lastName: student.last_name || "",
        email: student.email || "",
        parentFirstName: student.parent_first_name || "",
        parentLastName: student.parent_last_name || "",
        studentId: student.student_id || "",
        subjects: student.subjects?.join(', ') || "",
        status: student.status || "active",
      });
    }
  }, [student, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const subjectsString = values.subjects
        .split(',')
        .map((subject: string) => subject.trim())
        .filter((subject: string) => subject !== '')
        .join(',');

      const updatedStudentData = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        parent_first_name: values.parentFirstName,
        parent_last_name: values.parentLastName,
        student_id: values.studentId,
        subjects: subjectsString,
        status: values.status,
      };

      const { data, error } = await supabase
        .from('students')
        .update(updatedStudentData)
        .eq('id', student.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        const updatedStudent = {
          id: String(data[0].id),
          name: `${data[0].first_name} ${data[0].last_name}`,
          email: data[0].email || '',
          phone: data[0].phone || '',
          subjects: data[0].subjects ? data[0].subjects.split(',').map((subject: string) => subject.trim()) : [],
          status: data[0].status || 'active',
          joinedDate: new Date(data[0].created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          first_name: data[0].first_name || '',
          last_name: data[0].last_name || '',
          parent_first_name: data[0].parent_first_name || '',
          parent_last_name: data[0].parent_last_name || '',
          student_id: data[0].student_id
        };
        onUpdate(updatedStudent);
        toast.success("Student details updated successfully");
        onClose();
      } else {
        throw new Error("Failed to update student details");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update student details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Student Details</DialogTitle>
          <DialogDescription>
            Update the student's information as needed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent's First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent's Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Student ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects</FormLabel>
                  <FormControl>
                    <Input placeholder="Subjects (comma-separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Input placeholder="Status" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentForm;
