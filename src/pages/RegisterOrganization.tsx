
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define validation schema
const formSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be less than 63 characters')
    .regex(/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof formSchema>;

const RegisterOrganization = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      subdomain: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setGeneralError(null);

    try {
      // Check if subdomain is already taken
      const { data: existingOrg, error: subdomainCheckError } = await supabase
        .from('organizations')
        .select('id')
        .eq('subdomain', data.subdomain)
        .maybeSingle();

      if (subdomainCheckError) {
        setGeneralError('Failed to check subdomain availability');
        console.error('Subdomain check error:', subdomainCheckError);
        setIsLoading(false);
        return;
      }

      if (existingOrg) {
        form.setError('subdomain', {
          type: 'manual',
          message: 'This subdomain is already taken',
        });
        setIsLoading(false);
        return;
      }

      // Check if email is already in use by trying to sign in
      // We'll use a different approach instead of getUserByEmail
      const { data: emailCheck, error: emailCheckError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false
        }
      });

      if (!emailCheckError) {
        // No error means the email exists (or OTP was sent which means it's a valid email)
        form.setError('email', {
          type: 'manual',
          message: 'This email is already registered',
        });
        setIsLoading(false);
        return;
      }

      // Clean up existing auth state before sign up
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Try to sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Pre-signup signout step:", err);
      }

      // Register the user with organization metadata
      await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        organization_name: data.organizationName,
        subdomain: data.subdomain,
        role: 'owner',
      });

      toast({
        title: 'Registration successful',
        description: 'Your organization has been registered. Please check your email to confirm your account.',
      });

      // Redirect to login page
      navigate('/auth');
    } catch (error: any) {
      console.error('Registration error:', error);
      setGeneralError(error.message || 'Failed to register organization');
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to register organization',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png" 
              alt="Class Clown Logo" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Register Your Organization</CardTitle>
          <CardDescription>
            Create a new tutoring organization and get your own personalized domain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Organization Details</h3>
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Tutoring" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input placeholder="acme" {...field} />
                          <span className="ml-2 text-muted-foreground">.yourdomain.com</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Admin Account</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Registering...' : 'Register Organization'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>
              Sign in
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterOrganization;
