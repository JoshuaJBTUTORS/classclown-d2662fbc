import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

interface AddParentOnlyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters." }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  phone: z.string().optional(),
  billing_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const AddParentOnlyForm: React.FC<AddParentOnlyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, isOwner } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      billing_address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      console.log('=== FRONTEND AUTH DEBUG ===');
      
      // Check if user is authenticated and has proper role
      if (!user) {
        console.log('❌ No user found in auth context');
        toast.error("You must be logged in to create parent accounts");
        return;
      }

      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        isAdmin,
        isOwner
      });

      if (!isAdmin && !isOwner) {
        console.log('❌ User lacks admin/owner permissions');
        toast.error("You don't have permission to create parent accounts");
        return;
      }

      // Get current session for debugging
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Session state:', {
        hasSession: !!session?.session,
        accessToken: session?.session?.access_token ? 'EXISTS' : 'MISSING',
        expiresAt: session?.session?.expires_at,
        currentTime: Math.floor(Date.now() / 1000),
        isExpired: session?.session?.expires_at ? session.session.expires_at < Math.floor(Date.now() / 1000) : 'UNKNOWN',
        sessionError
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error("Session error. Please log in again.");
        return;
      }

      if (!session?.session?.access_token) {
        console.error('No access token in session');
        toast.error("No valid session. Please log in again.");
        return;
      }

      console.log('🚀 Making API call to create-parent-account with payload:', {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email
      });

      // Call the server-side edge function to create parent account
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'create-parent-account',
        {
          body: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            billing_address: data.billing_address,
            emergency_contact_name: data.emergency_contact_name,
            emergency_contact_phone: data.emergency_contact_phone,
          }
        }
      );

      console.log('📋 Function response:', { result, functionError });

      if (functionError) {
        console.error('❌ Function error details:', {
          message: functionError.message,
          context: functionError.context,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code,
          fullError: functionError
        });
        
        if (functionError.message?.includes('401') || functionError.message?.includes('Unauthorized')) {
          toast.error("Authentication failed. Please log in again and try again.");
        } else if (functionError.message?.includes('403') || functionError.message?.includes('Insufficient permissions')) {
          toast.error("You don't have permission to create parent accounts.");
        } else {
          toast.error(functionError.message || "Failed to create parent account");
        }
        return;
      }

      if (result?.error) {
        console.error('Server error:', result.error);
        toast.error(result.error);
        return;
      }

      toast.success(result?.message || "Parent account created successfully! Default password: classbeyond123!");

      form.reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cc-dialog sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[var(--radius-soft)] border-0 shadow-[var(--shadow-soft-lg)] p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-foreground">
              <UserPlus className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="font-heading text-2xl font-extrabold tracking-tight">
                Create Parent Only Account
              </DialogTitle>
              <DialogDescription>
                Create a standalone parent account without any students. Students can be added later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="rounded-[var(--radius-soft)] border-0 bg-pastel-mint shadow-[var(--shadow-soft)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading font-extrabold tracking-tight flex items-center gap-2 text-pastel-mint-foreground">
                  <UserPlus className="h-4 w-4" />
                  Parent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                          <Input placeholder="Smith" {...field} />
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
                      <FormLabel>Email Address *</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            <DialogFooter className="gap-2 sm:gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-medium bg-transparent text-foreground border border-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/5 disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium bg-foreground text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Creating Account..." : "Create Parent Account"}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddParentOnlyForm;