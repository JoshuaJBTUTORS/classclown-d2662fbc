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
import { Loader2 } from 'lucide-react';
import { DoodleCoin } from '@/components/progress/ProgressDoodles';
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
      const referrerName = `${profile.first_name} ${profile.last_name}`.trim();

      // Store the referral first so it is always tracked, even if the email fails
      const { data: inserted, error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: user.id,
          referrer_name: referrerName,
          referrer_email: user.email,
          friend_name: data.friendName,
          friend_email: data.friendEmail,
          friend_phone: data.friendPhone,
          status: 'invited',
          source: 'calendar_dialog',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error saving referral:', insertError);
      }

      // Call the edge function to send the referral email
      const { error } = await supabase.functions.invoke('send-referral-notification', {
        body: {
          referrerName,
          referrerEmail: user.email,
          friendName: data.friendName,
          friendEmail: data.friendEmail,
          friendPhone: data.friendPhone,
          referralId: inserted?.id,
        },
      });

      if (error) {
        console.error('Error sending referral:', error);
        if (!inserted) {
          toast.error('Failed to send referral. Please try again.');
          return;
        }
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
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-0 shadow-[var(--shadow-soft)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-heading">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pastel-blush text-pastel-blush-foreground">
              <DoodleCoin className="h-5 w-5" />
            </span>
            <span className="flex items-center gap-2">
              Refer a friend
              <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                £100
              </span>
            </span>
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
                  <FormLabel className="text-sm font-semibold text-foreground">Friend's Name</FormLabel>
                  <FormControl>
                    <Input 
                      className="h-11 rounded-2xl border-border bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
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
                  <FormLabel className="text-sm font-semibold text-foreground">Friend's Email</FormLabel>
                  <FormControl>
                    <Input 
                      className="h-11 rounded-2xl border-border bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
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
                  <FormLabel className="text-sm font-semibold text-foreground">Friend's Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      className="h-11 rounded-2xl border-border bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                      type="tel"
                      placeholder="Enter your friend's phone number" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-full border-foreground bg-transparent px-5 text-foreground hover:bg-foreground/5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90">
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