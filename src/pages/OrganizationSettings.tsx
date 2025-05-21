
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import PageTitle from '@/components/ui/PageTitle';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'),
  logoUrl: z.string().url('Must be a valid URL').or(z.string().length(0)),
  domainName: z.string().url('Must be a valid URL').or(z.string().length(0)),
});

type FormValues = z.infer<typeof formSchema>;

const OrganizationSettings = () => {
  const { isOwner } = useAuth();
  const { organization, refreshOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: organization?.name || '',
      primaryColor: organization?.primary_color || '#4f46e5',
      logoUrl: organization?.logo_url || '',
      domainName: '',
    },
  });

  // Update form values when organization data is loaded
  React.useEffect(() => {
    if (organization) {
      form.reset({
        organizationName: organization.name,
        primaryColor: organization.primary_color || '#4f46e5',
        logoUrl: organization.logo_url || '',
        domainName: '',
      });
    }
  }, [organization, form]);

  const onSubmit = async (data: FormValues) => {
    if (!organization) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.organizationName,
          primary_color: data.primaryColor,
          logo_url: data.logoUrl || null,
        })
        .eq('id', organization.id);

      if (error) throw error;

      // Also update the organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .upsert({
          organization_name: data.organizationName,
          primary_color: data.primaryColor,
          logo_url: data.logoUrl || null,
          domain_name: data.domainName || null,
        }, { onConflict: 'organization_name' });

      if (settingsError) throw settingsError;

      await refreshOrganization();

      toast({
        title: 'Settings updated',
        description: 'Your organization settings have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update organization settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!organization) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex flex-col flex-1 lg:pl-64">
          <Navbar toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-500">No organization found. Please create one first.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <PageTitle 
            title="Organization Settings" 
            subtitle="Manage your organization details and preferences"
          />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your organization profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-8 w-8 rounded-full border"
                              style={{ backgroundColor: field.value }}
                            />
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {isOwner && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Advanced Settings</h3>
                        <p className="text-sm text-muted-foreground">
                          These settings are only available to organization owners
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="domainName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Domain</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://yourdomain.com" 
                                disabled={!isOwner}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-amber-50 p-4 rounded border border-amber-200">
                        <p className="text-sm text-amber-800">
                          <strong>Note:</strong> Custom domain setup requires DNS configuration.
                          Contact support for assistance with setting up your custom domain.
                        </p>
                      </div>
                    </>
                  )}

                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default OrganizationSettings;
