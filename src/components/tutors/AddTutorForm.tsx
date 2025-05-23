
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { v4 as uuidv4 } from 'uuid';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Mail, Plus, Clock } from 'lucide-react';
import { AvailabilitySlot } from '@/types/tutor';

interface AddTutorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Array of days of the week
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  specialities: z.string().optional(),
  bio: z.string().optional(),
  sendInvite: z.boolean().default(false),
  availability: z.array(z.object({
    id: z.string(),
    day_of_week: z.string(),
    start_time: z.string(),
    end_time: z.string()
  })).default([])
});

type FormData = z.infer<typeof formSchema>;

const AddTutorForm: React.FC<AddTutorFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { organization } = useOrganization();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialities: "",
      bio: "",
      sendInvite: false,
      availability: []
    },
  });

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

  const removeAvailabilitySlot = (idToRemove: string) => {
    const updatedSlots = availabilitySlots.filter(slot => slot.id !== idToRemove);
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      // Convert comma-separated specialities to an array
      const specialitiesArray = data.specialities
        ?.split(',')
        .map(s => s.trim())
        .filter(s => s !== '');

      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          specialities: specialitiesArray,
          bio: data.bio,
          status: 'active',
          organization_id: organization?.id || null
        })
        .select()
        .single();

      if (tutorError) throw tutorError;

      // Insert availability slots if any
      if (data.availability.length > 0) {
        const availabilityData = data.availability.map(slot => ({
          tutor_id: tutorData.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time
        }));

        const { error: availabilityError } = await supabase
          .from('tutor_availability')
          .insert(availabilityData);

        if (availabilityError) {
          console.error('Error saving availability:', availabilityError);
          toast({
            title: "Tutor created",
            description: "However, there was an issue saving the availability schedule.",
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
            description: "However, there was an issue sending the invitation email."
          });
        } else {
          toast({
            title: "Tutor created successfully",
            description: "An invitation email has been sent to the tutor."
          });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair">Add New Tutor</DialogTitle>
          <DialogDescription>
            Enter the tutor's details below to add them to the system.
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
                      <Input placeholder="Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" type="email" {...field} />
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

            <FormField
              control={form.control}
              name="specialities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialities (Comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Math, Science, English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description about the tutor..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Availability Section */}
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
            
            <FormField
              control={form.control}
              name="sendInvite"
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
                      Send invitation email
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      The tutor will receive an email with instructions to create an account.
                    </p>
                  </div>
                </FormItem>
              )}
            />

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
                {loading ? "Creating..." : form.watch("sendInvite") ? (
                  <>
                    <Mail className="h-4 w-4" />
                    Create & Invite Tutor
                  </>
                ) : "Create Tutor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTutorForm;
