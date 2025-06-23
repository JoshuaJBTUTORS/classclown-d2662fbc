
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Sparkles } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long.",
  }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

// Define the type for our invitation data from RPC
interface InvitationData {
  id: string;
  email: string;
  role: string;
  entity_id?: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  organization_name?: string;
  first_name?: string;
  last_name?: string;
}

const Invite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [processingSignup, setProcessingSignup] = useState(false);
  const [invitation, setInvitation] = useState<{
    email: string;
    role: string;
    organization_name?: string;
    first_name?: string;
    last_name?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }

      try {
        // Use the POST method to call the function instead of rpc()
        const { data, error: inviteError } = await supabase.functions.invoke('get-invitation-by-token', {
          body: { token },
        });

        if (inviteError || !data) {
          throw new Error('Invalid or expired invitation');
        }

        // Check if invitation has expired
        if (new Date(data.expires_at) < new Date()) {
          throw new Error('This invitation has expired');
        }

        setInvitation({
          email: data.email,
          role: data.role,
          organization_name: data.organization_name,
          first_name: data.first_name,
          last_name: data.last_name,
        });
      } catch (err: any) {
        console.error('Error verifying invitation:', err);
        setError(err.message || 'Failed to verify invitation');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!invitation || !token) return;
    
    setProcessingSignup(true);
    
    try {
      // Register the user with the invitation email and provided password
      const { error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: data.password,
        options: {
          data: {
            first_name: invitation.first_name,
            last_name: invitation.last_name,
            role: invitation.role,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      // Use POST method for the accept-invitation function
      const { error: acceptError } = await supabase.functions.invoke('accept-invitation', {
        body: { token },
      });

      if (acceptError) throw acceptError;
      
      toast({
        title: "Welcome aboard! 🎉",
        description: "Your account is ready - start learning for free!",
      });
      
      // Redirect to login page
      navigate('/auth');
    } catch (err: any) {
      console.error('Error creating account:', err);
      toast({
        title: "Failed to create account",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setProcessingSignup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
                alt="Class Clown Logo" 
                className="h-36 w-auto" 
              />
            </div>
            <CardTitle className="text-red-500">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/auth')}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/d35d104e-dca8-466e-8820-20dcc5131ad3.png" 
              alt="Class Clown Logo" 
              className="h-36 w-auto" 
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">
              <Gift className="h-4 w-4 mr-2" />
              Start for Free
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Complete Your Registration
          </CardTitle>
          <CardDescription className="text-base">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-green-600">Free access</span>
              <span>to {invitation?.organization_name || "our learning platform"}!</span>
            </div>
            <p className="text-sm text-gray-600">
              You've been invited to join as a {invitation?.role}. Get started with full access to our courses and resources.
            </p>
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input value={invitation?.email} readOnly disabled className="bg-gray-100" />
                  </FormControl>
                </FormItem>
              </div>
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Choose a secure password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                disabled={processingSignup}
                size="lg"
              >
                {processingSignup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your free account...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Start Learning for Free
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500">
                No credit card required • Full access to all features
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Invite;
