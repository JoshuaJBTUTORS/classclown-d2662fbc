import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const referralSchema = z.object({
  friendName: z.string().min(1, 'Please enter your friend\'s name'),
  friendEmail: z.string().email('Please enter a valid email address'),
  friendPhone: z.string().min(1, 'Please enter your friend\'s phone number'),
});

type ReferralForm = z.infer<typeof referralSchema>;

interface ReferFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferFriendDialog: React.FC<ReferFriendDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReferralForm>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      friendName: '',
      friendEmail: '',
      friendPhone: '',
    },
  });

  const onSubmit = async (data: ReferralForm) => {
    if (!user || !profile) {
      toast.error('You must be logged in to refer a friend');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call the edge function to send the referral email
      const { error } = await supabase.functions.invoke('send-referral-notification', {
        body: {
          referrerName: `${profile.first_name} ${profile.last_name}`,
          referrerEmail: user.email,
          friendName: data.friendName,
          friendEmail: data.friendEmail,
          friendPhone: data.friendPhone,
        },
      });

      if (error) {
        console.error('Error sending referral:', error);
        toast.error('Failed to send referral. Please try again.');
        return;
      }

      toast.success('Referral sent successfully! We\'ll be in touch soon.');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting referral:', error);
      toast.error('Failed to send referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Refer a Friend for £100
          </DialogTitle>
          <DialogDescription>
            Know someone who could benefit from our tutoring services? Refer them and earn £100 when they sign up!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="friendName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your friend's full name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="friendEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Enter your friend's email address" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="friendPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="Enter your friend's phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Referral
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};