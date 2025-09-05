import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { checkParentEmailUniqueness } from '@/services/uniquenessValidationService';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

interface AddParentOnlyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  billing_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddParentOnlyForm: React.FC<AddParentOnlyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      billing_address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Step 1: Check parent email uniqueness (allows same email as students)
      console.log("Checking parent email uniqueness...");
      const uniquenessResult = await checkParentEmailUniqueness(data.email, data.phone);
      
      if (!uniquenessResult.isUnique) {
        const errorMessage = `Parent account already exists: ${uniquenessResult.existingParents.map(r => `${r.first_name} ${r.last_name} (${r.email})`).join(', ')}`;
        toast.error(errorMessage);
        return;
      }

      // Log if there are matching trial students
      if (uniquenessResult.matchingTrialStudents && uniquenessResult.matchingTrialStudents.length > 0) {
        console.log("Found matching trial students:", uniquenessResult.matchingTrialStudents);
      }

      // Step 2: Create parent account
      console.log("Creating parent account...");
      const { data: parentAuthData, error: parentAuthError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            role: 'parent',
          }
        }
      });

      if (parentAuthError) throw parentAuthError;
      if (!parentAuthData.user) throw new Error("Failed to create parent account");

      console.log("Parent account created, creating parent profile...");

      // Step 3: Create parent profile
      const { data: parentProfile, error: parentProfileError } = await supabase
        .from('parents')
        .insert({
          user_id: parentAuthData.user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          billing_address: data.billing_address || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
        })
        .select()
        .single();

      if (parentProfileError) throw parentProfileError;

      // Step 4: Link any matching trial students to this parent
      if (uniquenessResult.matchingTrialStudents && uniquenessResult.matchingTrialStudents.length > 0) {
        console.log("Linking trial students to parent...");
        const { error: linkError } = await supabase
          .from('students')  
          .update({ parent_id: parentProfile.id })
          .eq('email', data.email.toLowerCase())
          .in('status', ['trial', 'active']);

        if (linkError) {
          console.error('Error linking trial students:', linkError);
          // Don't throw error, just log it - parent account was still created successfully
        } else {
          console.log(`Successfully linked ${uniquenessResult.matchingTrialStudents.length} trial student(s) to parent`);
        }
      }

      const successMessage = `Parent account created successfully for ${data.first_name} ${data.last_name}. They can now log in and manage their account.`;

      toast.success(successMessage);

      // Reset form
      form.reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating parent account:', error);
      toast.error(error.message || 'Failed to create parent account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Parent Only Account
          </DialogTitle>
          <DialogDescription>
            Create a standalone parent account without any students. Students can be added later.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    name="first_name"
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
                    name="last_name"
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
                  name="email"
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

                  <FormField
                    control={form.control}
                    name="password"
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

                <FormField
                  control={form.control}
                  name="billing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter billing address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergency_contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergency_contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                {loading ? "Creating Account..." : "Create Parent Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParentOnlyForm;