
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tutor } from '@/types/tutor';
import AvailabilityManager from './AvailabilityManager';

interface AddTutorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  specialities: z.string().optional(),
  bio: z.string().optional(),
  sendInvite: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const AddTutorForm: React.FC<AddTutorFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('details');
  const [newTutor, setNewTutor] = useState<Tutor | null>(null);
  const { organization } = useOrganization();

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
    },
  });

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

      // Store the newly created tutor for the availability tab
      setNewTutor(tutorData);
      
      // Switch to availability tab after successful creation
      setCurrentTab('availability');

      // Only finish the process if we're not setting availability
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
          description: "You can now set their availability."
        });
      }
    } catch (error: any) {
      console.error('Error creating tutor:', error);
      toast({
        title: "Failed to create tutor",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess?.();
    onClose();
    // Reset form and state
    form.reset();
    setNewTutor(null);
    setCurrentTab('details');
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New Tutor</DialogTitle>
          <DialogDescription>
            Enter the tutor's details below to add them to the system.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="availability" disabled={!newTutor}>Availability</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
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
          </TabsContent>
          
          <TabsContent value="availability">
            {newTutor && (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Set Initial Availability</h3>
                  <p className="text-sm text-muted-foreground">Define when this tutor is available for lessons.</p>
                </div>
                
                <AvailabilityManager tutor={newTutor} isEditable={true} />
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleFinish}>
                    Finish
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddTutorForm;
