
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users } from 'lucide-react';

interface AddParentStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  // Parent details
  parentFirstName: z.string().min(2, { message: "Parent's first name must be at least 2 characters." }),
  parentLastName: z.string().min(2, { message: "Parent's last name must be at least 2 characters." }),
  parentEmail: z.string().email({ message: "Invalid email format." }),
  parentPhone: z.string().optional(),
  parentPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  
  // Student details
  studentFirstName: z.string().min(2, { message: "Student's first name must be at least 2 characters." }),
  studentLastName: z.string().min(2, { message: "Student's last name must be at least 2 characters." }),
  studentEmail: z.string().email({ message: "Invalid email format." }).optional().or(z.literal("")),
  yearGroup: z.string().optional(),
  subjects: z.string().optional(),
  
  // Student login option
  createStudentLogin: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_STUDENT_PASSWORD = 'jbtutors123!';

const AddParentStudentForm: React.FC<AddParentStudentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentFirstName: "",
      parentLastName: "",
      parentEmail: "",
      parentPhone: "",
      parentPassword: "",
      studentFirstName: "",
      studentLastName: "",
      studentEmail: "",
      yearGroup: "",
      subjects: "",
      createStudentLogin: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Step 1: Create parent account
      console.log("Creating parent account...");
      const { data: parentAuthData, error: parentAuthError } = await supabase.auth.signUp({
        email: data.parentEmail,
        password: data.parentPassword,
        options: {
          data: {
            first_name: data.parentFirstName,
            last_name: data.parentLastName,
            role: 'parent',
          }
        }
      });

      if (parentAuthError) throw parentAuthError;
      if (!parentAuthData.user) throw new Error("Failed to create parent account");

      console.log("Parent account created, creating parent profile...");

      // Step 2: Create parent profile
      const { data: parentProfile, error: parentProfileError } = await supabase
        .from('parents')
        .insert({
          user_id: parentAuthData.user.id,
          first_name: data.parentFirstName,
          last_name: data.parentLastName,
          email: data.parentEmail,
          phone: data.parentPhone || null,
        })
        .select()
        .single();

      if (parentProfileError) throw parentProfileError;

      console.log("Parent profile created, creating student...");

      // Step 3: Create student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          parent_id: parentProfile.id,
          first_name: data.studentFirstName,
          last_name: data.studentLastName,
          email: data.studentEmail || null,
          grade: data.yearGroup || null,
          subjects: data.subjects || null,
          status: 'active'
        })
        .select()
        .single();

      if (studentError) throw studentError;

      console.log("Student record created");

      // Step 4: Create student login if requested
      if (data.createStudentLogin && data.studentEmail) {
        console.log("Creating student login account...");
        
        const { data: studentAuthData, error: studentAuthError } = await supabase.auth.signUp({
          email: data.studentEmail,
          password: DEFAULT_STUDENT_PASSWORD,
          options: {
            data: {
              first_name: data.studentFirstName,
              last_name: data.studentLastName,
              role: 'student',
            }
          }
        });

        if (studentAuthError) {
          console.error("Student auth creation failed:", studentAuthError);
          toast({
            title: "Partial success",
            description: "Parent and student profiles created, but student login failed: " + studentAuthError.message,
            variant: "destructive"
          });
        } else if (studentAuthData.user) {
          // Link student account to student record
          const { error: linkError } = await supabase
            .from('students')
            .update({ user_id: studentAuthData.user.id })
            .eq('id', studentData.id);

          if (linkError) {
            console.error("Failed to link student account:", linkError);
          }

          console.log("Student login account created and linked");
        }
      }

      toast({
        title: "Family account created successfully!",
        description: data.createStudentLogin 
          ? `Parent account created. Student login: ${data.studentEmail} / ${DEFAULT_STUDENT_PASSWORD}`
          : "Parent account created. Student profile added under parent account.",
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating family account:', error);
      toast({
        title: "Failed to create family account",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Family Account
          </DialogTitle>
          <DialogDescription>
            Create a parent account and add a student in one step. The student will be linked to the parent account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Parent Details Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Parent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="john.smith@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parentPhone"
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

                  <FormField
                    control={form.control}
                    name="parentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input placeholder="••••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Student Details Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Student Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="jane.smith@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Group</FormLabel>
                        <FormControl>
                          <Input placeholder="Year 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Math, Physics, Chemistry" className="min-h-[60px]" {...field} />
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
                          Student will get login credentials (default password: <strong>{DEFAULT_STUDENT_PASSWORD}</strong>) to access the same family account data.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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
                {loading ? "Creating..." : "Create Family Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParentStudentForm;
