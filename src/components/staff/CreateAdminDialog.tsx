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
        password: 'classbeyond123!',
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

  const fieldClass =
    'w-full rounded-full border-2 border-foreground bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-pastel-butter/40';
  const labelClass = 'text-sm font-semibold text-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[92dvh] overflow-y-auto rounded-[var(--radius-soft)] border-2 border-foreground bg-card p-5 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold text-foreground">
            Create Admin Account
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>First Name</FormLabel>
                  <FormControl>
                    <input className={fieldClass} {...field} />
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
                  <FormLabel className={labelClass}>Last Name</FormLabel>
                  <FormControl>
                    <input className={fieldClass} {...field} />
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
                  <FormLabel className={labelClass}>Email</FormLabel>
                  <FormControl>
                    <input type="email" className={fieldClass} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Start Time</FormLabel>
                    <FormControl>
                      <input type="time" className={fieldClass} {...field} />
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
                    <FormLabel className={labelClass}>End Time</FormLabel>
                    <FormControl>
                      <input type="time" className={fieldClass} {...field} />
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
                  <FormLabel className={labelClass}>Available Days</FormLabel>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { value: 1, label: 'Mon' },
                      { value: 2, label: 'Tue' },
                      { value: 3, label: 'Wed' },
                      { value: 4, label: 'Thu' },
                      { value: 5, label: 'Fri' },
                      { value: 6, label: 'Sat' },
                      { value: 0, label: 'Sun' },
                    ].map((day) => {
                      const selected = field.value?.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const newValue = selected
                              ? field.value?.filter((v) => v !== day.value) || []
                              : [...(field.value || []), day.value];
                            field.onChange(newValue);
                          }}
                          className={cn(
                            'rounded-full border-2 border-foreground px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5',
                            selected
                              ? 'bg-pastel-mint text-foreground'
                              : 'bg-background text-foreground'
                          )}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-foreground bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-pastel-sand"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

};

export default CreateAdminDialog;