
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
      // Send welcome email BEFORE creating the account to avoid session switching
      let emailSent = false;
      const tempUserId = crypto.randomUUID(); // Generate temporary ID for email
      
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          userId: tempUserId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'admin',
          password: DEFAULT_PASSWORD
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        toast({
          title: "Email sending failed",
          description: "We'll still create the account, but the welcome email couldn't be sent.",
          variant: "destructive"
        });
      } else {
        emailSent = true;
      }

      // Create user account with default password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: DEFAULT_PASSWORD,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'admin',
          }
        }
      });

      if (signUpError) {
        toast({
          title: "Failed to create admin account",
          description: emailSent 
            ? "Email was sent but account creation failed: " + signUpError.message
            : "Both email and account creation failed: " + signUpError.message,
          variant: "destructive"
        });
      } else if (authData.user) {
        if (emailSent) {
          toast({
            title: "Admin account created successfully",
            description: `Admin account for ${data.firstName} ${data.lastName} has been created and a welcome email has been sent with login credentials.`,
          });
        } else {
          toast({
            title: "Admin account created successfully",
            description: `Admin account for ${data.firstName} ${data.lastName} has been created with default password: ${DEFAULT_PASSWORD}. However, the welcome email couldn't be sent.`,
            variant: "destructive"
          });
        }
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
