import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  availability: z.array(z.number()).min(1, 'Select at least one day'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAdminDialog: React.FC<CreateAdminDialogProps> = ({ isOpen, onClose }) => {
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      startTime: '09:00',
      endTime: '20:00',
      availability: [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsCreating(true);
    try {
      // Create the admin user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: 'jbtutors123!',
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'admin'
          }
        }
      });

      if (signUpError) {
        console.error('Error creating admin account:', signUpError);
        toast({
          title: "Account Creation Error",
          description: "Failed to create admin account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Error",
          description: "User creation failed - no user data returned.",
          variant: "destructive",
        });
        return;
      }

      // Create admin availability records
      const availabilityPromises = data.availability.map(dayOfWeek => 
        supabase.from('admin_availability').insert({
          admin_id: authData.user.id,
          day_of_week: dayOfWeek,
          start_time: data.startTime,
          end_time: data.endTime
        })
      );

      const availabilityResults = await Promise.all(availabilityPromises);
      const availabilityErrors = availabilityResults.filter(result => result.error);

      if (availabilityErrors.length > 0) {
        console.error('Error creating availability:', availabilityErrors);
        toast({
          title: "Availability Error",
          description: "Admin created but failed to set availability. Please update manually.",
          variant: "destructive",
        });
      }

      // Send welcome email
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'admin'
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        toast({
          title: "Email Warning",
          description: "Admin created successfully but welcome email failed to send.",
        });
      } else {
        toast({
          title: "Admin Account Created",
          description: `Admin account for ${data.firstName} ${data.lastName} has been created successfully with availability. A welcome email has been sent.`,
        });
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Admin Account</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Days</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 1, label: 'Mon' },
                      { value: 2, label: 'Tue' },
                      { value: 3, label: 'Wed' },
                      { value: 4, label: 'Thu' },
                      { value: 5, label: 'Fri' },
                      { value: 6, label: 'Sat' },
                      { value: 0, label: 'Sun' },
                    ].map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...(field.value || []), day.value]
                              : field.value?.filter((v) => v !== day.value) || [];
                            field.onChange(newValue);
                          }}
                        />
                        <label className="text-sm">{day.label}</label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Admin'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdminDialog;