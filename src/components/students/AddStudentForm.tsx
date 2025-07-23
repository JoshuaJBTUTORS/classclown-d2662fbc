import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  first_name: z.string().min(2, { message: "Student's first name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Student's last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  grade: z.string().optional(),
  subjects: z.string().optional(),
  parent_id: z.string().optional(),
  createStudentLogin: z.boolean().default(false),
  studentPassword: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_STUDENT_PASSWORD = 'jbtutors123!';

const AddStudentForm: React.FC<AddStudentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      grade: "",
      subjects: "",
      parent_id: "",
      createStudentLogin: false,
      studentPassword: DEFAULT_STUDENT_PASSWORD,
    },
  });

  // Fetch parents when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchParents();
    }
  }, [isOpen]);

  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParents(data || []);
    } catch (error: any) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Create student record
      const studentData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        grade: data.grade || null,
        subjects: data.subjects || null,
        parent_id: data.parent_id || null,
        status: 'active'
      };

      const { data: createdStudent, error: studentError } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

      if (studentError) throw studentError;

      // Create student login if requested
      if (data.createStudentLogin && data.email) {
        try {
          const { data: studentAuthData, error: studentAuthError } = await supabase.auth.signUp({
            email: data.email,
            password: data.studentPassword || DEFAULT_STUDENT_PASSWORD,
            options: {
              data: {
                first_name: data.first_name,
                last_name: data.last_name,
                role: 'student',
              }
            }
          });

          if (studentAuthError) {
            console.error('Student auth creation failed:', studentAuthError);
            toast.error("Student created but login failed: " + studentAuthError.message);
          } else if (studentAuthData.user) {
            // Link student account to student record
            const { error: linkError } = await supabase
              .from('students')
              .update({ user_id: studentAuthData.user.id })
              .eq('id', createdStudent.id);

            if (linkError) {
              console.error('Failed to link student account:', linkError);
              toast.error("Student created but linking failed: The student was created but the login account could not be linked.");
            } else {
              toast.success(`Student created successfully! Student account created with login credentials. Default password: ${data.studentPassword || DEFAULT_STUDENT_PASSWORD}`);
            }
          }
        } catch (error: any) {
          console.error('Error creating student login:', error);
          toast.error("Student created but login failed: " + error.message);
        }
      } else {
        toast.success("Student created successfully! The student has been added to the system.");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error("Failed to create student: " + (error.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a new student account. You can optionally link them to an existing parent.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parent_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent or leave empty for standalone student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Standalone Student (No Parent)</SelectItem>
                      {loadingParents ? (
                        <SelectItem value="" disabled>Loading parents...</SelectItem>
                      ) : (
                        parents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.first_name} {parent.last_name} ({parent.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
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
                name="last_name"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="student@example.com" type="email" {...field} />
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
                      <Input placeholder="123-456-7890" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/Year Group</FormLabel>
                  <FormControl>
                    <Input placeholder="Year 10" {...field} />
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
                    <Textarea placeholder="Math, Physics, Chemistry (comma separated)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="createStudentLogin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create student login account
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Student will get login credentials to access the system.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('createStudentLogin') && (
              <FormField
                control={form.control}
                name="studentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter password" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {loading ? "Creating..." : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentForm;
