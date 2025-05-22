
import React, { useState, useRef } from 'react';
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
  const [activeTab, setActiveTab] = useState('details');
  const { organization } = useOrganization();
  const availabilityManagerRef = useRef<{ saveAvailabilities: () => Promise<boolean> } | null>(null);

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

      // Save availability settings
      if (availabilityManagerRef.current) {
        const availabilitySaved = await availabilityManagerRef.current.saveAvailabilities();
        if (!availabilitySaved) {
          throw new Error("Failed to save tutor availability");
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tutor</DialogTitle>
          <DialogDescription>
            Enter the tutor's details below to add them to the system.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Basic Information</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="details">
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
              </TabsContent>
              
              <TabsContent value="availability">
                <AvailabilityManager 
                  tutorId="" 
                  ref={(ref) => {
                    availabilityManagerRef.current = ref;
                  }}
                />
              </TabsContent>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex items-center gap-2"
                >
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddTutorForm;
