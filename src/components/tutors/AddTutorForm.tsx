import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Clock, Plus, X } from 'lucide-react';

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
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AvailabilitySlot } from '@/types/tutor';
import SubjectSelector from './SubjectSelector';

interface AddTutorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  title: z.string().optional(),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  subjectIds: z.array(z.string()).default([]),
  bio: z.string().optional(),
  education: z.string().optional(),
  normal_hourly_rate: z.number().min(0, { message: "Hourly rate must be positive." }),
  absence_hourly_rate: z.number().min(0, { message: "Absence rate must be positive." }),
  createAccount: z.boolean().default(false),
  sendInvite: z.boolean().default(false),
  availability: z.array(z.object({
    id: z.string(),
    day_of_week: z.string(),
    start_time: z.string(),
    end_time: z.string()
  })).default([])
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_PASSWORD = 'jbtutors123!';

const AddTutorForm: React.FC<AddTutorFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subjectIds: [],
      bio: "",
      education: "",
      normal_hourly_rate: 25.00,
      absence_hourly_rate: 12.50,
      createAccount: false,
      sendInvite: false,
      availability: []
    },
  });

  // Functions for availability management
  const addAvailabilitySlot = () => {
    const newSlot: AvailabilitySlot = {
      id: uuidv4(),
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '17:00'
    };
    
    setAvailabilitySlots([...availabilitySlots, newSlot]);
    form.setValue('availability', [...availabilitySlots, newSlot]);
  };

  const removeAvailabilitySlot = (id: string) => {
    const updatedSlots = availabilitySlots.filter(slot => slot.id !== id);
    setAvailabilitySlots(updatedSlots);
    form.setValue('availability', updatedSlots);
  };

  const updateAvailabilitySlot = (id: string, field: keyof AvailabilitySlot, value: string) => {
    const updatedSlots = availabilitySlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );
    setAvailabilitySlots(updatedSlots);
    form.setValue('availability', updatedSlots);
  };

  // Improved function to create profile and role with enhanced error handling
  const createProfileAndRole = async (userId: string, firstName: string, lastName: string) => {
    try {
      console.log('Starting manual profile and role creation for user:', userId);
      
      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileCheckError) {
        console.error('Error checking existing profile:', profileCheckError);
      }
        
      // Create profile if it doesn't exist
      if (!existingProfile) {
        console.log('Profile does not exist, creating new profile');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            first_name: firstName,
            last_name: lastName
          });
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          return false;
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists, skipping creation');
      }
      
      // Check if role exists
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'tutor')
        .maybeSingle();
        
      if (roleCheckError) {
        console.error('Error checking existing role:', roleCheckError);
      }
        
      // Create role if it doesn't exist
      if (!existingRole) {
        console.log('Role does not exist, creating new role');
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'tutor' as 'tutor' | 'owner' | 'admin' | 'student' | 'parent',
            is_primary: true
          });
          
        if (roleError) {
          console.error('Error creating role:', roleError);
          return false;
        } else {
          console.log('Role created successfully');
        }
      } else {
        console.log('Role already exists, skipping creation');
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error in createProfileAndRole:', error);
      return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Insert tutor into tutors table (without specialities)
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .insert({
          title: data.title,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          education: data.education,
          normal_hourly_rate: data.normal_hourly_rate,
          absence_hourly_rate: data.absence_hourly_rate,
          status: 'active'
        })
        .select()
        .single();

      if (tutorError) throw tutorError;

      // Insert tutor-subject relationships
      if (data.subjectIds.length > 0) {
        const tutorSubjects = data.subjectIds.map(subjectId => ({
          tutor_id: tutorData.id,
          subject_id: subjectId
        }));

        const { error: subjectsError } = await supabase
          .from('tutor_subjects')
          .insert(tutorSubjects);

        if (subjectsError) {
          console.error('Error inserting tutor subjects:', subjectsError);
          toast({
            title: "Tutor created successfully",
            description: "However, there was an issue saving subject selections.",
            variant: "destructive"
          });
        }
      }

      // Insert availability slots if any
      if (availabilitySlots.length > 0) {
        const availabilityData = availabilitySlots.map(slot => ({
          tutor_id: tutorData.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time
        }));

        const { error: availabilityError } = await supabase
          .from('tutor_availability')
          .insert(availabilityData);

        if (availabilityError) {
          console.error('Error inserting availability:', availabilityError);
          toast({
            title: "Tutor created successfully",
            description: "However, there was an issue saving availability schedule.",
            variant: "destructive"
          });
        }
      }

      if (data.sendInvite) {
        const { error: inviteError } = await supabase.functions.invoke('send-tutor-invite', {
          body: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            tutorId: tutorData.id
          }
        });

        if (inviteError) {
          toast({
            title: "Tutor created successfully",
            description: "However, there was an issue sending the invitation email.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Tutor created successfully",
            description: "An invitation email has been sent to the tutor.",
          });
        }
      } else if (data.createAccount) {
        // Create user account with default password and proper metadata
        console.log('Creating user account with metadata:', {
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'tutor'
        });
        
        const { data: userData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: DEFAULT_PASSWORD,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName,
              role: 'tutor', // This is important for the trigger
            }
          }
        });

        if (signUpError) {
          console.error('Error creating user account:', signUpError);
          toast({
            title: "Tutor created successfully",
            description: "However, there was an issue creating their account: " + signUpError.message,
            variant: "destructive"
          });
        } else if (userData && userData.user) {
          console.log('User account created successfully, user ID:', userData.user.id);
          
          // Send welcome email
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              userId: userData.user.id,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: 'tutor',
              password: DEFAULT_PASSWORD
            }
          });

          if (emailError) {
            console.error('Error sending welcome email:', emailError);
          }
          
          // Wait a moment for the trigger to work
          setTimeout(async () => {
            // Double-check that the trigger worked
            const { data: profileCheck, error: profileCheckError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', userData.user!.id)
              .maybeSingle();
              
            if (profileCheckError) {
              console.error('Error checking profile:', profileCheckError);
            }
              
            // If no profile, create one manually as fallback
            if (!profileCheck) {
              console.log('No profile found after 1.5s, using fallback mechanism');
              const success = await createProfileAndRole(userData.user!.id, data.firstName, data.lastName);
              
              if (success) {
                console.log('Profile and role created manually as fallback');
              } else {
                console.error('Failed to create profile and role manually');
                toast({
                  title: "Account created but profile setup failed",
                  description: "The account was created but there was a problem setting up the user profile. Please check the user in Supabase.",
                  variant: "destructive"
                });
              }
            } else {
              console.log('Profile found, trigger worked successfully');
            }
          }, 1500);
          
          if (emailError) {
            toast({
              title: "Tutor account created successfully",
              description: `Account created with default password: ${DEFAULT_PASSWORD}. However, there was an issue sending the welcome email.`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Tutor account created successfully",
              description: "Account created and welcome email sent with login credentials.",
            });
          }
        }
      } else {
        toast({
          title: "Tutor created successfully",
          description: "The tutor has been added to the system."
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating tutor:', error);
      toast({
        title: "Failed to create tutor",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Tutor</DialogTitle>
          <DialogDescription>
            Enter the tutor's details below to add them to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Mr.">Mr.</SelectItem>
                        <SelectItem value="Ms.">Ms.</SelectItem>
                        <SelectItem value="Mrs.">Mrs.</SelectItem>
                        <SelectItem value="Dr.">Dr.</SelectItem>
                        <SelectItem value="Prof.">Prof.</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.smith@example.com" type="email" {...field} />
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
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="subjectIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects</FormLabel>
                    <FormControl>
                      <SubjectSelector
                        selectedSubjectIds={field.value}
                        onSubjectsChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the tutor's background and teaching style..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Availability Schedule</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addAvailabilitySlot}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Time Slot
                </Button>
              </div>
              
              {availabilitySlots.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-md text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p>No availability schedules added yet.</p>
                  <p className="text-sm">Click "Add Time Slot" to specify when this tutor is available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilitySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                      <div className="flex-1">
                        <Select 
                          value={slot.day_of_week} 
                          onValueChange={(value) => updateAvailabilitySlot(slot.id, 'day_of_week', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input 
                          type="time" 
                          value={slot.start_time} 
                          onChange={(e) => updateAvailabilitySlot(slot.id, 'start_time', e.target.value)} 
                        />
                      </div>
                      <div className="flex-1">
                        <Input 
                          type="time" 
                          value={slot.end_time} 
                          onChange={(e) => updateAvailabilitySlot(slot.id, 'end_time', e.target.value)} 
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAvailabilitySlot(slot.id)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="normal_hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Normal Hourly Rate (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="25.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="absence_hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Absence Hourly Rate (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="12.50" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Educational background, degrees, certifications..." 
                      className="min-h-[60px]" 
                      {...field} 
                    />
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
                        The tutor account will be created with the default password: <strong>{DEFAULT_PASSWORD}</strong>
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
                        The tutor will receive an email with instructions to create an account.
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
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Tutor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTutorForm;
