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
import { Mail } from 'lucide-react';

interface AddStudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }).optional(),
  phone: z.string().optional(),
  parentFirstName: z.string().optional(),
  parentLastName: z.string().optional(),
  subjects: z.string().optional(),
  sendInvite: z.boolean().default(false),
  createAccount: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_PASSWORD = 'jbtutors123!';

const AddStudentForm: React.FC<AddStudentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      parentFirstName: "",
      parentLastName: "",
      subjects: "",
      sendInvite: false,
      createAccount: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      if ((data.sendInvite || data.createAccount) && !data.email) {
        throw new Error("Email is required when sending an invitation or creating an account");
      }

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          parent_first_name: data.parentFirstName || null,
          parent_last_name: data.parentLastName || null,
          subjects: data.subjects || null,
          status: 'active'
        })
        .select()
        .single();

      if (studentError) throw studentError;

      if (data.sendInvite && data.email) {
        const { error: inviteError } = await supabase.functions.invoke('send-student-invite', {
          body: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            studentId: studentData.id.toString()
          }
        });

        if (inviteError) {
          toast({
            title: "Student created successfully",
            description: "However, there was an issue sending the invitation email."
          });
        } else {
          toast({
            title: "Student created successfully",
            description: "An invitation email has been sent to the student."
          });
        }
      } else if (data.createAccount && data.email) {
        // Create user account with default password
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: DEFAULT_PASSWORD,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              role: 'student',
            }
          }
        });

        if (signUpError) {
          toast({
            title: "Student created successfully",
            description: "However, there was an issue creating their account: " + signUpError.message,
            variant: "destructive"
          });
        } else if (authData.user) {
          // Send welcome email
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              userId: authData.user.id,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: 'student',
              password: DEFAULT_PASSWORD
            }
          });

          if (emailError) {
            console.error('Error sending welcome email:', emailError);
            toast({
              title: "Student account created successfully",
              description: `Account created with default password: ${DEFAULT_PASSWORD}. However, there was an issue sending the welcome email.`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Student account created successfully",
              description: "Account created and welcome email sent with login credentials.",
            });
          }
        }
      } else {
        toast({
          title: "Student created successfully",
          description: "The student has been added to the system."
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: "Failed to create student",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter the student's details below to add them to the system.
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
                      <Input placeholder="Jane" {...field} />
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
                      <Input placeholder="Smith" {...field} />
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
                  <FormLabel>Email {(form.watch("sendInvite") || form.watch("createAccount")) && "(Required)"}</FormLabel>
                  <FormControl>
                    <Input placeholder="jane.smith@example.com" type="email" {...field} />
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
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="123-456-7890" type="tel" {...field} />
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
                    <FormLabel>Parent First Name (Optional)</FormLabel>
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
                    <FormLabel>Parent Last Name (Optional)</FormLabel>
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
              name="subjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Math, Physics, Chemistry" className="min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="createAccount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("sendInvite", false);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Create account immediately
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        The student account will be created with the default password: <strong>{DEFAULT_PASSWORD}</strong>
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sendInvite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("createAccount", false);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send invitation email
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        The student will receive an email with instructions to create an account.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? "Creating..." : form.watch("createAccount") ? (
                  <>
                    Create Student & Account
                  </>
                ) : form.watch("sendInvite") ? (
                  <>
                    <Mail className="h-4 w-4" />
                    Create & Invite Student
                  </>
                ) : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentForm;
