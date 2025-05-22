
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Tutor } from '@/types/tutor';
import TutorAvailabilityTab from './TutorAvailabilityTab';

interface EditTutorFormProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTutor: Tutor) => void;
}

const formSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  title: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  specialities: z.string().optional(),
  status: z.string(),
});

const EditTutorForm: React.FC<EditTutorFormProps> = ({ 
  tutor, 
  isOpen, 
  onClose,
  onUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: tutor?.first_name || '',
      last_name: tutor?.last_name || '',
      title: tutor?.title || '',
      email: tutor?.email || '',
      phone: tutor?.phone || '',
      bio: tutor?.bio || '',
      education: tutor?.education || '',
      specialities: tutor?.specialities ? tutor.specialities.join(', ') : '',
      status: tutor?.status || 'active',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!tutor) return;
    
    try {
      setIsSubmitting(true);
      
      // Process specialities into an array
      const specialitiesArray = values.specialities
        ? values.specialities.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      
      const updatedTutor = {
        ...tutor,
        first_name: values.first_name,
        last_name: values.last_name,
        title: values.title,
        email: values.email,
        phone: values.phone,
        bio: values.bio,
        education: values.education,
        specialities: specialitiesArray,
        status: values.status,
      };
      
      const { error } = await supabase
        .from('tutors')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          title: values.title,
          email: values.email,
          phone: values.phone,
          bio: values.bio,
          education: values.education,
          specialities: specialitiesArray,
          status: values.status,
        })
        .eq('id', tutor.id);
      
      if (error) throw error;
      
      // Send the updated tutor back to the parent component
      onUpdate(updatedTutor);
      onClose();
    } catch (error: any) {
      console.error('Error updating tutor:', error);
      toast.error('Failed to update tutor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tutor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit {tutor.first_name} {tutor.last_name}'s Profile</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dr., Prof., Mr., Mrs." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input required {...field} />
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
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input required {...field} />
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
                          <Input type="email" required {...field} />
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
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="specialities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialities</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Mathematics, Physics, Chemistry (comma-separated)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. PhD in Mathematics, University of Cambridge" 
                          {...field} 
                        />
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
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter tutor bio here..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          {...field}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="pending">Pending</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="availability" className="pt-4">
            <TutorAvailabilityTab tutor={tutor} isEditable={true} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditTutorForm;
