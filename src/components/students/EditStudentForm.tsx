
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';
import { ScribbleStroke } from '@/components/lessonPlans/ScribbleStroke';
import { getPastelTone } from '@/components/lessonPlans/pastelPalette';
import { cn } from '@/lib/utils';

interface EditStudentFormProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
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
  studentId: z.string().optional(),
  subjects: z.string().min(2, {
    message: "Subjects must be at least 2 characters.",
  }),
  status: z.enum(['active', 'inactive', 'trial', 'stopped']),
});

const EditStudentForm: React.FC<EditStudentFormProps> = ({ student, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  // Convert subjects array to string if needed
  const subjectsString = Array.isArray(student?.subjects) 
    ? student.subjects.join(', ') 
    : student?.subjects || '';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: student?.first_name || "",
      lastName: student?.last_name || "",
      email: student?.email || "",
      studentId: student?.student_id || "",
      subjects: subjectsString,
      status: (student?.status === 'active' || student?.status === 'inactive' || student?.status === 'trial' || student?.status === 'stopped'
              ? student.status 
              : "active") as 'active' | 'inactive' | 'trial' | 'stopped',
    },
  });

  useEffect(() => {
    if (student) {
      // Convert subjects array to string if needed
      const subjectsValue = Array.isArray(student.subjects) 
        ? student.subjects.join(', ') 
        : student.subjects || '';

      form.reset({
        firstName: student.first_name || "",
        lastName: student.last_name || "",
        email: student.email || "",
        studentId: student.student_id || "",
        subjects: subjectsValue,
        status: (student.status === 'active' || student.status === 'inactive' || student.status === 'trial' || student.status === 'stopped'
                ? student.status 
                : "active") as 'active' | 'inactive' | 'trial' | 'stopped',
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
        student_id: values.studentId,
        subjects: subjectsString,
        status: values.status
      };

      // Fix: Ensure we're using the correct type for the ID when used as a number
      const studentId = typeof student.id === 'string' ? parseInt(student.id, 10) : student.id;

      const { data, error } = await supabase
        .from('students')
        .update(updatedStudentData)
        .eq('id', studentId)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        // Prepare the updated student object with consistent types
        const updatedStudent: Student = {
          id: data[0].id,
          name: `${data[0].first_name} ${data[0].last_name}`,
          email: data[0].email || '',
          phone: data[0].phone || '',
          subjects: data[0].subjects || '',
          status: data[0].status as 'active' | 'inactive' | 'trial' | 'stopped' || 'active',
          joinedDate: new Date(data[0].created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          first_name: data[0].first_name || '',
          last_name: data[0].last_name || '',
          student_id: data[0].student_id,
          created_at: data[0].created_at,
          parent_id: data[0].parent_id || student.parent_id,
          user_id: data[0].user_id
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

  const fullName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
  const tone = getPastelTone(fullName || String(student?.id || 'student'));

  const inputClasses =
    'h-11 rounded-xl border-none bg-muted/60 shadow-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden rounded-[var(--radius-soft)] border-none p-0 shadow-[var(--shadow-soft-lg)]">
        {/* Pastel hero band */}
        <div className={cn('relative overflow-hidden p-6 pb-5', tone.bg)}>
          <ScribbleStroke className="pointer-events-none absolute -top-4 right-0 w-[55%] text-background" />
          <div className="relative">
            <DialogTitle className={cn('font-heading text-3xl font-extrabold leading-tight tracking-tight', tone.text)}>
              Edit Student
            </DialogTitle>
            <DialogDescription className={cn('mt-1 text-sm opacity-70', tone.text)}>
              Update {fullName || 'this student'}&apos;s details below.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 pt-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First Name" className={inputClasses} {...field} />
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
                    <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last Name" className={inputClasses} {...field} />
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
                  <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email" className={inputClasses} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Student ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Student ID" className={inputClasses} {...field} />
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
                  <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Subjects</FormLabel>
                  <FormControl>
                    <Input placeholder="Subjects (comma-separated)" className={inputClasses} {...field} />
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
                  <FormLabel className="font-heading text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-11 rounded-xl border-none bg-muted/60 shadow-none focus:ring-2 focus:ring-ring">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="stopped">Stopped</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-full border-none bg-muted/60 shadow-none hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-soft-lg)]"
              >
                {loading ? "Updating..." : "Update Student"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentForm;
