
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subjects: string[];
  parent_first_name: string;
  parent_last_name: string;
  student_id?: string;
  status: 'active' | 'inactive';
}

// Define form schema
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  parentFirstName: z.string().min(1, "Parent's first name is required"),
  parentLastName: z.string().min(1, "Parent's last name is required"),
  studentId: z.string().optional(),
  subjects: z.string().min(1, "At least one subject is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditStudentFormProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
}

const EditStudentForm: React.FC<EditStudentFormProps> = ({ student, isOpen, onClose, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: student ? {
      firstName: student.first_name,
      lastName: student.last_name,
      email: student.email,
      phone: student.phone || '',
      parentFirstName: student.parent_first_name,
      parentLastName: student.parent_last_name,
      studentId: student.student_id || '',
      subjects: student.subjects.join(', '),
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      parentFirstName: '',
      parentLastName: '',
      studentId: '',
      subjects: '',
    },
  });
  
  // Reset form when student changes
  React.useEffect(() => {
    if (student) {
      form.reset({
        firstName: student.first_name,
        lastName: student.last_name,
        email: student.email,
        phone: student.phone || '',
        parentFirstName: student.parent_first_name,
        parentLastName: student.parent_last_name,
        studentId: student.student_id || '',
        subjects: student.subjects.join(', '),
      });
    }
  }, [student, form]);
  
  if (!student) return null;
  
  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert comma-separated subjects to string
      const subjectsString = data.subjects
        .split(',')
        .map(subject => subject.trim())
        .filter(subject => subject !== '')
        .join(',');
        
      const updatedStudent = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        parent_first_name: data.parentFirstName,
        parent_last_name: data.parentLastName,
        student_id: data.studentId || null,
        subjects: subjectsString,
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from('students')
        .update(updatedStudent)
        .eq('id', student.id);
        
      if (error) throw error;
      
      // Create the updated student object for the UI
      const updatedStudentForUI = {
        ...student,
        first_name: data.firstName,
        last_name: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone || '',
        parent_first_name: data.parentFirstName,
        parent_last_name: data.parentLastName,
        student_id: data.studentId || '',
        subjects: data.subjects.split(',').map(subject => subject.trim()).filter(subject => subject !== ''),
      };
      
      onUpdate(updatedStudentForUI);
      onClose();
      
      toast({
        title: "Success",
        description: "Student information has been updated",
      });
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update {student.name}'s information below
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
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
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
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
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="student@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
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
                    <FormLabel>Parent's First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent first name" {...field} />
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
                    <FormLabel>Parent's Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Parent last name" {...field} />
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
                  <FormLabel>Student ID (Optional)</FormLabel>
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
                  <FormLabel>Subjects *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Mathematics, Physics, Chemistry (comma separated)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Student
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentForm;
