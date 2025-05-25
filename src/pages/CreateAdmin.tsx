
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_PASSWORD = 'jbtutors123!';

const CreateAdmin = () => {
  const { userRole, isOwner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Redirect if not an owner
  React.useEffect(() => {
    if (userRole !== 'owner') {
      toast({
        title: "Access denied",
        description: "Only owners can create admin accounts.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [userRole, navigate]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      console.log('Creating admin account using edge function...');

      // Use the new edge function to create account without affecting current session
      const { data: result, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'admin',
          password: DEFAULT_PASSWORD,
          sendWelcomeEmail: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create admin account');
      }

      if (result?.error) {
        console.error('Account creation error:', result.error);
        throw new Error(result.error);
      }

      console.log('Admin account created successfully:', result);

      if (result?.emailError) {
        toast({
          title: "Admin account created successfully",
          description: `Account created for ${data.firstName} ${data.lastName}, but there was an issue sending the welcome email.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Admin account created successfully",
          description: `Account created for ${data.firstName} ${data.lastName} and welcome email sent with login credentials.`,
        });
      }

      form.reset();
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      toast({
        title: "Failed to create admin account",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Create Admin Account" 
            subtitle="Create a new administrator account"
          />
          
          {!isOwner && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Only owners can create admin accounts. You do not have permission to access this page.
              </AlertDescription>
            </Alert>
          )}
          
          {isOwner && (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>
                  Create a new administrator account with full permissions to manage the platform.
                  The account will be created with the default password: <strong>{DEFAULT_PASSWORD}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Admin Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default CreateAdmin;
