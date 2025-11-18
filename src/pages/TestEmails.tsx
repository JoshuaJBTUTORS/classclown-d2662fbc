import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TestEmails = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const testEmail = "joshuaekundayo1@yahoo.com";

  const sendTestEmail = async (emailType: 'password-reset' | 'welcome' | 'lesson-reminder') => {
    setLoading(emailType);
    try {
      const { data, error } = await supabase.functions.invoke('test-emails', {
        body: {
          emailType,
          testEmail
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent!",
        description: `${emailType} email sent to ${testEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Testing</h1>
        <p className="text-muted-foreground">
          Test the new Class Beyond email system by sending example emails to {testEmail}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Email</CardTitle>
            <CardDescription>
              Test the password reset email template with new branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => sendTestEmail('password-reset')}
              disabled={loading === 'password-reset'}
              className="w-full"
            >
              {loading === 'password-reset' ? 'Sending...' : 'Send Password Reset Email'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Email</CardTitle>
            <CardDescription>
              Test a welcome email for new users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => sendTestEmail('welcome')}
              disabled={loading === 'welcome'}
              className="w-full"
            >
              {loading === 'welcome' ? 'Sending...' : 'Send Welcome Email'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Reminder Email</CardTitle>
            <CardDescription>
              Test a lesson reminder email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => sendTestEmail('lesson-reminder')}
              disabled={loading === 'lesson-reminder'}
              className="w-full"
            >
              {loading === 'lesson-reminder' ? 'Sending...' : 'Send Lesson Reminder'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Email Configuration:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>✅ Domain: @classbeyondacademy.io</li>
          <li>✅ From addresses updated</li>
          <li>✅ Admin emails migrated</li>
          <li>✅ All templates rebranded to "Class Beyond"</li>
        </ul>
      </div>
    </div>
  );
};

export default TestEmails;
