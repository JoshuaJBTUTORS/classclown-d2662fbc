
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { UserPlus, Users, Plus, Trash2 } from 'lucide-react';

interface AddParentStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const studentSchema = z.object({
  firstName: z.string().min(2, { message: "Student's first name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Student's last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }).optional().or(z.literal("")),
  yearGroup: z.string().optional(),
  subjects: z.string().optional(),
  createStudentLogin: z.boolean().default(false),
});

const formSchema = z.object({
  // Parent details
  parentFirstName: z.string().min(2, { message: "Parent's first name must be at least 2 characters." }),
  parentLastName: z.string().min(2, { message: "Parent's last name must be at least 2 characters." }),
  parentEmail: z.string().email({ message: "Invalid email format." }),
  parentPhone: z.string().optional(),
  parentPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  
  // Students array
  students: z.array(studentSchema).min(1, { message: "At least one student is required." }).max(6, { message: "Maximum 6 students allowed." }),
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
      students: [{
        firstName: "",
        lastName: "",
        email: "",
        yearGroup: "",
        subjects: "",
        createStudentLogin: false,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
  });

  const addStudent = () => {
    if (fields.length < 6) {
      append({
        firstName: "",
        lastName: "",
        email: "",
        yearGroup: "",
        subjects: "",
        createStudentLogin: false,
      });
    }
  };

  const removeStudent = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

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

      console.log("Parent profile created, creating students...");

      // Step 3: Create all student records
      const studentResults = [];
      const studentLoginResults = [];

      for (let i = 0; i < data.students.length; i++) {
        const student = data.students[i];
        
        console.log(`Creating student ${i + 1}: ${student.firstName} ${student.lastName}`);

        // Create student record with corrected column mapping
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert({
            parent_id: parentProfile.id,
            first_name: student.firstName,
            last_name: student.lastName,
            email: student.email || null,
            subjects: student.subjects || null,
            status: 'active'
          })
          .select()
          .single();

        if (studentError) {
          console.error(`Error creating student ${i + 1}:`, studentError);
          throw new Error(`Failed to create student ${student.firstName} ${student.lastName}: ${studentError.message}`);
        }

        studentResults.push(studentData);

        // Step 4: Create student login if requested
        if (student.createStudentLogin && student.email) {
          console.log(`Creating login for student ${i + 1}...`);
          
          try {
            const { data: studentAuthData, error: studentAuthError } = await supabase.auth.signUp({
              email: student.email,
              password: DEFAULT_STUDENT_PASSWORD,
              options: {
                data: {
                  first_name: student.firstName,
                  last_name: student.lastName,
                  role: 'student',
                }
              }
            });

            if (studentAuthError) {
              console.error(`Student ${i + 1} auth creation failed:`, studentAuthError);
              studentLoginResults.push({ student: `${student.firstName} ${student.lastName}`, error: studentAuthError.message });
            } else if (studentAuthData.user) {
              // Link student account to student record
              const { error: linkError } = await supabase
                .from('students')
                .update({ user_id: studentAuthData.user.id })
                .eq('id', studentData.id);

              if (linkError) {
                console.error(`Failed to link student ${i + 1} account:`, linkError);
                studentLoginResults.push({ student: `${student.firstName} ${student.lastName}`, error: `Failed to link account: ${linkError.message}` });
              } else {
                studentLoginResults.push({ student: `${student.firstName} ${student.lastName}`, success: true });
                console.log(`Student ${i + 1} login account created and linked`);
              }
            }
          } catch (error: any) {
            console.error(`Error creating login for student ${i + 1}:`, error);
            studentLoginResults.push({ student: `${student.firstName} ${student.lastName}`, error: error.message });
          }
        }
      }

      // Prepare success message
      const studentNames = studentResults.map(s => `${s.first_name} ${s.last_name}`).join(', ');
      const loginCount = studentLoginResults.filter(r => r.success).length;
      const loginErrors = studentLoginResults.filter(r => r.error);

      let successMessage = `Family account created successfully! Parent account for ${data.parentFirstName} ${data.parentLastName} and ${studentResults.length} student(s): ${studentNames}.`;
      
      if (loginCount > 0) {
        successMessage += ` ${loginCount} student login(s) created with default password: ${DEFAULT_STUDENT_PASSWORD}`;
      }

      if (loginErrors.length > 0) {
        successMessage += ` Note: Some student logins failed - ${loginErrors.map(e => `${e.student}: ${e.error}`).join('; ')}`;
      }

      toast({
        title: "Family account created successfully!",
        description: successMessage,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Family Account
          </DialogTitle>
          <DialogDescription>
            Create a parent account and add multiple students in one step. Students will be linked to the parent account.
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

            {/* Students Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Students ({fields.length})</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStudent}
                    disabled={fields.length >= 6}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="relative border-l-4 border-l-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md">Student {index + 1}</CardTitle>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStudent(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`students.${index}.firstName`}
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
                          name={`students.${index}.lastName`}
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
                          name={`students.${index}.email`}
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
                          name={`students.${index}.yearGroup`}
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
                        name={`students.${index}.subjects`}
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
                        name={`students.${index}.createStudentLogin`}
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
                ))}
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
                {loading ? "Creating..." : `Create Family Account (${fields.length} student${fields.length !== 1 ? 's' : ''})`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParentStudentForm;
