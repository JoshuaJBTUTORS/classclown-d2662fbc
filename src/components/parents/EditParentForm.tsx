
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Parent } from '@/types/parent';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';

interface EditParentFormProps {
  parent: Parent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedParent: Parent) => void;
}

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  has_complimentary_access: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const EditParentForm: React.FC<EditParentFormProps> = ({ parent, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: parent?.first_name || "",
      last_name: parent?.last_name || "",
      email: parent?.email || "",
      phone: parent?.phone || "",
      billing_address: parent?.billing_address || "",
      emergency_contact_name: parent?.emergency_contact_name || "",
      emergency_contact_phone: parent?.emergency_contact_phone || "",
      has_complimentary_access: parent?.has_complimentary_access || false,
    },
  });

  // Reset form when parent changes
  React.useEffect(() => {
    if (parent) {
      form.reset({
        first_name: parent.first_name || "",
        last_name: parent.last_name || "",
        email: parent.email || "",
        phone: parent.phone || "",
        billing_address: parent.billing_address || "",
        emergency_contact_name: parent.emergency_contact_name || "",
        emergency_contact_phone: parent.emergency_contact_phone || "",
        has_complimentary_access: parent.has_complimentary_access || false,
      });
    }
  }, [parent, form]);

  const onSubmit = async (data: FormData) => {
    if (!parent) return;

    setLoading(true);
    try {
      // Update parent profile
      const { data: updatedParent, error } = await supabase
        .from('parents')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          billing_address: data.billing_address || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
          has_complimentary_access: data.has_complimentary_access,
        })
        .eq('id', parent.id)
        .select()
        .single();

      if (error) throw error;

      // If email changed, update auth user email
      if (data.email !== parent.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (authError) {
          console.warn('Failed to update auth email:', authError.message);
          toast.error('Profile updated but email change failed. Please contact support.');
        }
      }

      toast.success('Parent profile updated successfully!');
      onUpdate(updatedParent);
      onClose();
    } catch (error: any) {
      console.error('Error updating parent:', error);
      toast.error(error.message || 'Failed to update parent profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Parent Profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
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
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="has_complimentary_access"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Free Course Access</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Grant complimentary access to all e-learning courses
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" type="email" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
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
                {loading ? "Updating..." : "Update Parent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditParentForm;
